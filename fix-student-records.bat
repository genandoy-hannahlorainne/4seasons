@echo off
echo ========================================
echo Fixing Missing Student Records
echo ========================================
echo.

echo The error "Student not found" means walang student record 
echo sa database na naka-link sa user account.
echo.

echo Step 1: Checking current database state...
call check-database-students.bat
echo.

echo Step 2: Creating missing student records...
docker exec -i 4seasons-mysql mysql -u4seasons -p4seasons 4seasons < create-missing-students.sql
echo.

echo Step 3: Verifying the fix...
echo.

echo Testing student medical data endpoint:
curl -X GET "http://localhost:8080/api/student/medical-data?student_id=1" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nHTTP Status: %%{http_code}\n"
echo.

echo Testing medical records endpoint:
curl -X GET "http://localhost:8080/api/medical-record" ^
  -H "Content-Type: application/json" ^
  -H "user_id: 1" ^
  -w "\nHTTP Status: %%{http_code}\n"
echo.

echo Step 4: Adding sample medical data...
call add-sample-medical-data.bat
echo.

echo ========================================
echo Fix Complete!
echo ========================================
echo.
echo Now try:
echo 1. Refresh your browser (Ctrl+F5)
echo 2. Login as student
echo 3. Click "MyMedical" - should work now!
echo.
pause