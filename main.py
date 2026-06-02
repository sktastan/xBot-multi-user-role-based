#===========================================================
#  
#  main.py
#  Main entry point for the FastAPI application, setting up
#  CORS, database, and API routers.
#  
#============================================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

# Initialize FastAPI at the module level so uvicorn can find it (e.g., main:app)
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
frontend_path = os.path.join(os.path.dirname(__file__), "app", "frontend", "dist")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="static")

def main():
    run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()
