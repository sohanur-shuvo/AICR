@echo off
echo ========================================
echo Starting Device Detector Application
echo ========================================
echo.

REM Start Backend
echo [1/2] Starting FastAPI Backend...
start "Device Detector Backend" cmd /k "cd backend && python api.py"
timeout /t 3 /nobreak >nul

REM Start Frontend
echo [2/2] Starting React Frontend...
start "Device Detector Frontend" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo Application started successfully!
echo ========================================
echo.
echo Backend API: http://localhost:8000
echo Frontend App: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to exit...
pause >nul
