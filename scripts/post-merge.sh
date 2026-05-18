#!/bin/bash
set -e

echo "Running post-merge setup..."

# Install root dependencies
npm install --legacy-peer-deps

# Install backend dependencies
cd backend && npm install --legacy-peer-deps && cd ..

# Install client dependencies  
cd client && npm install --legacy-peer-deps && cd ..

echo "Post-merge setup complete."
