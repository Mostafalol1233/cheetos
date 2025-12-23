@echo off
REM GameCart Backend - Quick Setup Script (Windows)
REM Run this script to set up the backend locally

echo.
echo ==========================================
echo    GameCart Backend Setup (Windows)
echo ==========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js first.
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js version: 
node --version

echo [OK] npm version: 
npm --version

echo.
echo [INFO] Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo.
    echo [INFO] Creating .env file...
    copy .env.example .env
    echo [OK] .env file created. Edit it to customize settings.
) else (
    echo [OK] .env file already exists
)

REM Create data directory
if not exist data (
    echo.
    echo [INFO] Creating data directory...
    mkdir data
    echo [OK] Data directory created
)

REM Create uploads directory
if not exist uploads (
    echo.
    echo [INFO] Creating uploads directory...
    mkdir uploads
    echo [OK] Uploads directory created
)

echo.
echo ==========================================
echo [OK] Setup complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Review and customize .env file if needed
echo 2. Run: npm run dev (for development)
echo 3. Visit: http://localhost:3001
echo.
echo Documentation:
echo - API Docs: API_DOCUMENTATION.md
echo - Deployment: KATABUMP_DEPLOYMENT_GUIDE.md
echo - Frontend Integration: FRONTEND_INTEGRATION.ts
echo.
pause
