# 4Seasons Medical System - Quick Start Guide

## 🚀 Fastest Way to Start Everything

```bash
# Run this single command to start everything
docker-compose up -d
```

Then go to: **http://localhost:4200**

## 📋 Step-by-Step Instructions

### Option 1: Use Batch Files (Windows)
```bash
# Start everything at once
start-everything.bat

# Or start services separately
start-backend-only.bat    # Start database + backend
start-frontend-only.bat   # Start Angular frontend
```

### Option 2: Manual Commands

#### Start Backend & Database:
```bash
docker-compose up -d mysql backend-legacy
```

#### Start Frontend:
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

## 🌐 Service URLs

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8081
- **Database**: localhost:3307

## 🔑 Login Credentials

- **Username**: `00001`
- **Password**: `password`

## 🛠️ Useful Commands

```bash
# Check running containers
docker ps

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# Check frontend status
curl http://localhost:4200

# Check backend status
curl http://localhost:8081/api/test.php
```

## 🔧 Troubleshooting

### If frontend won't start:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm start
```

### If backend won't start:
```bash
docker-compose down
docker-compose up -d mysql backend-legacy
```

### If database connection fails:
```bash
docker-compose restart mysql
# Wait 30 seconds, then restart backend
docker-compose restart backend-legacy
```

## ✅ Verify Everything Works

Run the test script:
```bash
test-login-and-dashboard.bat
```

This will verify:
- ✅ Login API working
- ✅ Student Profile API working
- ✅ Medical Data API working
- ✅ Frontend accessible

## 🎯 Ready to Use!

Once everything is running:
1. Go to http://localhost:4200
2. Login with username: `00001`, password: `password`
3. Dashboard should load with student data, allergies, and medical records

The system is now fully functional! 🎉