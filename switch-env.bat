@echo off
setlocal

set BACKEND_DIR=backend-laravel

if "%1"=="docker" (
    echo Switching to Docker environment...
    copy "%BACKEND_DIR%\.env.docker" "%BACKEND_DIR%\.env" >nul
    echo ✅ Switched to Docker environment
    echo Services available at:
    echo   - Frontend: http://localhost:4200
    echo   - Backend: http://localhost:8081
    echo   - phpMyAdmin: http://localhost:8080
    echo   - MailHog: http://localhost:8025
) else if "%1"=="local" (
    echo Switching to Local development environment...
    copy "%BACKEND_DIR%\.env.local" "%BACKEND_DIR%\.env" >nul
    echo ✅ Switched to Local environment
    echo Make sure your local MySQL server is running
) else if "%1"=="testing" (
    echo Switching to Testing environment...
    copy "%BACKEND_DIR%\.env.testing" "%BACKEND_DIR%\.env" >nul
    echo ✅ Switched to Testing environment
    echo Run tests with: docker-compose exec backend php artisan test
) else (
    echo Usage: %0 {docker^|local^|testing}
    echo.
    echo Available environments:
    echo   docker  - Use Docker services ^(default^)
    echo   local   - Use local development setup
    echo   testing - Use testing configuration
    exit /b 1
)

endlocal