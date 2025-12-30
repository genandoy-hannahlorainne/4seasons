# Adviser Login Credentials - FIXED ✅

## Available Adviser Accounts

### 1. Jane Smith
- **Username**: `jane.smith`
- **Password**: `password`
- **Full Name**: Jane Smith
- **Role**: Adviser
- **User ID**: 17
- **Adviser ID**: 1

### 2. Irene DelMonte
- **Username**: `irene.delmonte`
- **Password**: `password`
- **Full Name**: Irene DelMonte
- **Role**: Adviser
- **User ID**: 22
- **Adviser ID**: 2

## How to Login as Adviser

1. Go to: http://localhost:4200
2. Click "Login"
3. Use any of the adviser credentials above
4. You'll be redirected to the adviser dashboard

## All System Login Credentials

### Student Account
- **Username**: `00001`
- **Password**: `password`
- **Role**: Student (Hannah Lorainne Genandoy)

### Adviser Accounts
- **Username**: `jane.smith` | **Password**: `password`
- **Username**: `irene.delmonte` | **Password**: `password`

## Testing Adviser Login

Run this command to test:
```bash
# Test Jane Smith
curl -X POST "http://localhost:8081/api/login.php" -H "Content-Type: application/json" -d '{"username":"jane.smith","password":"password"}'

# Test Irene DelMonte
curl -X POST "http://localhost:8081/api/login.php" -H "Content-Type: application/json" -d '{"username":"irene.delmonte","password":"password"}'
```

## Status
✅ Both adviser accounts are now working and can access the adviser dashboard!

Pwede ka na mag-login sa adviser dashboard using any of the accounts above.