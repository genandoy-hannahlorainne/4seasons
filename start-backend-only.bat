@echo off
echo ========================================
echo STARTING BACKEND SERVICES ONLY
echo ========================================
echo.

echo Starting Docker containers (Database + Backend)...
docker-compose up -d mysql backend-legacy

echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo Checking service status...
docker ps | findstr "4seasons"

echo.
echo ========================================
echo BACKEND SERVICES STARTED
echo ========================================
echo.
echo "✅ Database (MySQL): localhost:3307"
echo "✅ Legacy PHP Backend: http://localhost:8081"
echo "✅ Laravel Backend: http://localhost:8080"
echo.
echo "Backend APIs are ready!"
echo "You can now start the frontend separately."
echo.
pause