# Frontend Integration Guide - Laravel Authentication

## Overview

The Laravel authentication endpoint is now ready and fully compatible with your existing Angular frontend. Here's how to integrate it.

## API Endpoints

### Authentication Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/login` | POST | User login with JWT token | No |
| `/api/logout` | POST | User logout (revoke token) | Yes |
| `/api/refresh` | POST | Refresh JWT token | Yes |
| `/api/me` | GET | Get current user info | Yes |

## Frontend Changes Required

### 1. Update Environment Configuration

```typescript
// frontend/src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api', // Laravel API
  legacyApiUrl: 'http://localhost/backend/api' // Keep for gradual migration
};
```

### 2. Update Auth Service

```typescript
// frontend/src/app/core/services/auth.service.ts
login(username: string, password: string): Observable<User> {
  return this.http.post<any>(`${environment.apiUrl}/login`, { username, password })
    .pipe(map(response => {
      if (response && response.success && response.data) {
        const userData = response.data.user;
        const token = response.data.token;
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('token', token); // Store JWT token
        this.currentUserSubject.next(userData);
        
        return userData;
      }
      throw new Error('Invalid response format');
    }));
}

logout(): void {
  const token = localStorage.getItem('token');
  if (token) {
    // Call logout endpoint to revoke token
    this.http.post(`${environment.apiUrl}/logout`, {}).subscribe();
  }
  
  localStorage.removeItem('currentUser');
  localStorage.removeItem('token');
  this.currentUserSubject.next(null);
}
```

### 3. Update Auth Interceptor

```typescript
// frontend/src/app/core/interceptors/auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}` // Use Bearer token instead of custom header
      }
    });
  }
  
  return next(req);
};
```

### 4. Response Format Changes

The Laravel API returns a different response format:

**Old PHP Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": { ... }
}
```

**New Laravel Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "1|abc123...",
    "token_type": "Bearer",
    "expires_in": 86400
  }
}
```

### 5. User Object Structure

The user object now includes role-specific information:

```typescript
interface User {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  role_id: number;
  role_name: string;
  password_must_change: boolean;
  
  // Role-specific data (optional)
  admin_info?: { is_admin: boolean };
  student_info?: {
    student_id: number;
    student_number: string;
    first_name: string;
    last_name: string;
  };
  adviser_info?: {
    adviser_id: number;
    employee_id: string;
    contact_phone: string;
  };
  staff_info?: {
    clinic_staff_id: number;
    staff_id: string;
    position: string;
  };
}
```

## Testing the Integration

### 1. Test Login
```bash
# Start Laravel server
cd backend-laravel
php artisan serve --port=8000

# Test login endpoint
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 2. Test Protected Endpoint
```bash
# Use token from login response
curl -X GET http://localhost:8000/api/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Migration Strategy

### Phase 1: Update Auth Service Only
1. Update `auth.service.ts` to use Laravel endpoint
2. Keep all other services using legacy PHP endpoints
3. Test login/logout functionality

### Phase 2: Gradual Endpoint Migration
1. Update one service at a time to use Laravel endpoints
2. Test each service thoroughly
3. Keep fallback to legacy endpoints if needed

### Phase 3: Complete Migration
1. Remove legacy API URL from environment
2. Remove old PHP backend
3. Update all references

## Error Handling

The Laravel API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field": ["Validation error message"]
  }
}
```

Update your error handling to match this format.

## Token Management

- Tokens expire after 24 hours
- Use the `/api/refresh` endpoint to get a new token
- Implement automatic token refresh in your interceptor
- Handle 401 responses by redirecting to login

## Security Improvements

The Laravel authentication provides:
- JWT tokens instead of custom headers
- Token expiration and refresh
- Proper CORS handling
- Rate limiting (can be configured)
- Activity logging
- Role-based access control validation

## Backward Compatibility

During migration, you can run both systems:
- Laravel API: `http://localhost:8000/api/`
- Legacy PHP API: `http://localhost/backend/api/`

This allows for gradual migration without breaking existing functionality.