# Student Data Consistency Fix

## Problem
The system is inconsistent in using `user_id` vs `student_id` for fetching student data. This causes:
- ❌ Data not displaying after edit/save
- ❌ Console shows correct user_id but UI shows empty data
- ❌ APIs sometimes expect student_id, sometimes user_id

## Root Cause
**Mixed usage of identifiers throughout the codebase:**
- Some APIs use `user_id` as parameter
- Some APIs use `student_id` as parameter
- Frontend sometimes passes `student_id` when it should pass `user_id`

## Solution: Standardize on `user_id`

### Why `user_id`?
1. ✅ Available in session/localStorage (from login)
2. ✅ Consistent across all user types (student, adviser, staff)
3. ✅ No need to fetch student_id first
4. ✅ More secure (user controls their own data)

---

## Files to Fix

### 1. Frontend - Student Dashboard Component
**File:** `frontend/src/app/features/dashboard/student/student-dashboard.component.ts`

**Current Problem:**
```typescript
// Line 88 - Passes student_id from profile
this.loadMedicalData(profile.student_id);  // ❌ WRONG
```

**Fix:**
```typescript
// Always use user_id from session
this.loadMedicalData(currentUser.user_id);  // ✅ CORRECT
```

**Status:** ✅ ALREADY FIXED

---

### 2. Frontend - Personal Info Component
**File:** `frontend/src/app/features/medical-records/personal-info/personal-info.component.ts`

**Check if it uses user_id consistently:**
```typescript
// Should always use user_id from currentUser
const userId = this.authService.currentUserValue?.user_id;
```

---

### 3. Backend - All Student APIs

**Standard Pattern for ALL student APIs:**

```php
// ALWAYS accept user_id as parameter
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

// If no user_id, check header (from auth interceptor)
if (!$user_id && isset($_SERVER['HTTP_USER_ID'])) {
    $user_id = intval($_SERVER['HTTP_USER_ID']);
}

// Get student_id from user_id
$query = "SELECT student_id FROM students WHERE user_id = :user_id AND is_active = 1";
$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $user_id);
$stmt->execute();

if ($stmt->rowCount() === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Student not found']);
    exit;
}

$student = $stmt->fetch(PDO::FETCH_ASSOC);
$student_id = $student['student_id'];

// Now use $student_id for all queries
```

---

## APIs to Standardize

### ✅ Already Using user_id Correctly:
1. `get-student-profile.php` - ✅ Uses user_id
2. `get-student-medical-data.php` - ✅ Uses user_id
3. `update-student-profile.php` - ✅ Uses user_id

### ⚠️ Need to Check:
1. `update-medical-info.php` - Check if uses user_id
2. `update-student-physical-info.php` - Check if uses user_id
3. `manage-student-allergies.php` - Check if uses user_id

---

## Frontend Service Methods

### ✅ Already Correct:
```typescript
// student.service.ts
getStudentProfile(userId: number): Observable<any> {
  return this.http.get(`${apiUrl}/get-student-profile.php?user_id=${userId}`);
}

getStudentMedicalData(userId: number): Observable<any> {
  return this.http.get(`${apiUrl}/get-student-medical-data.php?user_id=${userId}`);
}

updateStudentProfile(userId: number, data: any): Observable<any> {
  return this.http.put(`${apiUrl}/update-student-profile.php`, {
    user_id: userId,
    ...data
  });
}
```

### ❌ Wrong Pattern (if found):
```typescript
// DON'T DO THIS
getStudentData(studentId: number): Observable<any> {
  return this.http.get(`${apiUrl}/get-data.php?student_id=${studentId}`);
}
```

---

## Component Pattern

### ✅ Correct Pattern:
```typescript
export class StudentComponent implements OnInit {
  currentUser: any;
  
  ngOnInit(): void {
    // Get user_id from auth service
    this.currentUser = this.authService.currentUserValue;
    
    if (!this.currentUser?.user_id) {
      this.error = 'Not logged in';
      return;
    }
    
    // ALWAYS use user_id
    this.loadData(this.currentUser.user_id);
  }
  
  loadData(userId: number): void {
    this.studentService.getStudentProfile(userId).subscribe({
      next: (response) => {
        // Use response data
        // DON'T extract student_id and use it for other calls
      }
    });
  }
}
```

### ❌ Wrong Pattern:
```typescript
// DON'T DO THIS
loadData(): void {
  this.studentService.getStudentProfile(userId).subscribe({
    next: (response) => {
      const studentId = response.profile.student_id;
      // ❌ WRONG - Don't use student_id for subsequent calls
      this.loadMedicalData(studentId);
    }
  });
}
```

---

## Testing Checklist

After implementing fixes, test these scenarios:

### 1. Fresh Login
- [ ] Login as student
- [ ] Dashboard loads with complete data
- [ ] Console shows user_id being used
- [ ] No 404 errors

### 2. Edit Profile
- [ ] Click edit on profile
- [ ] Change some fields
- [ ] Click save
- [ ] Data refreshes correctly
- [ ] No data loss
- [ ] Console still shows user_id

### 3. Navigate Between Pages
- [ ] Go to Dashboard
- [ ] Go to Medical Records
- [ ] Go to Profile
- [ ] All pages show correct data
- [ ] No 404 errors

### 4. Refresh Page
- [ ] On any student page
- [ ] Press F5 to refresh
- [ ] Data loads correctly
- [ ] No errors

---

## Implementation Steps

### Step 1: Verify Frontend Components ✅
```bash
# Check all student components use user_id
grep -r "student_id" frontend/src/app/features/dashboard/student/
grep -r "student_id" frontend/src/app/features/medical-records/
```

### Step 2: Verify Backend APIs
```bash
# Check all APIs accept user_id
grep -r "student_id.*GET\|POST" backend/api/
```

### Step 3: Update Any Inconsistent Code
- Replace `student_id` parameter with `user_id`
- Update API calls to use `user_id`
- Ensure all components get `user_id` from `authService.currentUserValue`

### Step 4: Test Thoroughly
- Register new student
- Login
- Edit profile
- Save
- Refresh
- Navigate between pages
- Verify data consistency

---

## Quick Fix Commands

### Fix Dashboard Component:
```typescript
// In student-dashboard.component.ts line ~88
// Change from:
this.loadMedicalData(profile.student_id);

// To:
this.loadMedicalData(currentUser.user_id);
```

### Fix Personal Info Component:
```typescript
// In personal-info.component.ts
// Ensure it uses:
const userId = this.authService.currentUserValue?.user_id;
this.studentService.getStudentProfile(userId);
```

---

## Summary

**The Golden Rule:**
> **ALWAYS use `user_id` from the logged-in session. NEVER pass `student_id` between components or to APIs.**

**Why This Works:**
1. `user_id` is always available in session
2. Backend can lookup `student_id` internally
3. More secure (users can only access their own data)
4. Consistent across all operations
5. No data loss after edit/save

**Implementation Status:**
- ✅ Dashboard component - FIXED
- ⚠️ Other components - NEED TO VERIFY
- ⚠️ Backend APIs - NEED TO VERIFY

---

## Next Steps

1. ✅ Dashboard fix is already applied
2. 🔍 Check personal-info component
3. 🔍 Check all backend APIs
4. ✅ Test with fresh registration
5. ✅ Test edit/save workflow
6. ✅ Verify no data loss

