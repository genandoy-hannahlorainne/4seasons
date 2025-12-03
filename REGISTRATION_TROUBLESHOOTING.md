# Registration Troubleshooting Guide

## Issues Found and Fixed

### 1. Backend Code Issues (FIXED)
- ✅ Added proper null handling for `birth_date` field
- ✅ Fixed case-sensitive gender mapping (now handles lowercase values)
- ✅ Added better error handling with PDOException
- ✅ Added validation for required student fields
- ✅ Improved transaction safety

### 2. Current Status
The database shows **6 users successfully registered**, which means registration HAS been working!

## How to Test if Registration is Working Now

### Step 1: Make sure the backend server is running
```bash
cd backend
start-server.bat
```
The server should start on `http://localhost:8000`

### Step 2: Test the backend directly
Open your browser and go to:
```
http://localhost:8000/test-db.php
```
You should see a JSON response with roles.

### Step 3: Test CORS
```
http://localhost:8000/cors-test.php
```
Should return: `{"message":"CORS test successful","method":"GET"}`

### Step 4: Check existing users
```
http://localhost:8000/check-users.php
```
This will show all registered users.

### Step 5: Try registering again
1. Make sure the backend server is running (Step 1)
2. Open the Angular app at `http://localhost:4200`
3. Try to register with a NEW student number (not one already in the database)

## Common Issues

### Issue: "Registration failed. Please check your connection"
**Causes:**
1. Backend server is not running
2. Backend is running on wrong port
3. CORS headers not being sent
4. Network connectivity issue

**Solution:**
1. Start the backend server: `cd backend && start-server.bat`
2. Verify it's running on port 8000
3. Check browser console for actual error message

### Issue: "Username already exists"
**Cause:** The student number is already registered

**Solution:** Use a different student number

### Issue: Database connection error
**Cause:** MySQL/MariaDB is not running or database doesn't exist

**Solution:**
1. Start XAMPP
2. Make sure MySQL is running
3. Import the database: `database/4seasons.sql`

## Testing with Different Student Numbers

The following student numbers are already registered:
- 2023-00438-TG-0
- 2023-0048-TG-0
- 2023-00435-TG-0
- 2023-00124-TG-0

Use a different number like:
- 2023-00001-TG-0
- 2023-00002-TG-0
- etc.

## Debug Mode

To see detailed error messages, check the browser's Developer Console (F12):
1. Open Developer Tools (F12)
2. Go to Console tab
3. Try to register
4. Look for red error messages

The error response will now include more details about what went wrong.
