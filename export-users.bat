@echo off
echo Exporting users from database...
docker exec 4seasons-db mysqldump -uroot -proot 4seasons users students advisers clinic_staff > database/users-data.sql
echo Done! Users exported to database/users-data.sql
echo.
echo You can now:
echo 1. Commit and push: git add database/users-data.sql
echo 2. Other team members can import: import-users.bat
pause
