#===========================================================
#  
#  admin_rag.py
#  API routes for managing the RAG system, including 
#  document uploads and status checks.
#  
#============================================================
import os
import shutil
import time
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from rich import print
from app.backend.rag.langchain_rag import RAG, TEXT, PDF, CSV, DOCX

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
    elif ext == "docx":
        doc_type = DOCX
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Use PDF, CSV, TXT, or DOCX.")

    # 2. Save file temporarily
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Explicitly close the upload file handle to release resources
        # This is a best practice in FastAPI before processing
        await file.close()

        # 3. Add to Vector Store
        rag_system.add_document_to_store(file_path, document_type=doc_type, role=role)
        
        return {"message": f"Successfully indexed '{file.filename}' for {role}"}
    
    except Exception as e:
        print(f"\n[red]Indexing Error:[/red] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")

# ---------------------------------------------------------------------
#   Lists all unique documents currently indexed.
# -------------------------------------------------------------------
@router.get("/documents")
async def list_documents():
    docs = rag_system.list_indexed_documents()
    return {"documents": docs}

# ---------------------------------------------------------------------
#   Deletes a specific document from the vector store.
# -------------------------------------------------------------------
@router.delete("/documents/{filename}")
async def delete_document(filename: str):
    try:
        count = rag_system.delete_document_by_name(filename)

        # Also delete the physical file from temp_uploads
        file_path = os.path.join("temp_uploads", filename)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Warning: Could not delete physical file {file_path}: {e}")

        return {"message": f"Successfully deleted '{filename}' and removed {count} chunks."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------
#   Clears the entire vector store (Rebuild/Reset).
# -------------------------------------------------------------------
@router.post("/reset")
async def reset_vector_index():
    """
    Permanently deletes all indexed data.
    """
    try:
        rag_system.delete_vector_store_data()
        return {"message": "Vector index cleared successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------
#   Creates and downloads a backup of the vector database.
# -------------------------------------------------------------------
@router.post("/backup")
async def backup_database():
    """
    Triggers a backup process and returns the zipped archive as a download.
    """
    try:
        archive_path = rag_system.backup_vector_store()
        return FileResponse(
            path=archive_path,
            filename=os.path.basename(archive_path),
            media_type='application/zip'
        )
    except Exception as e:
        print(f"\n[red]Backup Error:[/red] {str(e)}")
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")

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