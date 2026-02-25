# Frontend Integration Guide

## Current Status: ✅ COMMIT 4 COMPLETED

### Authentication Integration
The frontend has been successfully integrated with Laravel JWT authentication:

- **Login Flow**: Angular → Laravel `/api/login` → JWT token
- **Token Storage**: Secure localStorage storage
- **Auto-refresh**: Token refresh mechanism implemented
- **Dual API Support**: Both Laravel and legacy PHP APIs supported during migration

### API Integration Status

#### ✅ Completed Endpoints
- **Authentication**: `/api/login`, `/api/logout`, `/api/me`, `/api/refresh`
- **Students**: `/api/students` (list, show, update, medical-data, physical-info)

#### 🔄 Next Phase (Commit 5)
- Medical visits endpoints
- Admin dashboard endpoints  
- Adviser dashboard endpoints
- Staff dashboard endpoints

### Testing Results
- **Laravel API**: All student endpoints working (tested with 3 students)
- **JWT Authentication**: Bearer tokens properly validated
- **Frontend Services**: Auth and Student services updated for Laravel API
- **Interceptors**: Dual API support working correctly

### Usage Examples

#### Login (Angular Service)
```typescript
this.authService.login('admin', 'admin123').subscribe(
  user => {
    // JWT token automatically stored
    // User redirected to dashboard
  }
);
```

#### Get Students (Angular Service)  
```typescript
this.studentService.getAll({ search: 'John', grade_level: '7' }).subscribe(
  students => {
    // Paginated student list with relationships
    console.log(students.data); // Array of students
    console.log(students.total); // Total count
  }
);
```

#### Get Student Medical Data
```typescript
this.studentService.getMedicalData(21).subscribe(
  medicalData => {
    console.log(medicalData.medical_history);
    console.log(medicalData.allergies);
    console.log(medicalData.recent_visits);
  }
);
```

### Migration Strategy
1. **Gradual Migration**: Both APIs run simultaneously
2. **Feature Flags**: Components can switch between APIs
3. **Backward Compatibility**: Legacy endpoints maintained
4. **Testing**: Each endpoint tested before migration

### Next Steps
1. Update Angular components to use Laravel API
2. Test complete user flows
3. Migrate remaining endpoints
4. Performance optimization
5. Production deployment

## API Reference

### Authentication Endpoints
- `POST /api/login` - Login with username/password
- `POST /api/logout` - Logout and invalidate token  
- `GET /api/me` - Get current user info
- `POST /api/refresh` - Refresh JWT token

### Student Endpoints
- `GET /api/students` - List students (paginated, searchable)
- `GET /api/students/{id}` - Get student details with relationships
- `PUT /api/students/{id}` - Update student profile
- `GET /api/students/{id}/medical-data` - Get comprehensive medical data
- `PUT /api/students/{id}/physical-info` - Update height, weight, BMI

### Request/Response Examples

#### Login Request
```json
POST /api/login
{
  "username": "admin",
  "password": "admin123"
}
```

#### Login Response
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "user_id": 32,
      "username": "admin",
      "email": "admin@pdmhs.edu.ph",
      "full_name": "System Administrator",
      "role_id": 1,
      "role_name": "Admin"
    },
    "token": "8|ERXKfYCESsR7wq2KLziUyp8KaXUCCin3JFxOVtFoa5747138",
    "token_type": "Bearer",
    "expires_in": 86400
  }
}
```

#### Students List Response
```json
{
  "success": true,
  "message": "Students retrieved successfully",
  "data": {
    "current_page": 1,
    "data": [
      {
        "student_id": 21,
        "student_number": "136663100330",
        "first_name": "Wallance",
        "last_name": "Delgado",
        "grade_level": "7",
        "section": "Mapagmahal",
        "user": { ... },
        "medical_history": { ... },
        "allergies": [ ... ]
      }
    ],
    "total": 3,
    "per_page": 20
  }
}
```

## Environment Configuration

### Frontend (environment.ts)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api', // Laravel API
  legacyApiUrl: 'http://localhost/4seasons/backend/api' // Legacy PHP API
};
```

### Backend (.env)
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=4seasons
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost,localhost:4200,localhost:4201,127.0.0.1,127.0.0.1:8000
```

## Development Servers

### Laravel Backend
```bash
cd backend-laravel
php artisan serve --port=8000
# API available at http://localhost:8000/api
```

### Angular Frontend  
```bash
cd frontend
npm start
# or ng serve --port 4201
# App available at http://localhost:4201
```

## Testing Checklist

### ✅ Backend API Tests
- [x] POST /api/login (admin/admin123)
- [x] GET /api/me (with Bearer token)
- [x] GET /api/students (returns 3 students)
- [x] GET /api/students/21 (individual student)
- [x] GET /api/students/21/medical-data (medical info)

### 🔄 Frontend Integration Tests
- [ ] Login form with Laravel API
- [ ] Student list component with Laravel API
- [ ] Student detail component with Laravel API
- [ ] Medical data display with Laravel API
- [ ] Token refresh on expiry

### ⏳ End-to-End Tests
- [ ] Complete login flow
- [ ] Student management workflow
- [ ] Medical record access
- [ ] Role-based access control
- [ ] Logout and session cleanup