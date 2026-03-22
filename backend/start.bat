@echo off
REM GameCart Backend Startup Script (Windows)

echo.
echo ==========================================
echo    GameCart Backend Startup
echo ==========================================
echo.

REM Check Node.js
echo [INFO] Checking Node.js...
node --version

REM Check npm
echo [INFO] Checking npm...
npm --version

echo.
echo [INFO] Installing dependencies...
call npm install

echo.
echo [INFO] Checking .env file...
if not exist .env (
    echo [WARNING] .env file not found, creating from .env.example...
    copy .env.example .env
    echo [OK] .env created
) else (
    echo [OK] .env file exists
)

echo.
echo [INFO] Checking data directories...
if not exist data mkdir data
if not exist uploads mkdir uploads

echo.
echo [INFO] Starting backend server...
echo.

npm start
