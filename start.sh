#!/bin/bash

# Kill any existing processes
echo "🦁 Stopping existing Lion instances..."
pkill -f "electron"
lsof -i :5173 | awk 'NR!=1 {print $2}' | xargs kill -9 2>/dev/null

# Start Vite in background
echo "🚀 Starting Dev Server..."
npm run dev &

# Wait for Vite to be ready
echo "⏳ Waiting for server..."
sleep 5

# Start Electron
echo "🦁 Launching Lion Assistant..."
npx electron .
