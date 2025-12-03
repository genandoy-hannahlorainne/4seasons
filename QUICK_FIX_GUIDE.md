# Quick Fix Guide - Registration Issues

## TL;DR - What Was Wrong?

1. **Backend bugs** - Missing null checks and case-sensitive gender mapping
2. **Poor error messages** - Generic errors made debugging impossible
3. **Server not running** - Most likely cause of "connection failed" error

## Quick Fix Steps

### 1. Make Sure Backend is Running ⚠️
```bash
cd backend
start-server.bat
```
**This is the #1 cause of registration failures!**

### 2. Test Backend is Working
Open in browser: `http://localhost:8000/test-db.php`

Should see:
```json
{
  "success": true,
  "message": "Database connection successful",
  "roles": [...]
}
```

### 3. Try Registration Again
1. Go to `http://localhost:4200`
2. Click "Register"
3. Choose "Student"
4. Use a NEW student number (not one of these):
   - ❌ 2023-00438-TG-0 (already exists)
   - ❌ 2023-0048-TG-0 (already exists)
   - ❌ 2023-00435-TG-0 (already exists)
   - ❌ 2023-00124-TG-0 (already exists)
   - ✅ 2023-00001-TG-0 (use this!)

### 4. Check Browser Console
Press F12 → Console tab

You should see:
```
Sending registration data: { studentNumber: "...", ... }
```

If you see an error, it will now tell you EXACTLY what's wrong!

## Error Messages Explained

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Cannot connect to server" | Backend not running | Run `backend/start-server.bat` |
| "Username already exists" | Student number taken | Use different student number |
| "Database error" | MySQL not running | Start XAMPP MySQL |
| "Role is required" | Form validation issue | Check all required fields |

## Useful Test URLs

- Test DB: `http://localhost:8000/test-db.php`
- Check Users: `http://localhost:8000/check-users.php`
- CORS Test: `http://localhost:8000/cors-test.php`
- Delete Test User: `http://localhost:8000/delete-test-user.php?username=2023-00001-TG-0`

## What Was Fixed?

✅ Backend null handling
✅ Case-sensitive gender bug
✅ Better error messages
✅ Debug logging
✅ Transaction safety

## Still Having Issues?

1. Check browser console (F12)
2. Check backend server is running
3. Verify MySQL is running in XAMPP
4. Try a different student number
5. Look at the error message - it will tell you what's wrong!

## Success Indicators

✅ Backend server shows: "Backend API will be available at: http://localhost:8000"
✅ Test DB page shows roles
✅ Browser console shows "Sending registration data"
✅ Modal shows "Registration Successful!" with username

## Database Already Has 6 Users!

This proves registration WAS working before. The bugs fixed will make it more reliable and easier to debug when issues occur.
