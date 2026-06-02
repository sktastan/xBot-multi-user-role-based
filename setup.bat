@ECHO OFF
SETLOCAL
ECHO ===========================================================
ECHO   xBot - Multi-User Role-Based RAG Setup
ECHO ===========================================================

:: Backend Setup
ECHO.
ECHO [1/3] Setting up Python Virtual Environment and Dependencies...
cd /d "%~dp0"
python -m venv venv
call venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r app/backend/requirements.txt

:: Frontend Setup
ECHO.
ECHO [2/3] Installing Frontend Dependencies (Node.js required)...
cd /d "%~dp0app\frontend"
call npm install

:: Ollama Models Setup
ECHO.
ECHO [3/3] Pulling Ollama Models (Ollama must be installed and running)...
ECHO Pulling embedding model: embeddinggemma...
ollama pull embeddinggemma
ECHO Pulling chat model: qwen3:0.6b...
ollama pull qwen3:0.6b

ECHO.
ECHO Setup complete! You can now use python_run.bat and npm_run.bat to start the services.
PAUSE