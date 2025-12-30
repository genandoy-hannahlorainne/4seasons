@echo off
echo ========================================
echo Checking Database for Student Records
echo ========================================
echo.

echo Checking if students exist in database...
echo.

echo 1. Checking users table:
docker exec -i 4seasons-mysql mysql -u4seasons -p4seasons 4seasons -e "SELECT user_id, username, role_id, full_name FROM users WHERE role_id = 2 LIMIT 5;"
echo.

echo 2. Checking students table:
docker exec -i 4seasons-mysql mysql -u4seasons -p4seasons 4seasons -e "SELECT student_id, user_id, student_number, first_name, last_name FROM students LIMIT 5;"
echo.

echo 3. Checking if user_id 1 has a student record:
docker exec -i 4seasons-mysql mysql -u4seasons -p4seasons 4seasons -e "SELECT * FROM students WHERE user_id = 1;"
echo.

echo 4. Checking if user_id 2 has a student record:
docker exec -i 4seasons-mysql mysql -u4seasons -p4seasons 4seasons -e "SELECT * FROM students WHERE user_id = 2;"
echo.

echo ========================================
echo Database Check Complete
echo ========================================
pause