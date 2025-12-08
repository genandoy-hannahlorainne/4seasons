# 🔧 Quick Fix - Rebuild Backend

The CORS and error message have been fixed. Just rebuild:

```bash
docker-compose down
docker-compose build backend
docker-compose up
```

Or use:
```bash
restart-docker.bat
```

## What Was Fixed:
1. ✅ Apache config simplified - lets PHP handle CORS
2. ✅ Error message updated - no more "port 8000" confusion
3. ✅ CORS headers properly set in Apache

## After Rebuild:
1. Go to http://localhost:4200/register
2. Select Student
3. Fill in the form
4. Click Register
5. Should work! 🎉

## If Still Not Working:
Check Docker logs:
```bash
docker logs 4seasons-backend
```

Test API directly:
```bash
curl -X POST http://localhost:8080/api/register.php -H "Content-Type: application/json" -d "{\"role\":\"student\",\"studentNumber\":\"2024001\",\"firstName\":\"Test\",\"lastName\":\"User\",\"password\":\"test123\",\"gender\":\"male\"}"
```
