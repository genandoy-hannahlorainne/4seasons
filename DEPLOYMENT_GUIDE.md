# Medical Record System - Deployment Guide

## 🎯 Overview

This guide provides step-by-step instructions to deploy the fixed Medical Record System with proper Docker networking, authentication, and admin panel functionality.

## 📋 Prerequisites

- Docker and Docker Compose installed
- PowerShell (for Windows) or Bash (for Linux/Mac)
- Web browser for testing
- Basic understanding of Docker containers

## 🚀 Deployment Steps

### Step 1: Stop Current System
```bash
# Stop all running containers
docker-compose down

# Remove old containers and images (optional, for clean start)
docker-compose down --rmi all --volumes --remove-orphans
```

### Step 2: Verify Configuration Files

Ensure these files have been updated with the fixes:

#### ✅ Frontend Environment Files
- `frontend/src/environments/environment.ts` - Uses `/api` for production
- `frontend/src/environments/environment.development.ts` - Uses `/api` for Docker compatibility

#### ✅ Docker Configuration
- `docker-compose.yml` - Added explicit networking and environment variables
- `frontend/nginx.conf` - Proxy configuration for `/api/` routes

#### ✅ Backend Configuration
- `backend-laravel/config/cors.php` - Enhanced CORS for Docker containers
- `backend-laravel/routes/api.php` - Added missing admin routes
- `backend-laravel/app/Http/Controllers/Api/AdminController.php` - Added notification and activity methods

#### ✅ Frontend Services
- `frontend/src/app/core/services/admin.service.ts` - Updated with missing methods

### Step 3: Build and Start Services
```bash
# Build containers with no cache (ensures fresh build)
docker-compose build --no-cache

# Start all services in detached mode
docker-compose up -d

# Check service status
docker-compose ps
```

Expected output:
```
NAME         COMMAND                  SERVICE     STATUS          PORTS
backend      "docker-php-entrypoi…"   backend     Up 30 seconds   0.0.0.0:8080->80/tcp
frontend     "/docker-entrypoint.…"   frontend    Up 30 seconds   0.0.0.0:4200->80/tcp
mysql        "docker-entrypoint.s…"   mysql       Up 30 seconds   0.0.0.0:3307->3306/tcp, 33060/tcp
phpmyadmin   "/docker-entrypoint.…"   phpmyadmin  Up 30 seconds   0.0.0.0:8081->80/tcp
```

### Step 4: Wait for Services to Initialize
```bash
# Wait for MySQL to be ready (about 30-60 seconds)
echo "Waiting for services to initialize..."
sleep 60

# Check backend health
curl http://localhost:8080/api/health
```

### Step 5: Run System Flow Tests
```powershell
# Run the comprehensive test script
./test-system-flow.ps1
```

Or manually test each component:

#### Test Backend Health
```bash
curl http://localhost:8080/api/health
```
Expected: `{"success":true,"message":"Medical Record System API is running"}`

#### Test Frontend Access
Open browser: `http://localhost:4200`
Expected: Angular application loads

#### Test Database Connection
```bash
curl http://localhost:8080/api/debug/database
```
Expected: Database statistics with user counts

### Step 6: Verify Admin Authentication

#### Login as Admin
1. Open: `http://localhost:4200/login`
2. Enter credentials:
   - Username: `admin`
   - Password: `Admin@123`
3. Should redirect to admin dashboard

#### Test Admin API Access
```bash
# First login to get token
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'

# Use token to access admin endpoints
curl -X GET http://localhost:8080/api/get-all-users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Step 7: Test User Management

1. Navigate to: `http://localhost:4200/dashboard/admin/manage-users`
2. Verify users are displayed (should show 4 users)
3. Test user creation, editing, and status changes
4. Test bulk import functionality

### Step 8: Validate System Workflows

#### Admin Workflow
- ✅ Login with admin credentials
- ✅ Access admin dashboard
- ✅ View system statistics
- ✅ Manage users (create, edit, activate/deactivate)
- ✅ Access system settings
- ✅ View reports and analytics

