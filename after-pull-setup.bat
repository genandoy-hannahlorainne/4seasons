@echo off
setlocal

powershell -ExecutionPolicy Bypass -File "%~dp0after-pull-setup.ps1"
if errorlevel 1 (
  echo.
  echo Bootstrap failed. Check the error above.
  exit /b 1
)

echo.
echo Bootstrap finished successfully.
endlocal
