@echo off
echo ========================================
echo CHECKING XAMPP SERVICES
echo ========================================
echo.

REM Check if MySQL is running
echo Checking MySQL status...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✓ MySQL is running
) else (
    echo ✗ MySQL is NOT running
    echo.
    echo Starting MySQL...
    cd C:\xampp
    call mysql_start.bat
    timeout /t 3
)

echo.
echo ========================================
echo SERVICES STATUS
echo ========================================
echo.

REM Check Apache
tasklist /FI "IMAGENAME eq apache.exe" 2>NUL | find /I /N "apache.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✓ Apache is running
) else (
    echo ✗ Apache is NOT running
)

REM Check MySQL again
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✓ MySQL is running
) else (
    echo ✗ MySQL is NOT running
)

echo.
echo ========================================
echo Now you can access:
echo - Frontend: http://localhost:4200
echo - Backend API: http://localhost:8081
echo - phpMyAdmin: http://localhost/phpmyadmin
echo ========================================
echo.
pause
