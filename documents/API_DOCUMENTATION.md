# API Documentation

Base URL: `http://localhost:8081/api`

Swagger UI: `http://localhost:8081/swagger`
OpenAPI source: [`documents/openapi.yaml`](./openapi.yaml)

All protected routes require:
```
Authorization: Bearer <token>
Accept: application/json
```

---

## Authentication

### POST /login
Login and receive a token.

**Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "user": {
    "user_id": 1,
    "username": "string",
    "email": "string",
    "full_name": "string",
    "role_id": 1,
    "role_name": "Admin | Adviser | Clinic Staff | Student",
    "password_must_change": false
  },
  "token": "string",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

---

### POST /logout
Revoke current token. Requires auth.

---

### GET /me
Get authenticated user info. Requires auth.

---

### POST /refresh
Revoke current token and issue a new one. Requires auth.

---

### POST /force-change-password
Force password change for users with `password_must_change: true`. Requires auth.

**Body:**
```json
{
  "current_password": "string",
  "new_password": "string",
  "new_password_confirmation": "string"
}
```

### POST /request-password-change
Request a password change notification for the current account. Requires auth.

---

---

## Admin

All routes require `role:admin`.

### GET /admin/dashboard
Returns user counts and health insights (BMI stats).

### GET /admin/users
List all users.

### POST /admin/users
Create a new user.

**Body:**
```json
{
  "username": "string",
  "email": "string",
  "full_name": "string",
  "role_id": 1,
  "password": "string"
}
```

### PUT /admin/users/{id}
Update a user.

### DELETE /admin/users/{id}
Soft-delete a user.

### POST /admin/users/{id}/reset-password
Reset a user's password.

### POST /admin/users/{id}/activate
Activate a user account.

### POST /admin/users/{id}/deactivate
Deactivate a user account.

---

### GET /admin/grade-levels
Returns all grade levels with their sections and enrollment counts.

### GET /admin/advisers
Returns all active adviser users.

### GET /admin/sections
Returns all active sections. Optional query: `?school_year_id=1`

### POST /admin/sections
Create a new section.

**Body:**
```json
{
  "section_name": "string",
  "grade_level_id": 1,
  "school_year_id": 1,
  "capacity": 50
}
```

### PUT /admin/sections/{id}
Update a section.

**Body:**
```json
{
  "section_name": "string",
  "adviser_id": 1,
  "capacity": 50
}
```

### DELETE /admin/sections/{id}
Delete a section and unassign its students.

### POST /admin/sections/assign-adviser
Assign or remove an adviser from a section.

**Body:**
```json
{
  "section_id": 1,
  "adviser_user_id": 1
}
```

### GET /admin/sections/get-students
Get students in a section.

**Query:** `?section_id=1`

---

### GET /admin/health-risk-visualization
BMI statistics grouped by grade level.

### GET /admin/notifications
Admin notifications.

### GET /admin/activity-logs
System activity logs.

### GET /admin/notifications
Admin notification inbox.

### PUT /admin/notifications/{id}/read
Mark an admin notification as read.

### POST /admin/notifications/mark-all-read
Mark all admin notifications as read.

### POST /admin/notifications/{id}/approve-password-change
Approve a password change request.

### POST /admin/notifications/{id}/dismiss
Dismiss a password change request.

---

### GET /admin/reports
General reports.

### GET /admin/reports/principal-health-trends
Health trend report for principal view.

---

### GET /admin/settings
Get system settings.

### PUT /admin/settings
Update system settings.

### GET /admin/system-settings
Get all system settings.

### PUT /admin/system-settings
Update system settings.

---

### GET /admin/backup/history
List backup history.

### POST /admin/backup/create
Create a new backup.

### POST /admin/backup/restore
Restore from a backup.

### DELETE /admin/backup/{filename}
Delete a backup file.

---

## Grade Promotion

### GET /admin/promotion/summary
Returns student counts per grade and target year section capacity.

**Query:** `?current_school_year_id=1&target_school_year_id=2`

### POST /admin/promotion/copy-sections
Copy sections from one school year to another.

**Body:**
```json
{
  "source_school_year_id": 1,
  "target_school_year_id": 2
}
```