#### Student Workflow
- ✅ Login with student credentials
- ✅ View personal profile
- ✅ Access medical history
- ✅ View visit records

#### Clinic Staff Workflow
- ✅ Login with clinic staff credentials
- ✅ Access student records
- ✅ Record medical visits
- ✅ Send parent notifications

#### Adviser Workflow
- ✅ Login with adviser credentials
- ✅ View assigned students
- ✅ Monitor health status
- ✅ Access class health reports

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Containers Not Starting
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql

# Common fix: Remove volumes and restart
docker-compose down --volumes
docker-compose up -d
```

#### 2. Frontend Cannot Reach Backend
```bash
# Check nginx configuration
docker exec frontend cat /etc/nginx/conf.d/default.conf

# Test internal network connectivity
docker exec frontend curl http://backend:80/api/health
```

#### 3. Database Connection Issues
```bash
# Check MySQL logs
docker-compose logs mysql

# Verify database exists
docker exec mysql mysql -u root -psecret -e "SHOW DATABASES;"

# Check Laravel database configuration
docker exec backend cat .env | grep DB_
```

#### 4. Authentication Failures
```bash
# Check if admin user exists
curl http://localhost:8080/api/debug/database

# Reset admin password (if needed)
docker exec backend php artisan tinker
# In tinker: User::where('username', 'admin')->first()->update(['password_hash' => Hash::make('Admin@123')]);
```

#### 5. CORS Issues
```bash
# Test CORS headers
curl -H "Origin: http://localhost:4200" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:8080/api/login
```

### Performance Optimization

#### 1. Container Resource Limits
Add to `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

#### 2. Database Optimization
```bash
# Optimize MySQL configuration
docker exec mysql mysql -u root -psecret -e "
SET GLOBAL innodb_buffer_pool_size = 128M;
SET GLOBAL query_cache_size = 32M;
"
```

#### 3. Frontend Build Optimization
```bash
# Build production frontend
cd frontend
npm run build --prod
```

## 📊 Monitoring and Maintenance

### Health Checks
```bash
# Create monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash
echo "=== System Health Check ==="
echo "Backend: $(curl -s http://localhost:8080/api/health | jq -r .message)"
echo "Frontend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:4200)"
echo "Database: $(docker exec mysql mysqladmin -u root -psecret ping)"
echo "=========================="
EOF

chmod +x monitor.sh
./monitor.sh
```

### Log Management
```bash
# View recent logs
docker-compose logs --tail=50 --follow

# Clear logs (if they get too large)
docker-compose down
docker system prune -f
docker-compose up -d
```

### Backup Procedures
```bash
# Database backup
docker exec mysql mysqldump -u root -psecret 4seasons > backup_$(date +%Y%m%d).sql

# Application backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz backend-laravel frontend
```

## 🎯 Success Criteria

The deployment is successful when:

- ✅ All 4 Docker containers are running
- ✅ Backend health check returns success
- ✅ Frontend loads without errors
- ✅ Admin can login and access dashboard
- ✅ User management functions work
- ✅ Database shows correct user counts
- ✅ All 4 user roles can authenticate
- ✅ API endpoints respond correctly
- ✅ No CORS or network errors in browser console

## 📞 Support

If you encounter issues:

1. **Check the test script output**: `./test-system-flow.ps1`
2. **Review container logs**: `docker-compose logs [service_name]`
3. **Verify network connectivity**: Test internal Docker networking
4. **Check configuration files**: Ensure all fixes are applied
5. **Restart services**: `docker-compose restart`

## 🎉 Next Steps

After successful deployment:

1. **User Training**: Train staff on the new system
2. **Data Migration**: Import existing student/staff data
3. **Customization**: Adjust settings for your school
4. **Monitoring**: Set up regular health checks
5. **Backup Schedule**: Implement automated backups

---

**Deployment Status**: 🚀 **READY FOR PRODUCTION**  
**Last Updated**: March 14, 2026  
**Version**: 2.0.0 - Complete System Flow