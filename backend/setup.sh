#!/bin/bash

# GameCart Backend - Quick Setup Script
# Run this script to set up the backend locally

echo "🎮 GameCart Backend Setup"
echo "=========================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Navigate to backend directory
cd "$(dirname "$0")" || exit 1

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Edit it to customize settings."
else
    echo "✅ .env file already exists"
fi

# Create data directory if it doesn't exist
if [ ! -d data ]; then
    echo ""
    echo "📁 Creating data directory..."
    mkdir -p data
    echo "✅ Data directory created"
fi

# Create uploads directory if it doesn't exist
if [ ! -d uploads ]; then
    echo ""
    echo "📁 Creating uploads directory..."
    mkdir -p uploads
    echo "✅ Uploads directory created"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Review and customize .env file if needed"
echo "2. Run: npm run dev (for development)"
echo "3. Visit: http://localhost:3001"
echo ""
echo "📚 Documentation:"
echo "- API Docs: API_DOCUMENTATION.md"
echo "- Deployment: KATABUMP_DEPLOYMENT_GUIDE.md"
echo "- Frontend Integration: FRONTEND_INTEGRATION.ts"
echo ""
