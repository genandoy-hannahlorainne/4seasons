@echo off
echo ========================================
echo Medical Records Feature Complete Test
echo ========================================
echo.

echo Step 1: Adding sample medical data...
call add-sample-medical-data.bat
echo.

echo Step 2: Testing backend API endpoints...
echo.

echo Testing medical record endpoint...
curl -X GET "http://localhost:8080/api/medical-record" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nStatus: %%{http_code}\n"
echo.

echo Testing medical visits endpoint...
curl -X GET "http://localhost:8080/api/medical-visits" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nStatus: %%{http_code}\n"
echo.

echo Step 3: Frontend should now be accessible at:
echo http://localhost:4200/dashboard/student/medical-records
echo.

echo Step 4: Manual testing checklist:
echo [ ] Navigate to student dashboard
echo [ ] Click on "MyMedical" link
echo [ ] Verify medical records overview page loads
echo [ ] Click on "Personal Medical Info" 
echo [ ] Verify form displays student data
echo [ ] Test editing emergency contact and address
echo [ ] Click on "Medical Visits History"
echo [ ] Verify visits list displays
echo [ ] Click on a visit to see details modal
echo.

echo ========================================
echo Test completed! Check the results above.
echo ========================================
pause