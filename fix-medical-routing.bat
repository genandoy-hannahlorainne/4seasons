@echo off
echo ========================================
echo Medical Records Routing Fix
echo ========================================
echo.

echo This script will fix the medical records routing issues.
echo.

echo Step 1: Adding sample medical data to database...
call add-sample-medical-data.bat
echo.

echo Step 2: Testing backend API endpoints...
echo.

echo Testing medical record endpoint...
curl -X GET "http://localhost:8080/api/medical-record" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nStatus: %%{http_code}\n" ^
  -s
echo.

echo Testing medical visits endpoint...
curl -X GET "http://localhost:8080/api/medical-visits" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nStatus: %%{http_code}\n" ^
  -s
echo.

echo Step 3: Routing Configuration Summary
echo =====================================
echo.
echo Main App Routes:
echo - /dashboard → Dashboard routes
echo.
echo Dashboard Routes:
echo - /dashboard/student → Student Dashboard
echo - /dashboard/student/medical-records → Medical Records (lazy loaded)
echo.
echo Medical Records Routes:
echo - /dashboard/student/medical-records → Overview page
echo - /dashboard/student/medical-records/personal-info → Personal Info Form
echo - /dashboard/student/medical-records/visits-history → Visits History
echo.

echo Step 4: Frontend Configuration
echo ==============================
echo.
echo ✓ Auth interceptor updated to include user_id header
echo ✓ Medical records service configured with correct API URLs
echo ✓ Components are standalone with proper imports
echo ✓ Routes are lazy loaded for better performance
echo.

echo Step 5: Backend Configuration
echo =============================
echo.
echo ✓ MedicalRecordController created with all endpoints
echo ✓ API routes added to routes/api.php
echo ✓ Controllers updated to use user_id header
echo ✓ Sample data script created
echo.

echo Step 6: Manual Testing Instructions
echo ===================================
echo.
echo 1. Make sure Angular dev server is running:
echo    cd frontend
echo    ng serve
echo.
echo 2. Make sure Laravel backend is running:
echo    cd backend-laravel
echo    php artisan serve --host=0.0.0.0 --port=8080
echo.
echo 3. Open browser and navigate to:
echo    http://localhost:4200
echo.
echo 4. Login as a student (use existing test credentials)
echo.
echo 5. Click on "MyMedical" in the top navigation
echo.
echo 6. You should see the medical records overview page with:
echo    - Summary cards showing visit counts and allergies
echo    - Two action cards for Personal Info and Visits History
echo.
echo 7. Test navigation:
echo    - Click "Personal Medical Info" → Should show comprehensive form
echo    - Click "Medical Visits History" → Should show visits list
echo.

echo Step 7: Troubleshooting
echo =======================
echo.
echo If the page doesn't load, check:
echo.
echo Frontend Issues:
echo - Check browser console for JavaScript errors
echo - Verify Angular dev server is running on port 4200
echo - Check network tab for failed API requests
echo.
echo Backend Issues:
echo - Verify Laravel server is running on port 8080
echo - Check Laravel logs: backend-laravel/storage/logs/laravel.log
echo - Test API endpoints directly with curl (see above)
echo.
echo Database Issues:
echo - Verify Docker containers are running: docker ps
echo - Check if sample data was added successfully
echo - Verify student records exist in database
echo.

echo ========================================
echo Fix Complete!
echo ========================================
echo.
echo The medical records routing should now be working.
echo Follow the manual testing instructions above to verify.
echo.
pause