@echo off
echo ========================================
echo Restarting Frontend with CSS Fix
echo ========================================
echo.

echo I fixed the CSS syntax error in student-dashboard.component.scss
echo.

echo Step 1: Stop current Angular process
echo Press Ctrl+C in the terminal running ng serve
echo.

echo Step 2: Restart Angular
echo.
cd frontend
echo Starting Angular development server...
ng serve --port 4201
echo.

echo ========================================
echo Frontend should now compile successfully!
echo ========================================