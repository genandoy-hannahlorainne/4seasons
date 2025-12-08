@echo off
echo WARNING: This will delete ALL data and reset to fresh database!
echo.
set /p confirm="Are you sure? Type YES to continue: "

if /i "%confirm%" NEQ "YES" (
    echo Cancelled.
    pause
    exit
)

echo.
echo Resetting database...
docker-compose down -v
docker-compose up -d

echo.
echo Database reset complete!
echo All data has been cleared and reset to initial state.
pause
