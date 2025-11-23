# Backend - PHP Laravel

Laravel backend for StudentCare+ system.

## Structure

### app/
- Controllers: Handle HTTP requests
- Models: Database models
- Services: Business logic

### routes/
- API route definitions
- Web routes

### database/
- Migrations: Database schema
- Seeders: Test data

### config/
- Laravel configuration files
- Environment settings

## Features
- Medical records API
- QR code generation
- SMS alerts (Twilio/Globe)
- Role-based authentication
- Automated backup system (2 AM daily)

## Setup
```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
```
