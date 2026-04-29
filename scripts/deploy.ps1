# 4Seasons Deployment Script (PowerShell)
# Usage: .\scripts\deploy.ps1 [staging|production] [-Rollback]

param(
    [Parameter(Position=0)]
    [ValidateSet("staging", "production")]
    [string]$Environment = "staging",
    
    [switch]$Rollback
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$BackupPath = "C:\Backups\4seasons\$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Logging functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check dependencies
function Test-Dependencies {
    Write-Info "Checking dependencies..."
    
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is not installed or not in PATH"
        exit 1
    }
    
    if (-not (Get-Command "docker compose" -ErrorAction SilentlyContinue)) {
        Write-Error "Docker Compose is not installed or not in PATH"
        exit 1
    }
    
    Write-Success "Dependencies check passed"
}

# Create backup
function New-Backup {
    if ($Environment -eq "production") {
        Write-Info "Creating backup..."
        
        New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
        
        # Backup database
        try {
            docker compose -f docker-compose.prod.yml exec -T backend php artisan backup:run --only-db
        }
        catch {
            Write-Warning "Database backup failed"
        }
        
        # Backup current files
        try {
            Copy-Item -Path "$ProjectDir\*" -Destination $BackupPath -Recurse -Force
        }
        catch {
            Write-Warning "File backup failed"
        }
        
        Write-Success "Backup created at $BackupPath"
        $BackupPath | Out-File -FilePath "$env:TEMP\last_backup_path.txt"
    }
}

# Rollback function
function Invoke-Rollback {
    Write-Warning "Starting rollback process..."
    
    $LastBackupFile = "$env:TEMP\last_backup_path.txt"
    if (Test-Path $LastBackupFile) {
        $BackupLocation = Get-Content $LastBackupFile
        if (Test-Path $BackupLocation) {
            Write-Info "Restoring from backup: $BackupLocation"
            Copy-Item -Path "$BackupLocation\*" -Destination $ProjectDir -Recurse -Force
            docker compose -f docker-compose.prod.yml up -d --force-recreate
            Write-Success "Rollback completed"
            return
        }
    }
    
    Write-Warning "No recent backup found, rolling back to previous git commit"
    Set-Location $ProjectDir
    git reset --hard HEAD~1
    docker compose -f docker-compose.prod.yml up -d --force-recreate
    Write-Success "Git rollback completed"
}

# Health check function
function Test-Health {
    param(
        [string]$Url = "http://localhost:8082/api/health",
        [int]$MaxAttempts = 10
    )
    
    Write-Info "Performing health check on $Url"
    
    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -TimeoutSec 30 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Success "Health check passed"
                return $true
            }
        }
        catch {
            Write-Warning "Health check failed (attempt $attempt/$MaxAttempts)"
            if ($attempt -eq $MaxAttempts) {
                Write-Error "Health check failed after $MaxAttempts attempts"
                return $false
            }
            Start-Sleep -Seconds 30
        }
    }
    
    return $false
}

# Deploy function
function Invoke-Deploy {
    Write-Info "Starting deployment to $Environment environment"
    
    Set-Location $ProjectDir
    
    # Pull latest code
    Write-Info "Pulling latest code..."
    git pull origin main
    
    # Build and deploy
    if ($Environment -eq "staging") {
        Write-Info "Deploying to staging..."
        docker compose -f docker-compose.prod.yml pull
        docker compose -f docker-compose.prod.yml up -d --remove-orphans
    }
    else {
        Write-Info "Deploying to production with zero-downtime strategy..."
        
        # Pull new images
        docker compose -f docker-compose.prod.yml pull
        
        # Start new containers alongside old ones
        docker compose -f docker-compose.prod.yml up -d --remove-orphans --scale backend=2
        
        # Wait for new containers to be healthy
        Write-Info "Waiting for new containers to be healthy..."
        $timeout = 300
        $elapsed = 0
        do {
            $healthyContainers = (docker compose -f docker-compose.prod.yml ps backend --filter "health=healthy" -q).Count
            if ($healthyContainers -ge 1) { break }
            Start-Sleep -Seconds 5
            $elapsed += 5
        } while ($elapsed -lt $timeout)
        
        # Scale down to single instance
        docker compose -f docker-compose.prod.yml up -d --remove-orphans --scale backend=1
    }
    
    # Wait for services to be ready
    Write-Info "Waiting for services to be ready..."
    Start-Sleep -Seconds 10
    
    # Run database migrations
    Write-Info "Running database migrations..."
    docker compose -f docker-compose.prod.yml exec -T backend php artisan migrate --force
    
    # Clear and optimize caches
    Write-Info "Optimizing application..."
    docker compose -f docker-compose.prod.yml exec -T backend php artisan config:clear
    docker compose -f docker-compose.prod.yml exec -T backend php artisan cache:clear
    docker compose -f docker-compose.prod.yml exec -T backend php artisan route:clear
    docker compose -f docker-compose.prod.yml exec -T backend php artisan view:clear
    
    # Cache for production
    docker compose -f docker-compose.prod.yml exec -T backend php artisan config:cache
    docker compose -f docker-compose.prod.yml exec -T backend php artisan route:cache
    docker compose -f docker-compose.prod.yml exec -T backend php artisan view:cache
    
    # Clean up old Docker images
    docker image prune -f
    
    Write-Success "Deployment completed successfully!"
}

# Main execution
function Main {
    Write-Info "4Seasons Deployment Script (PowerShell)"
    Write-Info "Environment: $Environment"
    
    if ($Rollback) {
        Invoke-Rollback
        return
    }
    
    Test-Dependencies
    New-Backup
    Invoke-Deploy
    
    # Perform health check
    $healthCheckUrl = if ($Environment -eq "staging") { "http://localhost:8082/api/health" } else { "http://localhost:8082/api/health" }
    $healthPassed = Test-Health -Url $healthCheckUrl
    
    if ($healthPassed) {
        Write-Success "Deployment process completed successfully!"
    }
    else {
        Write-Error "Deployment completed but health check failed"
        exit 1
    }
    
    # Show useful information
    Write-Host ""
    Write-Info "Useful commands:"
    Write-Host "  View logs: docker compose -f docker-compose.prod.yml logs -f backend"
    Write-Host "  Check status: docker compose -f docker-compose.prod.yml ps"
    Write-Host "  Execute commands: docker compose -f docker-compose.prod.yml exec backend php artisan --version"
    
    if ($Environment -eq "production" -and (Test-Path "$env:TEMP\last_backup_path.txt")) {
        Write-Host "  Rollback: .\scripts\deploy.ps1 production -Rollback"
        Write-Host "  Backup location: $(Get-Content "$env:TEMP\last_backup_path.txt")"
    }
}

# Handle script interruption
trap {
    Write-Error "Deployment interrupted"
    exit 1
}

# Run main function
Main