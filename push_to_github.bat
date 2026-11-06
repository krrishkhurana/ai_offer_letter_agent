@echo off
setlocal enabledelayedexpansion

echo ================================================================
echo           AI OFFER LETTER AGENT - PUSH TO GITHUB
echo ================================================================
echo.

:: Add Git and Git Credential Manager to PATH so GCM doesn't crash
set "GIT_DIR=C:\Users\krris\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd"
set "MINGW_DIR=C:\Users\krris\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\mingw64\bin"

if exist "%GIT_DIR%" (
    set "PATH=%GIT_DIR%;%MINGW_DIR%;%PATH%"
    set "GIT_CMD=%GIT_DIR%\git.exe"
) else (
    set "GIT_CMD=git"
)

cd /d "%~dp0"

set "REPO_URL=https://github.com/krrishkhurana/aiofferletteragent.git"

echo Target Repository: %REPO_URL%
echo.

"%GIT_CMD%" remote set-url origin %REPO_URL% >nul 2>nul
if %errorlevel% neq 0 (
    "%GIT_CMD%" remote add origin %REPO_URL%
)

"%GIT_CMD%" branch -M main

echo ----------------------------------------------------------------
echo [Method 1] Attempting push with Git Credential Manager...
echo (If a browser window opens, please click 'Sign in with browser')
echo ----------------------------------------------------------------
echo.

"%GIT_CMD%" push -u origin main

if %errorlevel% equ 0 (
    goto :success
)

echo.
echo ================================================================
echo Browser login did not complete or was cancelled.
echo.
echo [Method 2] You can push using a GitHub Personal Access Token (PAT)
echo 1. Generate a token at: https://github.com/settings/tokens (classic)
echo    with 'repo' scope.
echo 2. Paste your token below:
echo ================================================================
echo.
set /p GH_TOKEN="Enter GitHub Token (or press Enter to exit): "

if "%GH_TOKEN%"=="" (
    goto :failed
)

echo.
echo Pushing with authentication token...
"%GIT_CMD%" push https://krrishkhurana:%GH_TOKEN%@github.com/krrishkhurana/aiofferletteragent.git main --force

if %errorlevel% equ 0 (
    goto :success
) else (
    goto :failed
)

:success
echo.
echo ================================================================
echo [SUCCESS] All files pushed successfully to GitHub!
echo Repository URL: https://github.com/krrishkhurana/aiofferletteragent
echo ================================================================
echo.
pause
exit /b 0

:failed
echo.
echo [FAILED] Unable to push to GitHub.
echo.
pause
exit /b 1
