@echo off
echo ========================================
echo STARTING 4SEASONS MEDICAL SYSTEM
echo ========================================
echo.

echo 1. Starting Docker containers (Database + Backend)...
docker-compose up -d
timeout /t 5 /nobreak >nul

echo.
echo 2. Checking if services are ready...
docker ps | findstr "4seasons" && echo "   ✓ Docker containers running" || echo "   ✗ Docker containers failed"

echo.
echo 3. Starting Angular Frontend...
echo "Opening new terminal for frontend..."
start cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo SERVICES STARTING...
echo ========================================
echo.
echo "✅ Backend (PHP): http://localhost:8081"
echo "✅ Database (MySQL): localhost:3306"
echo "✅ Frontend (Angular): http://localhost:4200"
echo.
echo "Wait a few seconds for Angular to compile..."
echo "Then go to: http://localhost:4200"
echo.
echo "LOGIN CREDENTIALS:"
echo "Username: 00001"
echo "Password: password"
echo.
pause