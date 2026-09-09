@echo off
echo ========================================================
echo Starting LearnLoop Full System...
echo ========================================================
cd /d "%~dp0"
start "LearnLoop Backend" cmd /c "%~dp0start_backend.bat"
start "LearnLoop Frontend" cmd /c "%~dp0start_frontend.bat"
echo.
echo Both servers are starting in separate windows!
echo - Backend API:  http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)
echo - Frontend Web: http://localhost:3000
echo.
timeout /t 3 >nul
