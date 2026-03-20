# Docker Development Environment

This document describes the enhanced Docker setup for the Medical Record System.

## Services Overview

### Core Application Services
- **Backend (Laravel)**: `http://localhost:8081`
- **Frontend (Angular)**: `http://localhost:4200`

### Database Services
- **MySQL (Main)**: `localhost:3307`
  - Database: `4seasons`
  - Username: `root`
  - Password: `secret`
- **MySQL (Test)**: `localhost:3308`
  - Database: `4seasons_test`
  - Username: `root`
  - Password: `secret`

### Development Tools
- **phpMyAdmin**: `http://localhost:8080`
  - Access both main and test databases
  - Username: `root`
  - Password: `secret`
- **Redis**: `localhost:6379`
  - Used for caching and sessions
- **MailHog**: `http://localhost:8025`
  - Email testing interface
  - SMTP: `localhost:1025`

## Environment Files

### `.env` (Current - Docker)
Used when running with Docker Compose. Configured for:
- MySQL service connection
- Redis caching
- MailHog email testing

### `.env.docker`
Backup of Docker-specific configuration

### `.env.local`
For local development without Docker:
- Local MySQL connection
- File-based caching
- Mailtrap email configuration

### `.env.testing`
For running tests:
- Separate test database
- Array-based sessions and cache
- Sync queue processing

## Getting Started

### 1. Start All Services
```bash
docker-compose up -d
```

### 2. Check Service Status
```bash
docker-compose ps
```

### 3. View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### 4. Access Services
- **Application**: http://localhost:4200
- **API**: http://localhost:8081
- **Database Admin**: http://localhost:8080
- **Email Testing**: http://localhost:8025

## Database Management

### Connect to Main Database
- **Host**: `localhost`
- **Port**: `3307`
- **Database**: `4seasons`
- **Username**: `root`
- **Password**: `secret`

### Connect to Test Database
- **Host**: `localhost`
- **Port**: `3308`
- **Database**: `4seasons_test`
- **Username**: `root`
- **Password**: `secret`

### Run Migrations
```bash
# Main database
docker-compose exec backend php artisan migrate

# Test database
docker-compose exec backend php artisan migrate --database=mysql_test
```

## Testing

### Run Tests
```bash
# All tests
docker-compose exec backend php artisan test

# Specific test
docker-compose exec backend php artisan test --filter=AuthTest
```

### Frontend Tests
```bash
# Unit tests
docker-compose exec frontend npm test

# E2E tests
docker-compose exec frontend npm run e2e
```

## Development Workflow

### Backend Development
1. Make changes to Laravel files
2. Changes are automatically reflected (volume mounted)
3. For new dependencies: `docker-compose exec backend composer install`

### Frontend Development
1. Make changes to Angular files
2. Hot reload is enabled
3. For new dependencies: `docker-compose exec frontend npm install`

### Database Changes
1. Create migration: `docker-compose exec backend php artisan make:migration`
2. Run migration: `docker-compose exec backend php artisan migrate`
3. Seed data: `docker-compose exec backend php artisan db:seed`

## Troubleshooting

### Reset Everything
```bash
docker-compose down -v
docker-compose up -d
```

### Rebuild Services
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Check Service Health
```bash
docker-compose exec mysql mysqladmin ping -h localhost
docker-compose exec redis redis-cli ping
```

## Environment Switching

### Switch to Local Development
```bash
cp .env.local .env
# Update database and other local configurations
```

### Switch Back to Docker
```bash
cp .env.docker .env
```

### For Testing
```bash
cp .env.testing .env
# Run tests
cp .env.docker .env  # Switch back
```