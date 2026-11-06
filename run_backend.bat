@echo off
cd /d "%~dp0"
echo ========================================================
echo   Starting Backend API Server (FastAPI)
echo   API available at http://127.0.0.1:8000/api/
echo ========================================================
echo.
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
pause
