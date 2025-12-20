@echo off
echo Restarting Laravel + Angular + MySQL...
echo.

echo Stopping containers...
docker-compose down

echo.
echo Starting containers...
docker-compose up -d

echo.
echo Services started!
echo - Frontend: http://localhost:4200
echo - Laravel API: http://localhost:8080/api  
echo - Database: localhost:3307
echo.
echo Logs: docker-compose logs -f
pause