### POST /admin/promotion/bulk
Promote all active students to the next grade level.

**Body:**
```json
{
  "current_school_year_id": 1,
  "target_school_year_id": 2
}
```

**Response:**
```json
{
  "promoted_count": 120,
  "graduated_count": 30,
  "failed_count": 2,
  "total_processed": 152
}
```

---

## School Years

### GET /admin/school-years
List all school years.

### GET /admin/school-years/current
Get the current school year.

### POST /admin/school-years
Create a school year.

**Body:**
```json
{
  "year_name": "2025-2026",
  "start_date": "2025-06-01",
  "end_date": "2026-03-31"
}
```

### PUT /admin/school-years/{id}
Update a school year.

### POST /admin/school-years/set-current
Set a school year as current.

**Body:**
```json
{
  "school_year_id": 2
}
```

---

## Students

### GET /students
List all active students. Supports pagination.

**Query params:** `?search=name&grade_level=Grade 7&section=Sampaguita`

### GET /students/search
Search students by name or student number.

**Query:** `?query=juan` (min 2 chars, returns up to 10 results)

### GET /students/medical-data
Get medical data for the authenticated student user.

### GET /students/{student}
Get full student profile.

### PUT /students/{student}
Update student profile.

**Body (all optional):**
```json
{
  "first_name": "string",
  "last_name": "string",
  "middle_name": "string",
  "birth_date": "YYYY-MM-DD",
  "gender": "M | F | Other",
  "address": "string",
  "blood_type": "A+",
  "emergency_contact": "string",
  "emergency_contact_relation": "string",
  "emergency_contact_phone": "string",
  "height_cm": 160,
  "weight_kg": 55,
  "email": "string",
  "phone": "string"
}
```

### GET /students/{student}/medical-data
Get student medical data including visits, allergies, and history.

### PUT /students/{student}/medical-data
Update student medical data (partial update — only provided fields are changed).

**Body (all optional):**
```json
{
  "personal_info": {
    "address": "string",
    "emergency_contact": "string",
    "emergency_contact_relation": "string",
    "emergency_contact_phone": "string",
    "blood_type": "string",
    "phone": "string",
    "email": "string"
  },
  "physical_info": {
    "height_cm": 160,
    "weight_kg": 55,
    "blood_type": "A+"
  },
  "medical_history": {
    "condition_asthma": false,
    "condition_diabetes": false,
    "condition_heart_problem": false,
    "condition_hypertension": false,
    "condition_seizure_disorder": false,
    "condition_bleeding_disorder": false,
    "condition_kidney_disease": false,
    "condition_mental_health": false,
    "other_conditions": "string",
    "current_medications": "string",
    "family_medical_history": "string",
    "notes": "string"
  },
  "allergies": [
    {
      "allergy_name": "Peanuts",
      "severity": "mild | moderate | severe",
      "reaction_description": "string",
      "treatment_notes": "string"
    }
  ]
}
```

### GET /students/{student}/visits
Get paginated medical visits for a student with statistics.

### GET /students/{student}/visit-history
Get full visit history with monthly breakdown and statistics.

### GET /students/{studentId}/badges
Get student wellness streak and badge status.

### GET /students/{studentId}/badge-notifications
Get badge notifications for a student.

---

## Medical Visits

### GET /medical-visits
List all medical visits. Supports pagination.

**Query params:**
- `student_id` — filter by student
- `date_from` / `date_to` — date range (YYYY-MM-DD)
- `emergency_only=true` — only emergency visits
- `visit_type=Routine|Emergency`

### POST /medical-visits
Create a new medical visit.

When the visit is marked as emergency-related, the backend attempts to send an SMS to the student's emergency contact after the visit is saved. The SMS service uses `emergency_contact_phone` first, then falls back to the student's own `phone`.

**Body:**
```json
{
  "student_id": 1,
  "clinic_staff_id": 1,
  "chief_complaint": "string",
  "notes": "string",
  "visit_type": "Routine | Emergency",
  "status": "Open | Closed | Referred",
  "notify_parent": false,
  "notification_method": "sms | email | call | none",
  "visit_datetime": "2026-03-29T10:00:00",
  "vitals": {
    "temperature_c": 36.5,
    "blood_pressure": "120/80",
    "pulse_rate": 72,
    "respiration_rate": 16,
    "height_cm": 160,
    "weight_kg": 55
  }
}
```

