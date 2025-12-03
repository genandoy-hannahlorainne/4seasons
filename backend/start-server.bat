@echo off
echo Starting PHP Development Server...
echo Backend API will be available at: http://localhost:8000
echo Press Ctrl+C to stop
cd /d "%~dp0"

REM Try to find PHP in common locations
if exist "C:\xampp\php\php.exe" (
    echo Using XAMPP PHP...
    C:\xampp\php\php.exe -S localhost:8000 -t api
) else if exist "C:\php\php.exe" (
    echo Using standalone PHP...
    C:\php\php.exe -S localhost:8000 -t api
) else (
    echo Trying system PHP...
    php -S localhost:8000 -t api
)

pause
