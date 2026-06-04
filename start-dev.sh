#!/bin/bash
# Start the Chatbot application in development mode
# This script manually builds and launches Electron with Vite

cd /home/admin1/李昭贤铁通/项目/离线式劳保用品效期自动化预警/Chatbot

# Get paths
ELECTRON_PATH="$(pwd)/node_modules/electron/dist/electron"
VITE_ENTRY="$(pwd)/.vite/build/main.js"

# Set environment variables
export ELECTRON_DISABLE_SANDBOX=1

echo "=========================================="
echo "Starting Chatbot in development mode..."
echo "=========================================="
echo ""

# Kill any existing processes
pkill -f "vite" 2>/dev/null || true
pkill -f "electron" 2>/dev/null || true

# Clean build directory
echo "Cleaning build directory..."
rm -rf .vite out

# Build main process
echo "Building main process..."
npx vite build --config vite.main.config.ts

# Build preload script
echo "Building preload script..."
npx vite build --config vite.preload.config.ts

# Build renderer with dev server
echo "Starting Vite dev server..."
npx vite --config vite.renderer.config.ts &
VITE_PID=$!

echo "Vite dev server started with PID: $VITE_PID"
echo "Waiting for Vite to be ready..."

# Wait for Vite to be ready
for i in {1..30}; do
  if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "Vite dev server is ready!"
    break
  fi
  sleep 1
done

echo ""
echo "Starting Electron..."
# Start electron
$ELECTRON_PATH "$VITE_ENTRY" --no-sandbox --disable-gpu &
ELECTRON_PID=$!

echo "Electron started with PID: $ELECTRON_PID"
echo ""
echo "Application is running. Press Ctrl+C to stop."

# Wait for either process to exit
trap 'kill $VITE_PID $ELECTRON_PID 2>/dev/null' EXIT
wait $ELECTRON_PID
EXIT_CODE=$?

echo ""
echo "Electron exited with code: $EXIT_CODE"

exit $EXIT_CODE
