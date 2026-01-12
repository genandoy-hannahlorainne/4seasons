@echo off
REM Script to import database backup to 4seasons database
REM Usage: import-backup.bat <path-to-backup-file.sql>

if "%~1"=="" (
    echo Error: Please provide the backup file path
    echo Usage: import-backup.bat ^<path-to-backup-file.sql^>
    echo Example: import-backup.bat "C:\Users\pc\Downloads\db_backup_2026-01-12_200418.sql"
    exit /b 1
)

set BACKUP_FILE=%~1

if not exist "%BACKUP_FILE%" (
    echo Error: Backup file not found: %BACKUP_FILE%
    exit /b 1
)

echo ========================================
echo Importing backup to 4seasons database
echo ========================================
echo Backup file: %BACKUP_FILE%
echo.

REM Prompt for MySQL credentials
set /p MYSQL_USER="Enter MySQL username (default: root): "
if "%MYSQL_USER%"=="" set MYSQL_USER=root

set /p MYSQL_HOST="Enter MySQL host (default: localhost): "
if "%MYSQL_HOST%"=="" set MYSQL_HOST=localhost

set /p MYSQL_PORT="Enter MySQL port (default: 3306): "
if "%MYSQL_PORT%"=="" set MYSQL_PORT=3306

echo.
echo Importing backup...
echo This may take a few minutes depending on the backup size.
echo.

mysql -u %MYSQL_USER% -p -h %MYSQL_HOST% -P %MYSQL_PORT% 4seasons < "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS: Backup imported successfully!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ERROR: Failed to import backup
    echo ========================================
    exit /b 1
)

pause
