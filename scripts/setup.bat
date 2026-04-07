@echo off
REM Setup script for Ollama Key Manager (Windows)

echo Setting up Ollama Key Manager...
echo.

REM Create data directory
echo Creating data directory...
if not exist "data" mkdir data

REM Copy env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file from template...
    copy .env.example .env
    echo WARNING: Please edit .env and add your actual API keys!
) else (
    echo .env file already exists
)

REM Install dependencies if not already installed
if not exist "node_modules" (
    echo Installing dependencies...
    call pnpm install
) else (
    echo Dependencies already installed
)

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Edit .env and add your Claude/OpenAI API keys
echo 2. Run 'pnpm dev' to start the development server
echo 3. Open http://localhost:3000 in your browser
echo.
echo For Docker deployment:
echo 1. Make sure .env has your API keys
echo 2. Run 'docker-compose up -d'
echo.
pause
