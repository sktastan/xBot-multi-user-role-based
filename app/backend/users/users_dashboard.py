#===========================================================
#  
#  users_dashboard.py
#  Core logic for user AI interactions, chat history, and 
#  RAG integration.
#  
#============================================================
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os
import gc
from dotenv import load_dotenv
import json
from app.backend.llms.llm_ollama import Ollama
from app.backend.llms.llm_huggingface import HuggingFace
from app.backend.llms.llm_openai import OpenAI
from app.backend.llms.llm_claude import Claude
from app.backend.llms.llm_gemini import Gemini
from app.backend.database import get_db
from app.backend.rag.langchain_rag import RAG
import torch

# Ensure environment variables are loaded from the specific backend directory
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(dotenv_path=env_path)

router = APIRouter()

# Lazy loading cache for LLM instances to avoid overhead at startup
_llm_cache = {}

# Initialize RAG once
rag_system = RAG()
embeddings = rag_system.set_embedding_model()
if embeddings:
    rag_system.initialize_vector_store(embeddings, persist_directory="./chroma_db")

# ---------------------------------------------------------------------
#   Schema for user chat requests.
# -------------------------------------------------------------------- 
class ChatRequest(BaseModel):
    email: str
    prompt: str
    conversation_id: str
    provider: str = "ollama"
    model: str = None
    stream: bool = False

