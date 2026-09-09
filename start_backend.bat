@echo off
echo ========================================================
echo Starting LearnLoop FastAPI Backend (http://127.0.0.1:8000)
echo ========================================================
cd /d "%~dp0"
backend\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
pause
