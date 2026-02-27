# Medical Record System - Laravel Backend

## Migration from Vanilla PHP to Laravel

This is the Laravel backend for the Medical Record System, migrated from vanilla PHP to provide better architecture, security, and maintainability.

## Setup Instructions

### 1. Database Configuration
The system uses the same MySQL database as the existing PHP backend:
- Database: `4seasons`
- Host: `127.0.0.1`
- Port: `3306`
- Username: `root`
- Password: (empty)

### 2. Installation
```bash
cd backend-laravel
composer install
php artisan key:generate
php artisan migrate
```

### 3. Running the Server
```bash
php artisan serve --port=8000
```
The API will be available at: `http://localhost:8000/api`

### 4. API Authentication
- Uses Laravel Sanctum for API authentication
- JWT tokens for secure API access
- Role-based access control

## Project Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   └── Api/          # API Controllers
│   ├── Requests/         # Form Request Validation
│   ├── Resources/        # API Resources (Response Formatting)
│   └── Middleware/       # Custom Middleware
├── Models/               # Eloquent Models
├── Services/             # Business Logic Services
└── Providers/            # Service Providers
```

## Migration Progress

### ✅ Phase 1: Foundation Setup (Current)
- [x] Laravel installation
- [x] Sanctum API authentication setup
- [x] Database configuration
- [x] Basic project structure
- [x] Directory organization

### 🔄 Phase 2: Authentication Migration (Next)
- [ ] Convert login endpoint
- [ ] JWT token implementation
- [ ] Role-based middleware
- [ ] Frontend integration

### ⏳ Phase 3: Core Endpoints Migration
- [ ] Student profile endpoints
- [ ] Medical visit endpoints
- [ ] QR code scanning
- [ ] Medical clearance system

### ⏳ Phase 4: Advanced Features
- [ ] Notification system
- [ ] Email service integration
- [ ] Pattern detection
- [ ] Reporting system

## API Endpoints (Planned)

### Authentication
- `POST /api/login` - User authentication
- `POST /api/logout` - User logout
- `POST /api/refresh` - Token refresh

### Students
- `GET /api/students/{id}` - Get student profile
- `PUT /api/students/{id}/profile` - Update student profile
- `GET /api/students/{id}/medical-data` - Get medical data

### Medical Visits
- `POST /api/medical-visits` - Create medical visit
- `GET /api/medical-visits` - List medical visits
- `GET /api/students/{id}/visits` - Get student visits

### QR Code
- `GET /api/qr-scan` - Scan QR code for student info
- `GET /api/students/{id}/qr` - Generate QR code

## Development Notes

- Maintains compatibility with existing database schema
- Gradual migration approach - both systems can run simultaneously
- Frontend will be updated incrementally to use new endpoints
- All existing functionality will be preserved

## Testing

```bash
# Run tests
php artisan test

# Run specific test
php artisan test --filter=AuthTest
```

## Deployment

The Laravel backend can be deployed alongside the existing PHP backend:
- Existing PHP: `http://localhost/backend/api/`
- New Laravel: `http://localhost:8000/api/`

This allows for gradual migration without downtime.