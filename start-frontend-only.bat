@echo off
echo ========================================
echo STARTING FRONTEND ONLY
echo ========================================
echo.

echo Checking if backend is running...
curl -s "http://localhost:8081/api/test.php" | findstr "success" && echo "✓ Backend is running" || echo "✗ Backend not running - start backend first!"

echo.
echo Starting Angular Frontend...
cd frontend
echo "Installing dependencies (if needed)..."
call npm install --legacy-peer-deps

echo.
echo "Starting development server..."
echo "This will open in a new window and take a few minutes to compile..."
call npm start

pause