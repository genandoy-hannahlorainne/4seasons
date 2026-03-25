# Security Improvements - Authentication & Authorization

## Problem
Ang sistema ay may security vulnerability kung saan:
- Kahit naka-logout na sa backend, pwede pa ring ma-access ang protected routes
- Ang guards ay nag-check lang ng localStorage, hindi nag-verify sa backend
- Walang validation kung valid pa ba ang token sa server-side
- Pwedeng mag-persist ang stale authentication data

## Solution Implemented

### 1. Enhanced Auth Guard (`auth.guard.ts`)
**Before:**
- Nag-check lang ng `isAuthenticated()` (localStorage only)
- Walang backend verification

**After:**
- Two-step verification:
  1. Local check (localStorage) - fast initial check
  2. Backend verification via `/api/me` endpoint - ensures token is valid
- Automatic logout at redirect kung invalid ang token
- Observable-based para sa async validation

### 2. Enhanced Role Guard (`role.guard.ts`)
**Before:**
- Nag-check lang ng local user data
- Walang backend verification

**After:**
- Backend verification ng user at role
- Strict role matching with security violation logging
- Automatic redirect based on actual user role
- Error handling with automatic logout

### 3. Enhanced Admin Guard (`admin.guard.ts`)
**Before:**
- Local check lang ng admin role
- Walang backend verification

**After:**
- Backend verification ng admin role
- Security violation logging
- Automatic redirect based on actual role
- Error handling with logout

### 4. App Initialization (`auth-init.service.ts`)
**New Feature:**
- Nag-verify ng authentication on app startup
- Nag-clear ng invalid auth data automatically
- Prevents stale session data
- Smart redirect - hindi nag-redirect kung nasa public route na

### 5. App Config (`app.config.ts`)
**Updated:**
- Added `APP_INITIALIZER` para sa auth verification on startup
- Ensures authentication is verified before app fully loads

## Security Flow

### On App Startup:
```
1. App loads
2. APP_INITIALIZER runs
3. Check localStorage for auth data
4. If found, verify with backend (/api/me)
5. If invalid, clear auth data
6. If on protected route, redirect to login
```

### On Route Navigation:
```
1. User navigates to protected route
2. Guard checks localStorage (fast)
3. If no local auth, redirect to login
4. If has local auth, verify with backend
5. Backend returns user data or 401
6. If 401, logout and redirect to login
7. If valid, check role requirements
8. Allow or deny access based on role
```

### On Logout:
```
1. Call backend /api/logout
2. Clear localStorage
3. Clear currentUserSubject
4. Redirect to login
```

## Benefits

✅ **Secure** - Hindi na pwedeng mag-bypass ng authentication
✅ **Real-time** - Nag-verify sa backend every route navigation
✅ **Automatic** - Auto-logout kung invalid ang token
✅ **Role-based** - Strict role checking with backend verification
✅ **Clean State** - Auto-clear ng stale data on startup
✅ **User-friendly** - Smart redirects based on user role

## Testing

### Test Case 1: Direct URL Access After Logout
1. Login as any user
2. Logout
3. Try to access protected route directly (e.g., `/dashboard/admin`)
4. **Expected:** Redirect to login page

### Test Case 2: Expired Token
1. Login
2. Wait for token to expire (or manually delete from backend)
3. Try to navigate to any protected route
4. **Expected:** Auto-logout and redirect to login

### Test Case 3: Role Mismatch
1. Login as Student
2. Try to access `/dashboard/admin` directly
3. **Expected:** Redirect to `/dashboard/student` with security violation log

### Test Case 4: App Refresh with Invalid Token
1. Login
2. Manually invalidate token in backend
3. Refresh the page
4. **Expected:** Auto-logout and redirect to login

## Backend Requirements

Ensure these endpoints are working:
- `GET /api/me` - Returns current user or 401
- `POST /api/logout` - Invalidates token
- `POST /api/refresh` - Refreshes token (optional)

## Notes

- Ang guards ay nag-return ng Observable para sa async validation
- Lahat ng guards ay may error handling with automatic logout
- Security violations ay naka-log sa console para sa monitoring
- Smart redirects based on user role para sa better UX
