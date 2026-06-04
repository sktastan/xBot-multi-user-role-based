#===========================================================
#  
#  langchain_rag.py
#  Core RAG implementation using LangChain, handling document 
#  loading, splitting, and vector storage.
#  
#============================================================
import os
import shutil
from datetime import datetime
from langchain_community.document_loaders import (
    TextLoader,
    PyPDFLoader,
    CSVLoader,
    Docx2txtLoader
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from rich import print

TEXT = 0
CSV = 1
PDF = 2
DOCX = 3
OLLAMA_EMBEDDING_MODEL = "embeddinggemma"

# ---------------------------------------------------------------------
#   Main class for managing Retrieval-Augmented Generation workflows.
# -------------------------------------------------------------------
class RAG:
    # ---------------------------------------------------------------------
    #   Initializes the RAG instance with null placeholders.
    # -------------------------------------------------------------------
    def __init__(self):
        self.embedding_model = None
        self.db = None
        self.persist_directory = None

    # ---------------------------------------------------------------------
    #   Loads document content based on specific file formats.
    # -------------------------------------------------------------------
    def documents_loader(self, file_path, file_type):
        # Ensure we use an absolute path to avoid issues with some loaders on Windows
        file_path = os.path.abspath(file_path)
        
        if file_type == TEXT:
            print("\n[green] -----------------Text Document---------------------------- [/green]\n")
            loader = TextLoader(file_path)
        elif file_type == CSV:
            print("\n[green] -----------------CSV Document---------------------------- [/green]\n")
            loader = CSVLoader(file_path)           
        elif file_type == PDF:
            print("\n[green]-----------------PDF Document----------------------------[/green]\n")
            loader = PyPDFLoader(file_path)            
        elif file_type == DOCX:
            print("\n[green] -----------------DOCX Document---------------------------- [/green]\n")
            loader = Docx2txtLoader(file_path)
        else:
            raise ValueError("Unsupported file type")
        
        return loader.load()

    # ---------------------------------------------------------------------
    #   Splits documents into smaller text chunks for processing.
    # -------------------------------------------------------------------
    def split_document(self, documents, chunk_size=1000, chunk_overlap=200):
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            is_separator_regex=False,
        )
        return text_splitter.split_documents(documents)
    
    # ---------------------------------------------------------------------
    #   Sets and returns the active embedding model.
    # -------------------------------------------------------------------
    def set_embedding_model(self, model_name=OLLAMA_EMBEDDING_MODEL):
        self.embedding_model = OllamaEmbeddings(model=model_name)
        return self.embedding_model
    
    # ---------------------------------------------------------------------
    #   Retrieves the currently configured embedding model.
    # -------------------------------------------------------------------
    def get_embedding_model(self):
        return self.embedding_model
    
    # ---------------------------------------------------------------------
    #   Sets up the Chroma vector store with persistence.
    # -------------------------------------------------------------------
    def initialize_vector_store(self, embedding_model, persist_directory=None):
        self.persist_directory = persist_directory
        self.db = Chroma(
            persist_directory=persist_directory,
            embedding_function=embedding_model
        )
        return self.db
    
    # ---------------------------------------------------------------------
    #   Processes a single file and adds it to the vector store.
    # -------------------------------------------------------------------
    def add_document_to_store(self, file_path, document_type=TEXT, role="Employee Level"):
        """
        Loads, tags with role metadata, splits, and adds a document to the vector store.
        """
        if self.db is not None:
            docs = self.documents_loader(file_path, document_type)
            
            if not docs:
                print(f"[yellow]Warning: No content could be extracted from {file_path}[/yellow]")
                return

            # Tag each document with the target role before splitting
            for doc in docs:
                doc.metadata["role"] = role
            
            split_docs = self.split_document(docs)
            self.db.add_documents(split_docs)
            print(f"New document added to vector store for access level: {role}")

    # ---------------------------------------------------------------------
    #   Searches the store using similarity search with role filters.
    # -------------------------------------------------------------------
    def search_vector_store(self, query, user_role=None, k=4):
        """
        Performs a similarity search filtered by the user's role.
        """
        if self.db is None:
            raise ValueError("Vector store not initialized.")

        # C-Level Executives have no filter (full access)
        if user_role == 'C-Level Executives':
            return self.db.similarity_search(query, k=k)
        
        # Other roles see their department data + general Employee Level data
        allowed_roles = ["Employee Level"]
        if user_role and user_role != "Employee Level":
            allowed_roles.append(user_role)

        search_filter = {"role": {"$in": allowed_roles}}
        return self.db.similarity_search(query, k=k, filter=search_filter)

    # ---------------------------------------------------------------------
    #   Performs search and returns results formatted with source names.
    # -------------------------------------------------------------------
    def search_with_sources(self, query, user_role=None, k=4):
        """
        Performs a search and returns a list of results containing content and source info.
        """
        docs = self.search_vector_store(query, user_role, k)
        return [
            {
                "content": doc.page_content,
                "source": os.path.basename(doc.metadata.get("source", "Unknown")),
                "role": doc.metadata.get("role", "General")
            }
            for doc in docs
        ]

    # ---------------------------------------------------------------------
    #   Returns the active database instance.
    # -------------------------------------------------------------------
    def get_vector_store(self):
        return self.db

    # ---------------------------------------------------------------------
    #   Generates vector embeddings for a list of document strings.
    # -------------------------------------------------------------------
    def embed_documents(self, documents):
        return self.embedding_model.embed_documents(documents)   

    # ---------------------------------------------------------------------
    #   Updates the physical storage path for the vector database.
    # -------------------------------------------------------------------
    def set_vector_db_directory(self, directory):
        self.persist_directory = directory
        return self.persist_directory
    
    # ---------------------------------------------------------------------
    #   Returns the path where the database is currently persisted.
    # -------------------------------------------------------------------
    def get_vector_db_directory(self):
        return self.persist_directory    
    
    # ---------------------------------------------------------------------
    #   Lists unique source filenames present in the vector store.
    # -------------------------------------------------------------------
    def list_indexed_documents(self):
        if self.db is None:
            return []
        
        data = self.db.get()
        metadatas = data.get('metadatas', [])
        
        unique_sources = set()
        for meta in metadatas:
            if 'source' in meta:
                unique_sources.add(os.path.basename(meta['source']))
        
        return sorted(list(unique_sources))

    # ---------------------------------------------------------------------
    #   Deletes all chunks associated with a specific document name.
    # -------------------------------------------------------------------
    def delete_document_by_name(self, filename):
        """
        Finds and deletes all IDs associated with the source filename.
        """
        if self.db is None:
            raise ValueError("Vector store not initialized.")

        data = self.db.get()
        ids_to_delete = []
        
        for i, metadata in enumerate(data.get('metadatas', [])):
            source = metadata.get('source', '')
            if os.path.basename(source) == filename:
                ids_to_delete.append(data['ids'][i])
        
        if ids_to_delete:
            self.db.delete(ids=ids_to_delete)
            return len(ids_to_delete)
        return 0

    # ---------------------------------------------------------------------
    #   Clears all document data from the current vector store.
    # -------------------------------------------------------------------
    def delete_vector_store_data(self):
        if self.db is not None:
            # Get all IDs from the collection to delete them
            all_ids = self.db.get()['ids']
            if all_ids:
                self.db.delete(ids=all_ids)
        else:
            raise ValueError("Vector store not initialized.")

    # ---------------------------------------------------------------------
    #   Permanently deletes the entire vector store collection.
    # -------------------------------------------------------------------
    def delete_vector_store_collection(self):
        if self.db is not None:
            print("Deleting vector store collection...")
            print(self.db._collection.count())
            self.db.delete_collection()
            self.db = None
        else:
            raise ValueError("Vector store not initialized.")

    # ---------------------------------------------------------------------
    #   Creates a compressed backup of the vector store directory.
    # -------------------------------------------------------------------
    def backup_vector_store(self, backup_dir="backups"):
        """
        Archives the current vector store directory into a ZIP file.
        """
        source_dir = self.get_vector_db_directory()
        if not source_dir or not os.path.exists(source_dir):
            raise ValueError("Vector store directory not found or not initialized.")

        os.makedirs(backup_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"vector_db_backup_{timestamp}"
        backup_path = os.path.join(backup_dir, backup_filename)

        # Create zip archive (shutil adds .zip extension automatically)
        archive_path = shutil.make_archive(backup_path, 'zip', source_dir)
        return archive_path