# ---------------------------------------------------------------------
#   Persists a chat interaction to the database.
# -------------------------------------------------------------------
def save_chat_to_db(email, conversation_id, provider, prompt, response):
    """Helper to save chat history to the database."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO chat_history (email, conversation_id, provider, prompt, response) VALUES (?, ?, ?, ?, ?)",
            (email, conversation_id, provider, prompt, response)
        )
        conn.commit()

# ---------------------------------------------------------------------
#   Determines the authorization role name for a given email.
# -------------------------------------------------------------------
def get_user_role(email: str):
    """Fetch role name from the database for either users or admins."""
    with get_db() as conn:
        cursor = conn.cursor()
        try:
            # Try users table first
            cursor.execute("""
                SELECT r.name FROM users u 
                JOIN roles r ON u.role_id = r.id 
                WHERE u.email = ?
            """, (email,))
            res = cursor.fetchone()
            if res: return res[0]
        except Exception:
            pass # Table might not exist yet
        
        # Try admins table
        cursor.execute("""
            SELECT r.name FROM admins a 
            JOIN roles r ON a.role_id = r.id 
            WHERE a.email = ?
        """, (email,))
        res = cursor.fetchone()
        return res[0] if res else "Employee Level"

# ---------------------------------------------------------------------
#   Helper to purge HuggingFace resources from memory.
# -------------------------------------------------------------------
def unload_huggingface():
    """Explicitly releases HuggingFace model and tokenizer from VRAM/RAM."""
    unloaded = False
    if "huggingface" in _llm_cache:
        print("[DASHBOARD] Explicitly purging HuggingFace resources...")
        hf_instance = _llm_cache.pop("huggingface")
        if hf_instance:
            try:
                hf_instance.unload()
                unloaded = True
            except Exception as e:
                print(f"[DASHBOARD] Error during HuggingFace instance unload: {e}")
            del hf_instance
    
    # Aggressive multi-pass garbage collection
    gc.collect()
    gc.collect()
    
    # Direct CUDA cache clearing if available
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.ipc_collect()
        print("[DASHBOARD] CUDA cache cleared.")
    
    if unloaded:
        print("[DASHBOARD] HuggingFace has been successfully evicted from cache and memory.")
    return unloaded

# ---------------------------------------------------------------------
#   Endpoint for explicit resource management.
# -------------------------------------------------------------------
@router.post("/chat/unload")
async def manual_unload():
    """Triggers immediate removal of heavy models from memory."""
    unloaded = unload_huggingface()
    return {"status": "success", "unloaded": unloaded}

# ---------------------------------------------------------------------
#   Handles AI chat requests with RAG and optional streaming.
# -------------------------------------------------------------------
@router.post("/chat")
async def chat_with_ollama(request: ChatRequest):
    try:
        # Normalize provider name to lowercase for mapping
        provider_key = request.provider.lower() if request.provider else "ollama"

        # Lazy initialization: only load the provider if it hasn't been used yet
        if provider_key not in _llm_cache:
            if provider_key == "openai":
                _llm_cache["openai"] = OpenAI()
            elif provider_key == "claude":
                _llm_cache["claude"] = Claude()
            elif provider_key == "gemini":
                _llm_cache["gemini"] = Gemini()
            elif provider_key == "ollama":
                _llm_cache["ollama"] = Ollama()
            elif provider_key == "huggingface":
                try:
                    _llm_cache["huggingface"] = HuggingFace()
                except Exception as e:
                    print(f"Warning: HuggingFace model failed to load: {e}")
                    _llm_cache["huggingface"] = None

        # Resource Management: If HuggingFace is loaded but not currently selected, unload it
        if provider_key != "huggingface":
            unload_huggingface()

        llm = _llm_cache.get(provider_key)
        
        # Fallback: if requested provider failed to load or is invalid, default to Ollama
        if llm is None:
            if "ollama" not in _llm_cache:
                _llm_cache["ollama"] = Ollama()
            llm = _llm_cache["ollama"]

        # Set model if requested
        if request.model:
            if hasattr(llm, 'setModel'):
                llm.setModel(request.model)
            else:
                llm.model = request.model

        # 1. RAG: Retrieve context based on role (Fail-safe wrapper)
        context_text = ""
        try:
            user_role = get_user_role(request.email)
            context_docs = rag_system.search_vector_store(request.prompt, user_role=user_role)
            if context_docs:
                context_text = "\n".join([f"Source: {d.page_content}" for d in context_docs])
        except Exception as rag_err:
            # If RAG fails (e.g. Ollama embedding service is down), log and continue
            print(f"Warning: RAG context retrieval failed. Proceeding without local context. Error: {rag_err}")
        
        # 2. Augment the prompt
        final_prompt = request.prompt
        if context_text:
            final_prompt = f"You are a helpful assistant. Use the following company information as context to answer the user's question. If the information is not present in the context, use your general knowledge to provide a helpful response.\n\nContext:\n{context_text}\n\nQuestion: {request.prompt}"

        if request.stream:
            def stream_generator():
                full_response = ""
                # We check if the provider class has a 'stream' method implemented
                if hasattr(llm, 'stream'):
                    for chunk in llm.stream(final_prompt):
                        full_response += chunk
                        # Format as JSON-encoded Server-Sent Event to handle special chars safely
                        yield f"data: {json.dumps({'content': chunk})}\n\n"
                else:
                    # Fallback to standard generate if streaming is not yet supported by the class
                    response_text = llm.generate(final_prompt)
                    full_response = response_text
                    yield f"data: {json.dumps({'content': response_text})}\n\n"
                
                # Save the complete interaction to the DB once streaming finishes
                save_chat_to_db(request.email, request.conversation_id, request.provider, request.prompt, full_response)

            return StreamingResponse(
                stream_generator(), 
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no" # Prevents Nginx/Proxies from buffering
                }
            )
        
        # Synchronous (Standard) Response
        response_text = llm.generate(final_prompt)
        save_chat_to_db(request.email, request.conversation_id, request.provider, request.prompt, response_text)
        return {"status": "success", "response": response_text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")

# ---------------------------------------------------------------------
#   Retrieves a summary of previous conversations for a user.
# -------------------------------------------------------------------
@router.get("/chat/conversations/{email}")
def get_conversations(email: str):
    with get_db() as conn:
        cursor = conn.cursor()
        # Get unique conversation IDs and the first prompt as a title
        cursor.execute("""
            SELECT conversation_id, MIN(prompt), MIN(timestamp)
            FROM chat_history 
            WHERE email = ? 
            GROUP BY conversation_id 
            ORDER BY MIN(timestamp) DESC
        """, (email,))
        rows = cursor.fetchall()
        return [{"id": row[0], "title": row[1][:30] + "..." if len(row[1]) > 30 else row[1], "createdAt": row[2]} for row in rows]

# ---------------------------------------------------------------------
#   Fetches the full message history for a specific conversation ID.
# -------------------------------------------------------------------
@router.get("/chat/history/{conversation_id}")
def get_chat_history(conversation_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT prompt, response, provider, timestamp FROM chat_history WHERE conversation_id = ? ORDER BY timestamp ASC", (conversation_id,))
        history = cursor.fetchall()
        return [{"prompt": row[0], "response": row[1], "provider": row[2], "timestamp": row[3]} for row in history]

# ---------------------------------------------------------------------
#   Deletes all records associated with a conversation.
# -------------------------------------------------------------------
@router.delete("/chat/conversations/{conversation_id}")
def delete_conversation(conversation_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM chat_history WHERE conversation_id = ?", (conversation_id,))
        conn.commit()
    return {"status": "success", "message": "Conversation deleted"}