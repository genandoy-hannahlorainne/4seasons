# Test Registration with Docker

## 1. Start Docker
```bash
docker-compose up
```

Wait until you see:
- ✔ Container 4seasons-db Started
- ✔ Container 4seasons-backend Started  
- ✔ Container 4seasons-frontend Started

## 2. Access Application
- Frontend: http://localhost:4200
- Backend API: http://localhost:8080/api

## 3. Test Registration

### Test Student Registration:
Go to http://localhost:4200/register and fill in:
- Role: Student
- Student Number: 2024001
- First Name: Juan
- Last Name: Dela Cruz
- Password: test123
- Gender: Male

Click Register - should see success message!

### Test via API directly:
```bash
curl -X POST http://localhost:8080/api/register.php ^
  -H "Content-Type: application/json" ^
  -d "{\"role\":\"student\",\"studentNumber\":\"2024002\",\"firstName\":\"Maria\",\"lastName\":\"Santos\",\"password\":\"test123\",\"gender\":\"female\"}"
```

## 4. Verify in Database
```bash
docker exec -it 4seasons-db mysql -uroot -proot 4seasons -e "SELECT * FROM users;"
docker exec -it 4seasons-db mysql -uroot -proot 4seasons -e "SELECT * FROM students;"
```

## 5. Common Issues

### Issue: "Connection refused"
**Solution:** Make sure Docker Desktop is running

### Issue: "Port already in use"
**Solution:** Stop XAMPP or other services using ports 3307, 4200, 8080

### Issue: "Database connection error"
**Solution:** Wait 30 seconds for MySQL to fully start, then try again

## 6. Stop Docker
```bash
docker-compose down
```

## 7. Share Database Changes
After registering users, export and commit:
```bash
docker exec 4seasons-db mysqldump -u root -proot 4seasons > database/4seasons.sql
git add database/4seasons.sql
git commit -m "Added test users"
git push
```

Team members can get updates:
```bash
git pull
docker-compose down -v
docker-compose up
```