### GET /medical-visits/{id}
Get a specific medical visit with student, staff, and vitals.

---

## Push Notifications

### GET /push/vapid-public-key
Return the VAPID public key used by the frontend to subscribe browsers for Web Push.

### POST /push/subscribe
Register a browser push token or endpoint.

### DELETE /push/unsubscribe
Remove a browser push token or endpoint.

---

## Direct FCM Messaging

All routes require `role:admin`, `role:adviser`, or `role:clinic_staff`.

### POST /fcm/send-to-user
Send a push message to a user.

### POST /fcm/send-to-token
Send a push message to a specific FCM token.

### POST /fcm/send-to-topic
Send a push message to an FCM topic.

### POST /fcm/send-to-condition
Send a push message to a topic condition.

---

## Dashboard

### GET /dashboard/clinic/overview
Clinic overview: today's visits, total students, recent visits, students with allergies.

### GET /staff/dashboard
Same as clinic overview (alias for staff role).

### GET /staff/reports
Analytics report for clinic staff.

**Query params:** `?start_date=2026-01-01&end_date=2026-03-31&grade_level=Grade 7`

**Response includes:** total visits, unique students, emergency cases, referrals, cases by illness, cases by grade.

---

## Adviser

All routes require `role:adviser`.

### GET /adviser/dashboard
Adviser dashboard with section info, student list, and stats.

### GET /adviser/profile
Get adviser profile and advisory class info.

### PUT /adviser/profile
Update adviser profile.

**Body:**
```json
{
  "full_name": "string",
  "email": "string",
  "phone": "string"
}
```

### GET /adviser/students
### GET /adviser/advisory-students
Get all students in the adviser's advisory class with medical data.

### GET /adviser/health-heatmap
Health monitoring heatmap — visit frequency and trending symptoms.

**Query:** `?days=7` (default: 7)

### GET /adviser/class-roster
Full class roster for a school year.

**Query:** `?school_year_id=1` (required)

### GET /adviser/notifications
Clinic visit notifications for the adviser's students.

---

## SHDF (Student Health Data Form)

### GET /shdf/{studentId}
Get SHDF for a student for the current school year.

### GET /shdf/{studentId}/status
Get SHDF completion status (basic / comprehensive).

### GET /shdf/{studentId}/{schoolYearId}
Get SHDF for a specific school year.

### POST /shdf/basic
Submit Stage 1 (basic info — required for QR code).

**Body:**
```json
{
  "student_id": 1,
  "parent_guardian_name": "string",
  "emergency_contact": "string",
  "emergency_contact_relation": "string",
  "emergency_contact_phone": "string",
  "height_cm": 160,
  "weight_kg": 55,
  "blood_type": "A+"
}
```

### POST /shdf/comprehensive
Submit Stage 2 (full SHDF form). Uses `SHDFFormRequest` validation.

### POST /shdf
Submit full SHDF (legacy endpoint).

---

## Student Badges

### GET /student/streak-badges/metadata
Get all available streak badge definitions.

### GET /students/{studentId}/badges
### GET /student-badges/{studentId}
Get student's current wellness streak and badge unlock status.

### GET /students/{studentId}/badge-notifications
Get badge notifications for a student.

### PUT /notifications/{notificationId}/read
Mark a badge notification as read.

### POST /students/{studentId}/badges/generate-text
Generate AI narrative text for a badge (uses Groq).

**Body:**
```json
{
  "student_name": "string",
  "badge_name": "string",
  "streak_days": 30,
  "badge_key": "string"
}
```

---

## Utility

### GET /health
Health check. Returns `{ "status": "ok" }`. No auth required.

### GET /debug/auth
Debug authentication status. Requires auth.

---

## Standard Response Format

**Success:**
```json
{
  "success": true,
  "data": {},
  "message": "string"
}
```

**Error:**
```json
{
  "success": false,
  "message": "string",
  "data": {}
}
```

**Validation Error:**
```json
{
  "success": false,
  "message": "Validation Error",
  "data": {
    "field": ["error message"]
  }
}
```
