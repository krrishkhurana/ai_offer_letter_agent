@echo off
cd /d "%~dp0\frontend"
echo ========================================================
echo   Starting Frontend Dev Server (Vite + React)
echo   UI available at http://localhost:5173
echo ========================================================
echo.
npm run dev
pause
