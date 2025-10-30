#!/bin/bash

echo "========================================"
echo "Starting Device Detector Application"
echo "========================================"
echo ""

# Start Backend
echo "[1/2] Starting FastAPI Backend..."
cd backend
python api.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start Frontend
echo "[2/2] Starting React Frontend..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "Application started successfully!"
echo "========================================"
echo ""
echo "Backend API: http://localhost:8000"
echo "Frontend App: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
