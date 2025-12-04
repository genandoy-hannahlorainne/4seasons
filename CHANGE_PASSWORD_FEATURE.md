# Change Password Feature

## Overview
Implemented a change password modal in the student profile page with full backend integration.

## Features

### Frontend
- **Modal Popup** - Clean, animated modal with overlay
- **Form Validation**:
  - Current password required
  - New password minimum 6 characters
  - Confirm password must match new password
- **Real-time Feedback**:
  - Success messages (green)
  - Error messages (red)
  - Loading states
- **Styling** - Matches existing design system (Poppins font, blue theme)

### Backend API
- **Endpoint**: `POST /api/change-password.php`
- **Validation**:
  - Verifies current password is correct
  - Checks user exists and is active
  - Hashes new password with bcrypt
- **Security**:
  - Password verification using `password_verify()`
  - Password hashing using `password_hash()`
  - Activity logging for password changes
- **CORS**: Configured for localhost:4200

## Usage

1. **Open Profile Page**: Navigate to `/dashboard/student/profile`
2. **Click "Change Password"** in the Others section
3. **Fill Form**:
   - Enter current password
   - Enter new password (min 6 chars)
   - Confirm new password
4. **Submit**: Click "Change Password" button
5. **Success**: Modal closes automatically after 2 seconds

## API Request Format

```json
{
  "user_id": 1,
  "current_password": "oldpassword123",
  "new_password": "newpassword123"
}
```

## API Response Format

### Success
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Error (Wrong Current Password)
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

## Files Modified/Created

### Created
- `backend/api/change-password.php` - Backend API endpoint

### Modified
- `frontend/src/app/features/dashboard/student/profile/profile.ts` - Added modal logic
- `frontend/src/app/features/dashboard/student/profile/profile.html` - Added modal HTML
- `frontend/src/app/features/dashboard/student/profile/profile.scss` - Added modal styles
- `frontend/src/app/core/services/auth.service.ts` - Added changePassword method

## Testing

1. **Valid Password Change**:
   - Current: correct password
   - New: valid password (6+ chars)
   - Confirm: matches new password
   - Expected: Success message, modal closes

2. **Wrong Current Password**:
   - Current: incorrect password
   - Expected: Error "Current password is incorrect"

3. **Password Mismatch**:
   - New: "password123"
   - Confirm: "password456"
   - Expected: Error "Passwords do not match"

4. **Short Password**:
   - New: "12345" (less than 6 chars)
   - Expected: Error "Password must be at least 6 characters"

## Security Notes

- Passwords are hashed using bcrypt (PASSWORD_BCRYPT)
- Current password is verified before allowing change
- Activity is logged for audit trail
- CORS is properly configured
- User must be authenticated to change password
