# Docker Networking Fix Script
# Fixes frontend-backend communication issues in Docker containers

Write-Host "🔧 Docker Networking Fix Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Step 1: Stop current containers
Write-Host "`n1. 🛑 Stopping current containers..." -ForegroundColor Yellow
try {
    docker-compose down
    Write-Host "✅ Containers stopped successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️ No containers to stop or error occurred" -ForegroundColor Yellow
}

# Step 2: Clean up Docker resources
Write-Host "`n2. 🧹 Cleaning up Docker resources..." -ForegroundColor Yellow
try {
    # Remove unused networks
    docker network prune -f
    
    # Remove unused volumes (be careful with this)
    # docker volume prune -f
    
    Write-Host "✅ Docker cleanup completed" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Cleanup had some issues, continuing..." -ForegroundColor Yellow
}

# Step 3: Rebuild containers with no cache
Write-Host "`n3. 🔨 Rebuilding containers..." -ForegroundColor Yellow
try {
    docker-compose build --no-cache
    Write-Host "✅ Containers rebuilt successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Container rebuild failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Start services
Write-Host "`n4. 🚀 Starting services..." -ForegroundColor Yellow
try {
    docker-compose up -d
    Write-Host "✅ Services started successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Service startup failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 5: Wait for services to initialize
Write-Host "`n5. ⏳ Waiting for services to initialize..." -ForegroundColor Yellow
Write-Host "   This may take 60-90 seconds for MySQL to be ready..." -ForegroundColor Gray

for ($i = 1; $i -le 18; $i++) {
    Start-Sleep 5
    Write-Host "." -NoNewline -ForegroundColor Gray
    
    # Check if backend is responding
    try {
        $healthCheck = Invoke-RestMethod -Uri "http://localhost:8080/api/health" -Method GET -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($healthCheck.success) {
            Write-Host "`n✅ Backend is ready!" -ForegroundColor Green
            break
        }
    } catch {
        # Continue waiting
    }
    
    if ($i -eq 18) {
        Write-Host "`n⚠️ Backend taking longer than expected, continuing with tests..." -ForegroundColor Yellow
    }
}

# Step 6: Test Docker networking
Write-Host "`n6. 🔍 Testing Docker networking..." -ForegroundColor Yellow

# Test 6a: Container status
Write-Host "`n   6a. Container Status:" -ForegroundColor Cyan
try {
    $containerStatus = docker-compose ps --format "table {{.Name}}\t{{.State}}\t{{.Ports}}"
    Write-Host $containerStatus -ForegroundColor White
} catch {
    Write-Host "❌ Failed to get container status" -ForegroundColor Red
}

# Test 6b: Internal network connectivity
Write-Host "`n   6b. Internal Network Connectivity:" -ForegroundColor Cyan
try {
    # Test if frontend can reach backend internally
    $internalTest = docker exec frontend curl -s http://backend:80/api/health
    if ($internalTest -match "success") {
        Write-Host "✅ Frontend → Backend internal communication: WORKING" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend → Backend internal communication: FAILED" -ForegroundColor Red
        Write-Host "   Response: $internalTest" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Internal network test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6c: External access
Write-Host "`n   6c. External Access:" -ForegroundColor Cyan
try {
    # Test backend direct access
    $backendTest = Invoke-RestMethod -Uri "http://localhost:8080/api/health" -Method GET -TimeoutSec 10
    if ($backendTest.success) {
        Write-Host "✅ Backend direct access: WORKING" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend direct access: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

try {
    # Test frontend access
    $frontendTest = Invoke-WebRequest -Uri "http://localhost:4200" -Method GET -TimeoutSec 10
    if ($frontendTest.StatusCode -eq 200) {
        Write-Host "✅ Frontend access: WORKING" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend access: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6d: Proxy functionality
Write-Host "`n   6d. Nginx Proxy Test:" -ForegroundColor Cyan
try {
    # Test if frontend can proxy to backend
    $proxyTest = Invoke-RestMethod -Uri "http://localhost:4200/api/health" -Method GET -TimeoutSec 10
    if ($proxyTest.success) {
        Write-Host "✅ Frontend → Backend proxy: WORKING" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend → Backend proxy: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   This indicates nginx proxy configuration issues" -ForegroundColor Gray
}

# Step 7: Test authentication flow
Write-Host "`n7. 🔐 Testing Authentication Flow..." -ForegroundColor Yellow
try {
    # Test admin login through proxy
    $loginData = @{
        username = "admin"
        password = "Admin@123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:4200/api/login" -Method POST -Body $loginData -ContentType "application/json" -TimeoutSec 10
    
    if ($loginResponse.success) {
        Write-Host "✅ Admin authentication through proxy: WORKING" -ForegroundColor Green
        
        # Test authenticated API call
        $token = $loginResponse.data.token
        $headers = @{ Authorization = "Bearer $token" }
        $usersResponse = Invoke-RestMethod -Uri "http://localhost:4200/api/get-all-users" -Method GET -Headers $headers -TimeoutSec 10
        
        if ($usersResponse.success) {
            Write-Host "✅ Authenticated API calls through proxy: WORKING" -ForegroundColor Green
            Write-Host "   Total users found: $($usersResponse.totals.total)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ Authentication flow test failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 8: Network diagnostics
Write-Host "`n8. 🔍 Network Diagnostics..." -ForegroundColor Yellow

# Check Docker networks
Write-Host "`n   Docker Networks:" -ForegroundColor Cyan
try {
    $networks = docker network ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"
    Write-Host $networks -ForegroundColor White
} catch {
    Write-Host "❌ Failed to list Docker networks" -ForegroundColor Red
}

# Check container network details
Write-Host "`n   Container Network Details:" -ForegroundColor Cyan
try {
    $networkDetails = docker inspect $(docker-compose ps -q) --format='{{.Name}}: {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
    Write-Host $networkDetails -ForegroundColor White
} catch {
    Write-Host "❌ Failed to get network details" -ForegroundColor Red
}

# Step 9: Generate fix recommendations
Write-Host "`n9. 💡 Fix Recommendations..." -ForegroundColor Yellow

$recommendations = @()

# Check if containers are running
$runningContainers = docker-compose ps --services --filter "status=running"
if ($runningContainers.Count -lt 4) {
    $recommendations += "⚠️ Not all containers are running. Run: docker-compose up -d"
}

# Check if backend is accessible
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/health" -Method GET -TimeoutSec 5 | Out-Null
} catch {
    $recommendations += "⚠️ Backend not accessible. Check backend container logs: docker-compose logs backend"
}

# Check if proxy is working
try {
    Invoke-RestMethod -Uri "http://localhost:4200/api/health" -Method GET -TimeoutSec 5 | Out-Null
} catch {
    $recommendations += "⚠️ Nginx proxy not working. Check frontend container logs: docker-compose logs frontend"
}

if ($recommendations.Count -eq 0) {
    Write-Host "✅ All networking tests passed! System should be working correctly." -ForegroundColor Green
} else {
    Write-Host "⚠️ Issues found. Recommendations:" -ForegroundColor Yellow
    foreach ($rec in $recommendations) {
        Write-Host "   $rec" -ForegroundColor White
    }
}

# Step 10: Final instructions
Write-Host "`n10. 🎯 Next Steps..." -ForegroundColor Yellow
Write-Host "   1. Open browser: http://localhost:4200" -ForegroundColor White
Write-Host "   2. Login as admin: admin / Admin@123" -ForegroundColor White
Write-Host "   3. Test admin panel functionality" -ForegroundColor White
Write-Host "   4. If issues persist, check container logs:" -ForegroundColor White
Write-Host "      - Backend: docker-compose logs backend" -ForegroundColor Gray
Write-Host "      - Frontend: docker-compose logs frontend" -ForegroundColor Gray
Write-Host "      - MySQL: docker-compose logs mysql" -ForegroundColor Gray

Write-Host "`n🎉 Docker Networking Fix Complete!" -ForegroundColor Cyan