@echo off
cd /d "%~dp0"
echo ========================================
echo   Aim Lab - Starting...
echo ========================================
echo.
echo [1/2] Checking dependencies...
if not exist "node_modules\" (
    echo Installing dependencies...
    npm install
) else (
    echo Dependencies already installed.
)
echo.
echo [2/2] Starting dev server...
echo.
echo Browser will open at http://localhost:5173
echo Press Ctrl+C to stop the server.
echo.
npm run dev
