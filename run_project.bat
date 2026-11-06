@echo off
cd /d "%~dp0"
echo ========================================================
echo   Starting AI Offer Letter Generator Server
echo   Serving Full App (UI + API) at http://localhost:8000
echo ========================================================
echo.
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
pause
