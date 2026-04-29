#===========================================================
#  
#  admin_rag.py
#  API routes for managing the RAG system, including 
#  document uploads and status checks.
#  
#============================================================
import os
import shutil
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.backend.rag.langchain_rag import RAG, TEXT, PDF, CSV

router = APIRouter(prefix="/admin/rag", tags=["Admin RAG Management"])

# Initialize RAG system
rag_system = RAG()
embedding_model = rag_system.set_embedding_model()
rag_system.initialize_vector_store(embedding_model, persist_directory="./chroma_db")

# ---------------------------------------------------------------------
#   Handles file uploads and indexes them into the vector store.
# -------------------------------------------------------------------
@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    role: str = Form("Employee Level")
):
    # 1. Determine document type based on extension
    ext = file.filename.split(".")[-1].lower()
    if ext == "pdf":
        doc_type = PDF
    elif ext == "csv":
        doc_type = CSV
    elif ext in ["txt", "md"]:
        doc_type = TEXT
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Use PDF, CSV, or TXT.")

    # 2. Save file temporarily
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 3. Add to Vector Store
        rag_system.add_document_to_store(file_path, document_type=doc_type, role=role)
        
        return {"message": f"Successfully indexed '{file.filename}' for {role}"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")
    
    finally:
        # Clean up temp file
        if os.path.exists(file_path):
            os.remove(file_path)

# ---------------------------------------------------------------------
#   Returns the current operational status of the RAG system.
# -------------------------------------------------------------------
@router.get("/status")
async def get_rag_status():
    db = rag_system.get_vector_store()
    if db is not None:
        count = db._collection.count()
        return {"status": "active", "document_chunks": count}
    return {"status": "not_initialized", "document_chunks": 0}