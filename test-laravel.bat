@echo off
echo Testing Laravel Backend Setup...
echo.

echo 1. Building Laravel container...
docker-compose build backend

echo.
echo 2. Starting services...
docker-compose up -d

echo.
echo 3. Waiting for services to be ready...
timeout /t 10

echo.
echo 4. Testing Laravel API...
curl -s http://localhost:8080/api/test

echo.
echo 5. Testing Database Connection...
curl -s http://localhost:8080/api/test-db

echo.
echo Setup complete! 
echo.
echo Access points:
echo - Frontend: http://localhost:4200
echo - Laravel API: http://localhost:8080/api
echo - Database: localhost:3307
echo.
pause