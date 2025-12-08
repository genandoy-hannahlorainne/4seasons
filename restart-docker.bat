@echo off
echo Stopping Docker containers...
docker-compose down

echo.
echo Rebuilding backend with CORS fix...
docker-compose build backend

echo.
echo Starting all containers...
docker-compose up

pause
