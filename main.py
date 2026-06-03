#===========================================================
#  
#  main.py
#  Main entry point for the FastAPI application, setting up
#  CORS, database, and API routers.
#  
#============================================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from uvicorn import run
import os
from app.backend.database import init_db
from app.backend.users.users_login import router as login_router
from app.backend.users.users_signin import router as signin_router
from app.backend.users.users_dashboard import router as users_dashboard_router
from app.backend.admin.admin_login import router as admin_login_router
from app.backend.admin.admin_signin import router as admin_signin_router
from app.backend.admin.admin_management import router as admin_mgmt_router
from app.backend.admin.admin_setup import router as admin_setup_router
from app.backend.admin.admin_roles import router as admin_roles_router
from app.backend.rag.admin_rag import router as admin_rag_router

# Initialize FastAPI
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

# Include API Routers
app.include_router(login_router)
app.include_router(signin_router)
app.include_router(users_dashboard_router, prefix="/users")
app.include_router(admin_login_router)
app.include_router(admin_signin_router)
app.include_router(admin_mgmt_router)
app.include_router(admin_roles_router)
app.include_router(admin_setup_router)
app.include_router(admin_rag_router)

# Serve Frontend Static Files
# This assumes the frontend is built into app/frontend/dist
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
frontend_path = os.path.join(BASE_DIR, "app", "frontend", "dist")

if os.path.exists(frontend_path):
    # Mount static assets first (js, css, etc.)
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_path, "assets")), name="static")

    # Catch-all route to handle React Router deep links on refresh
    @app.get("/{fallback_path:path}")
    async def render_spa(fallback_path: str):
        # If the path exists as a physical file in dist (like favicon.ico), serve it.
        # Otherwise, serve index.html to allow React Router to handle the URL.
        full_file_path = os.path.join(frontend_path, fallback_path)
        if os.path.isfile(full_file_path):
            return FileResponse(full_file_path)
        return FileResponse(os.path.join(frontend_path, "index.html"))

def main():
    # Use port 7860 for Hugging Face Spaces compatibility
    run(app, host="0.0.0.0", port=7860)

if __name__ == "__main__":
    main()
