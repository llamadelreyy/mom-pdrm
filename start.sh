#!/bin/bash

# PDRM Meeting Minutes Assistant - Start Script
# This script starts both the backend and frontend servers

echo "🚀 Starting PDRM Meeting Minutes Assistant..."
echo "==============================================="

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Check if required directories exist
if [ ! -d "frontend" ]; then
    echo "❌ Frontend directory not found!"
    exit 1
fi

if [ ! -f "app.py" ]; then
    echo "❌ Backend app.py not found!"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ -z "$NODE_VERSION" ]; then
    echo "❌ Node.js not found! Please install Node.js 16 or higher."
    exit 1
elif [ "$NODE_VERSION" -lt 16 ]; then
    echo "⚠️  Warning: Node.js version $NODE_VERSION detected. Vite requires Node.js 16 or higher."
    echo "💡 You can either:"
    echo "   - Update Node.js to version 16+ (recommended)"
    echo "   - Or we'll try to downgrade Vite to a compatible version..."
    read -p "Continue with Vite downgrade? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    
    # Downgrade Vite for older Node versions
    cd frontend
    echo "📦 Downgrading Vite for Node.js compatibility..."
    npm install vite@3.2.7 @vitejs/plugin-react@2.2.0 --save-dev
    cd ..
fi

# Check if node_modules exists, if not install dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Check if python dependencies are installed
echo "🐍 Checking Python dependencies..."
python -c "import fastapi, uvicorn, docx" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📦 Installing Python dependencies..."
    pip install -r requirements.txt
fi

echo ""
echo "🖥️  Starting Backend Server..."
echo "Backend will be available at: http://localhost:8080"
uvicorn app:app --host 0.0.0.0 --port 8080 --reload &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

echo ""
echo "⚛️  Starting Frontend Server..."
echo "Frontend will be available at: http://localhost:3000"
cd frontend
npm run dev -- --host 0.0.0.0 --port 3000 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Both servers are starting up..."
echo "==============================================="
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8080"
echo "📚 API Docs: http://localhost:8080/docs"
echo "==============================================="
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID