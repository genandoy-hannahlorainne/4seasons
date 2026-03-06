@echo off
setlocal

powershell -ExecutionPolicy Bypass -File "%~dp0after-pull-setup-seed.ps1"
if errorlevel 1 (
  echo.
  echo Bootstrap with seed failed. Check the error above.
  exit /b 1
)

echo.
echo Bootstrap with seed finished successfully.
endlocal
