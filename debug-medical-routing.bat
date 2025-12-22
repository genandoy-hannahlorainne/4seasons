@echo off
echo ========================================
echo Medical Records Routing Debug
echo ========================================
echo.

echo I've added debug information to help identify the routing issue.
echo.

echo Changes Made:
echo =============
echo 1. Added wildcard route to catch unmatched routes
echo 2. Added debug console logs to MedicalRecordsComponent
echo 3. Added debug info display in the component template
echo.

echo Debugging Steps:
echo ================
echo.
echo 1. Open browser and go to: http://localhost:4200
echo 2. Login as student
echo 3. Open browser console (F12 → Console tab)
echo 4. Click "MyMedical" link
echo 5. Check what happens:
echo.

echo Expected Behaviors:
echo ===================
echo.
echo ✓ If routing works:
echo   - You should see the medical records page
echo   - Console should show: "MedicalRecordsComponent constructor called"
echo   - Console should show: "MedicalRecordsComponent ngOnInit called"
echo   - Page should show debug info box
echo.
echo ✗ If routing fails:
echo   - You go back to landing page
echo   - Console might show routing errors
echo   - Check Network tab for failed requests
echo.

echo Common Issues and Solutions:
echo ============================
echo.
echo Issue 1: Authentication Problem
echo - Check if user is still logged in
echo - Check localStorage for 'currentUser'
echo - Try logging out and logging back in
echo.
echo Issue 2: Route Guard Blocking
echo - Check console for auth guard messages
echo - Verify user role is 'Student'
echo.
echo Issue 3: Component Loading Error
echo - Check console for JavaScript errors
echo - Check if medical-records module loads
echo.
echo Issue 4: Backend API Error
echo - Check Network tab for failed API calls
echo - Test backend directly with curl
echo.

echo Backend Test:
echo =============
echo.
echo Testing if backend is responding...
curl -X GET "http://localhost:8080/api/medical-record" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nHTTP Status: %%{http_code}\n" ^
  -s
echo.

echo Manual Debugging Checklist:
echo ============================
echo.
echo [ ] Angular dev server running (ng serve)
echo [ ] Laravel backend running (php artisan serve)
echo [ ] User is logged in as student
echo [ ] Browser console shows no errors
echo [ ] Network tab shows no failed requests
echo [ ] localStorage has 'currentUser' data
echo.

echo If MyMedical still redirects to landing page:
echo =============================================
echo.
echo 1. Check browser console for errors
echo 2. Check if auth guard is rejecting the route
echo 3. Verify user authentication status
echo 4. Try hard refresh (Ctrl+F5)
echo 5. Clear browser cache and localStorage
echo.

echo ========================================
echo Debug setup complete! 
echo Follow the debugging steps above.
echo ========================================
pause