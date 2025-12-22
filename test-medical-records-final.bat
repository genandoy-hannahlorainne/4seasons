@echo off
echo Testing Medical Records API...
echo.

echo 1. Testing basic API connection...
curl -s "http://localhost:8080/api/test" | echo.

echo.
echo 2. Testing medical data endpoint...
curl -s "http://localhost:8080/api/test?medical=1&user_id=19" | echo.

echo.
echo 3. Testing frontend accessibility...
curl -s -I "http://localhost:4200" | findstr "200 OK"

echo.
echo 4. Testing student data in database...
docker exec 4seasons-mysql mysql -u root -proot -D 4seasons -e "SELECT student_id, student_number, first_name, last_name, user_id FROM students WHERE user_id = 19;"

echo.
echo Test completed!
pause