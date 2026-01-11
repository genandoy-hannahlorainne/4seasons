@echo off
echo ========================================
echo REVIEWING ALL USERS IN DATABASE
echo ========================================
echo.

REM XAMPP MySQL path
set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe

REM Database credentials
set DB_HOST=localhost
set DB_PORT=3306
set DB_USER=root
set DB_PASS=
set DB_NAME=4seasons

echo Connecting to database: %DB_NAME%
echo Host: %DB_HOST%:%DB_PORT%
echo.

REM Check if mysql exists
if not exist "%MYSQL_PATH%" (
    echo Error: MySQL not found at %MYSQL_PATH%
    echo Please check your XAMPP installation path
    pause
    exit /b 1
)

REM Run the SQL queries
"%MYSQL_PATH%" -h %DB_HOST% -P %DB_PORT% -u %DB_USER% %DB_NAME% < review-all-users.sql

echo.
echo ========================================
echo Review Complete!
echo ========================================
pause
