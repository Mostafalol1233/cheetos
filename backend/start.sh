#!/bin/bash
# GameCart Backend Startup Script

echo "🎮 GameCart Backend Startup"
echo "============================"
echo ""

# Check Node.js
echo "[INFO] Checking Node.js..."
node --version

# Check npm
echo "[INFO] Checking npm..."
npm --version

echo ""
echo "[INFO] Installing dependencies..."
npm install

echo ""
echo "[INFO] Checking .env file..."
if [ ! -f .env ]; then
  echo "[WARNING] .env file not found, creating from .env.example..."
  cp .env.example .env
  echo "[OK] .env created"
else
  echo "[OK] .env file exists"
fi

echo ""
echo "[INFO] Checking data directories..."
mkdir -p data
mkdir -p uploads

echo ""
echo "[INFO] Starting backend server..."
echo ""

npm start
