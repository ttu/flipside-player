#!/bin/bash

# FlipSide Player Installation Script
# This script sets up the FlipSide Player development environment

set -e  # Exit on any error

echo "🎵 FlipSide Player Installation Script"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION detected. Please upgrade to Node.js 18 or higher."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if Redis is installed (optional check)
if command -v redis-server &> /dev/null; then
    echo "✅ Redis detected"
else
    echo "⚠️  Redis not detected. You'll need to install and start Redis server."
    echo "   macOS: brew install redis && brew services start redis"
    echo "   Ubuntu: sudo apt install redis-server && sudo systemctl start redis"
    echo "   Or use Docker: docker run -d -p 6379:6379 redis:alpine"
fi

echo ""
echo "📦 Installing dependencies..."

# Install root dependencies
echo "Installing root workspace dependencies..."
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies  
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "📄 Setting up environment files..."

# Create backend .env if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from template..."
    cp backend/.env.example backend/.env
    
    # Generate a secure session secret (64 characters)
    if command -v openssl &> /dev/null; then
        SESSION_SECRET=$(openssl rand -hex 32)
        # Replace the placeholder with the generated secret
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS sed syntax
            sed -i '' "s/your_secure_session_secret_key_must_be_at_least_32_characters_long_for_security/$SESSION_SECRET/" backend/.env
        else
            # Linux sed syntax
            sed -i "s/your_secure_session_secret_key_must_be_at_least_32_characters_long_for_security/$SESSION_SECRET/" backend/.env
        fi
        echo "✅ Generated secure session secret"
    else
        echo "⚠️  OpenSSL not found. Please manually set a secure SESSION_SECRET (32+ characters) in backend/.env"
    fi
    
    echo "⚠️  Please edit backend/.env with your Spotify credentials"
else
    echo "backend/.env already exists"
fi

# Create frontend .env if it doesn't exist
if [ ! -f "frontend/.env" ]; then
    echo "Creating frontend/.env from template..."
    cp frontend/.env.example frontend/.env
    echo "✅ frontend/.env created"
else
    echo "frontend/.env already exists"
fi

echo ""
echo "🎯 Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. 🎵 Register your Spotify app:"
echo "   - Visit: https://developer.spotify.com/dashboard"
echo "   - Create new app with redirect URI: http://127.0.0.1:3001/auth/spotify/callback"
echo "   - Important: Use 127.0.0.1 (not localhost) - Spotify security requirement"
echo ""
echo "2. 🔧 Configure your environment:"
echo "   - Edit backend/.env with your Spotify Client ID and Secret"
echo "   - Generate a secure session secret"
echo ""
echo "3. 🚀 Start Redis server:"
echo "   - redis-server"
echo "   - Or: brew services start redis (macOS)"
echo "   - Or: docker run -d -p 6379:6379 redis:alpine"
echo ""
echo "4. 🎶 Start the application:"
echo "   Development (Local):"
echo "   - npm run dev (starts both frontend and backend)"
echo "   - Open http://localhost:5173"
echo ""
echo "   Development (Docker):"
echo "   - npm run docker:dev"
echo "   - Open http://localhost:5173"
echo ""
echo "5. 🐳 For production (Docker):"
echo "   - Create production .env files"
echo "   - npm run docker:prod (or docker-compose up --build -d)"
echo "   - Open http://localhost (port 80)"
echo ""
echo "📚 Read README.md for detailed instructions"
echo ""
echo "Happy listening! 🎧"