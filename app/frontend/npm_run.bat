@ECHO OFF
ECHO Vite React and Fastapi Demo
ECHO Relative file path: %~dp0/app/frontend
cd %~dp0/app/frontend
npm run dev -- --host
PAUSE