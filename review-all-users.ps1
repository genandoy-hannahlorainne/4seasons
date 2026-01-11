#!/usr/bin/env pwsh

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "REVIEWING ALL USERS IN DATABASE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$DB_HOST = "localhost"
$DB_PORT = "3307"
$DB_USER = "root"
$DB_PASS = "root"
$DB_NAME = "4seasons_medical"

Write-Host "Connecting to database: $DB_NAME" -ForegroundColor Yellow
Write-Host "Host: $DB_HOST`:$DB_PORT" -ForegroundColor Yellow
Write-Host ""

# Run the SQL queries
$sqlFile = "review-all-users.sql"

if (Test-Path $sqlFile) {
    Write-Host "Running SQL queries from $sqlFile..." -ForegroundColor Green
    Write-Host ""
    
    # Execute MySQL with the SQL file
    mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME < $sqlFile
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Review Complete!" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
} else {
    Write-Host "Error: $sqlFile not found!" -ForegroundColor Red
}

Read-Host "Press Enter to exit"
