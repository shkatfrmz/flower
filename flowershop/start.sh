#!/bin/bash
# PetalBloom: start backend + frontend

cd "$(dirname "$0")"

# Start backend API (port 3001)
cd server
node src/index.js &
BACKEND_PID=$!
cd ..

# Start frontend dev server (port 5173) - this is the exposed/preview port
cd client
npx vite --host --port 5173

# Cleanup backend on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT