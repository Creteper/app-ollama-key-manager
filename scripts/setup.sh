#!/bin/bash

# Setup script for Ollama Key Manager

set -e

echo "🚀 Setting up Ollama Key Manager..."

# Create data directory
echo "📁 Creating data directory..."
mkdir -p data

# Copy env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your actual API keys!"
else
    echo "✅ .env file already exists"
fi

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env and add your Claude/OpenAI API keys"
echo "2. Run 'pnpm dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "🐳 For Docker deployment:"
echo "1. Make sure .env has your API keys"
echo "2. Run 'docker-compose up -d'"
echo ""
