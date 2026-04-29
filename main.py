#===========================================================
#  
#  main.py
#  Main entry point for the FastAPI application, setting up
#  CORS, database, and API routers.
#  
#============================================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from uvicorn import run
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

# ---------------------------------------------------------------------
#   Main entry point that configures FastAPI, CORS, and routers.
# -------------------------------------------------------------------
def main():
    app = FastAPI()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    init_db()

    app.include_router(login_router)
    app.include_router(signin_router)
    app.include_router(users_dashboard_router, prefix="/users")
    app.include_router(admin_login_router)
    app.include_router(admin_signin_router)
    app.include_router(admin_mgmt_router)
    app.include_router(admin_roles_router)
    app.include_router(admin_setup_router)
    app.include_router(admin_rag_router)

    run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()
