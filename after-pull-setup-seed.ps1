$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $repoRoot 'backend-laravel'
$frontendPath = Join-Path $repoRoot 'frontend'

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Assert-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' is not available in PATH."
    }
}

Write-Host 'Starting post-pull bootstrap with seed for 4seasons...' -ForegroundColor Green

Assert-Command 'php'
Assert-Command 'composer'
Assert-Command 'npm'

if (-not (Test-Path $backendPath)) {
    throw "Missing folder: $backendPath"
}

if (-not (Test-Path $frontendPath)) {
    throw "Missing folder: $frontendPath"
}

Push-Location $backendPath
try {
    Write-Step 'Installing backend PHP dependencies'
    composer install

    if (-not (Test-Path '.env')) {
        if (Test-Path '.env.example') {
            Write-Step 'Creating backend .env from .env.example'
            Copy-Item '.env.example' '.env'
        } else {
            throw 'Missing .env and .env.example in backend-laravel.'
        }
    }

    $envContent = Get-Content '.env' -Raw
    if ($envContent -notmatch '(?m)^APP_KEY=base64:.+') {
        Write-Step 'Generating APP_KEY'
        php artisan key:generate --force
    }

    Write-Step 'Clearing Laravel cached config/routes/views'
    php artisan optimize:clear

    $storageLink = Join-Path $backendPath 'public/storage'
    if (-not (Test-Path $storageLink)) {
        Write-Step 'Creating storage symlink'
        php artisan storage:link
    } else {
        Write-Step 'Storage symlink already exists, skipping'
    }

    Write-Step 'Running database migrations with seed'
    php artisan migrate --seed --force
}
finally {
    Pop-Location
}

Push-Location $frontendPath
try {
    Write-Step 'Installing frontend dependencies'
    npm install
}
finally {
    Pop-Location
}

Write-Host "`nBootstrap with seed complete." -ForegroundColor Green
Write-Host 'Start backend:  cd backend-laravel; php artisan serve' -ForegroundColor Yellow
Write-Host 'Start frontend: cd frontend; npx ng serve' -ForegroundColor Yellow
