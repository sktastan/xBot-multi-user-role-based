@ECHO OFF
ECHO React and Fastapi Demo
ECHO Relative file path: %~dp0main.py

:: Activate the virtual environment before running
call %~dp0venv\Scripts\activate
python main.py
PAUSE