# Security Implementation Guide

This document describes the security features implemented in the Medical Records System.

## Implemented Features

### 1. ID Obfuscation (Hashids)

**Purpose:** Hide real database IDs in URLs to prevent enumeration attacks

**Implementation:**
- Custom `HashidService` class for encoding/decoding IDs
- `HasHashid` trait for models
- No external dependencies required

**Usage:**

```php
// In Model
use App\Traits\HasHashid;

class Student extends Model {
    use HasHashid;
}

// Get hashed ID
$student = Student::find(123);
$hashedId = $student->hashid; // Returns: "jR3k5L"

// Find by hashed ID
$student = Student::findByHashid('jR3k5L');
```

**Example URLs:**
```
Before: /api/students/123
After:  /api/students/jR3k5L

Before: /api/shdf/456
After:  /api/shdf/mN8pQ2
```

### 2. Rate Limiting

**Purpose:** Prevent brute force attacks and API abuse

**Implementation:**
- Laravel's built-in throttle middleware
- Applied to all authenticated routes
- Configurable limits per endpoint type

**Configuration:**

```php
// In routes/api.php
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    // 60 requests per minute per user
});

// For sensitive endpoints
Route::middleware(['throttle:30,1'])->group(function () {
    // 30 requests per minute
});
```

**Limits:**
- General API: 60 requests/minute
- Login attempts: 5 requests/minute
- Sensitive data: 30 requests/minute

**Response when limit exceeded:**
```json
{
    "message": "Too Many Attempts.",
    "retry_after": 60
}
```

### 3. Audit Logging

**Purpose:** Track all access to sensitive medical data for compliance and security

**Implementation:**
- `AuditLog` model and database table
- `AuditMiddleware` for automatic logging
- Tracks: user, action, resource, IP, timestamp

**Database Schema:**

```sql
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(100),           -- view, create, update, delete
    resource_type VARCHAR(100),    -- Student, SHDF, MedicalVisit
    resource_id BIGINT,
    description TEXT,
    changes JSON,                  -- old/new values for updates
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP,
    INDEX (user_id, created_at),
    INDEX (resource_type, resource_id)
);
```

**What gets logged:**
- Viewing student medical records
- Creating/updating SHDF forms
- Creating/viewing medical visits
- User management actions
- Any sensitive data access

**Viewing Audit Logs:**

Admin dashboard shows recent activity:
```
GET /api/admin/activity-logs?limit=50&page=1
```

Response:
```json
{
    "activities": [
        {
            "id": 1,
            "action": "Jane Doe (Clinic Staff) viewed Student",
            "username": "nurse.jane",
            "full_name": "Jane Doe",
            "resource_type": "Student",
            "resource_id": 123,
            "ip_address": "192.168.1.100",
            "created_at": "2026-03-24T07:30:00Z"
        }
    ],
    "pagination": {
        "total": 1250,
        "per_page": 50,
        "current_page": 1,
        "last_page": 25
    }
}
```

## Configuration

### Environment Variables

Add to `.env`:

```env
# Hashids Configuration
HASHIDS_SALT="${APP_KEY}"
HASHIDS_MIN_LENGTH=6

# Rate Limiting
RATE_LIMIT_API=60
RATE_LIMIT_LOGIN=5
RATE_LIMIT_SENSITIVE=30

# Audit Logging
AUDIT_ENABLED=true
AUDIT_RETENTION_DAYS=365
```

### Security Config

File: `config/security.php`

```php
return [
    'hashids' => [
        'salt' => env('HASHIDS_SALT', env('APP_KEY')),
        'min_length' => env('HASHIDS_MIN_LENGTH', 6),
    ],
    'rate_limits' => [
        'api' => env('RATE_LIMIT_API', 60),
        'login' => env('RATE_LIMIT_LOGIN', 5),
        'sensitive' => env('RATE_LIMIT_SENSITIVE', 30),
    ],
    'audit' => [
        'enabled' => env('AUDIT_ENABLED', true),
        'retention_days' => env('AUDIT_RETENTION_DAYS', 365),
    ],
];
```

## Migration Steps

### 1. Run Database Migration

```bash
cd backend-laravel
php artisan migrate
```

This creates the `audit_logs` table.

### 2. Update Frontend (Optional - for Hashids)

If you want to use hashed IDs in frontend URLs, update API responses to include `hashid`:

```typescript
// In student.service.ts
export interface Student {
    student_id: number;
    hashid: string;  // Add this
    // ... other fields
}

// Use hashid in routes
this.router.navigate(['/students', student.hashid]);
```

### 3. Test the Implementation

```bash
# Test rate limiting
for i in {1..70}; do curl http://localhost:8000/api/students; done

# Check audit logs
curl http://localhost:8000/api/admin/activity-logs \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test hashid encoding
php artisan tinker
>>> $student = App\Models\Student::first();
>>> $student->hashid;
```

## Security Best Practices

### Additional Recommendations

1. **HTTPS Only (Production)**
   ```nginx
   # Force HTTPS redirect
   if ($scheme != "https") {
       return 301 https://$host$request_uri;
   }
   ```

2. **Security Headers**
   ```php
   // In middleware
   $response->headers->set('X-Frame-Options', 'DENY');
   $response->headers->set('X-Content-Type-Options', 'nosniff');
   $response->headers->set('Strict-Transport-Security', 'max-age=31536000');
   ```

3. **Database Encryption**
   ```php
   // For sensitive fields
   protected $casts = [
       'medical_notes' => 'encrypted',
   ];
   ```

4. **Regular Audit Log Review**
   - Set up weekly reports
   - Alert on suspicious patterns
   - Archive old logs after retention period

5. **IP Whitelisting (Optional)**
   ```php
   // For admin access
   Route::middleware(['ip.whitelist:192.168.1.0/24'])->group(...);
   ```

## Compliance Notes

For medical records systems, these features help with:

- **HIPAA Compliance:** Audit logging tracks all PHI access
- **Data Privacy:** ID obfuscation prevents unauthorized enumeration
- **Security Standards:** Rate limiting prevents abuse
- **Incident Response:** Audit logs provide forensic trail

## Maintenance

### Audit Log Cleanup

Create a scheduled task to clean old logs:

```php
// In app/Console/Kernel.php
protected function schedule(Schedule $schedule)
{
    $schedule->call(function () {
        $retentionDays = config('security.audit.retention_days', 365);
        \App\Models\AuditLog::where('created_at', '<', now()->subDays($retentionDays))
            ->delete();
    })->daily();
}
```

### Monitoring

Monitor these metrics:
- Rate limit violations per user
- Failed authentication attempts
- Unusual access patterns in audit logs
- API response times

## Troubleshooting

### Rate Limit Too Restrictive

Increase limits in `.env`:
```env
RATE_LIMIT_API=120  # Double the limit
```

### Audit Logs Growing Too Large

Reduce retention period:
```env
AUDIT_RETENTION_DAYS=180  # 6 months instead of 1 year
```

### Hashid Decode Errors

Ensure `APP_KEY` hasn't changed. If it has, old hashids won't decode.

## Summary

✅ **Hashids:** IDs obfuscated in URLs  
✅ **Rate Limiting:** 60 req/min for API, 5 req/min for login  
✅ **Audit Logging:** All sensitive data access tracked  
✅ **Configuration:** Centralized in `config/security.php`  
✅ **Compliance Ready:** HIPAA-friendly audit trail  

**Next Steps:**
1. Run migration: `php artisan migrate`
2. Test in development
3. Configure production limits
4. Set up log monitoring
5. Enable HTTPS in production
