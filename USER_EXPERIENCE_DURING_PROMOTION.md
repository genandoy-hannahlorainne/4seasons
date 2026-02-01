# User Experience During Grade Promotion

## Overview
This document explains what happens to each user type during the grade promotion process and how they experience the system changes.

---

## 👨‍💼 **ADMIN USER EXPERIENCE**

### Before Promotion (Setup Phase)
**What Admin Sees:**
- Access to "Grade Promotion" menu in admin dashboard
- Can create new school years (2025-2026)
- Can create sections for each grade (7A, 7B, 8A, etc.)
- Can assign advisers to sections
- Can view current student distribution

**What Admin Can Do:**
```
Admin Dashboard → Grade Promotion
├── Create School Year (2025-2026)
├── Create Sections (Grade 7-A, 7-B, 7-C, etc.)
├── Assign Advisers to Sections
└── Preview Promotion Summary
```

### During Promotion (Execution Phase)
**What Admin Sees:**
- Promotion dashboard with student counts per grade
- Summary showing: "Grade 7 → Grade 8: 245 students"
- Target year capacity and availability
- Students needing manual adjustment

**What Admin Can Do:**
1. **Execute Bulk Promotion**
   - Click "Execute Promotion" button
   - System automatically moves students:
     - Grade 7 → Grade 8
     - Grade 8 → Grade 9
     - Grade 11 → Grade 12
     - Grade 12 → Graduated
   
2. **Handle Special Cases**
   - Manually adjust failed students (repeat grade)
   - Mark transferred students
   - Mark dropped out students

### After Promotion
**What Admin Sees:**
- Promotion completion summary
- Audit trail of all changes
- Updated student counts in new school year

---

## 👩‍🏫 **ADVISER USER EXPERIENCE**

### Before Promotion
**What Adviser Sees:**
- "My Class" menu shows current class roster
- Can view all students in their section
- Access to student medical records
- Class health statistics

**Current Class (2024-2025):**
```
Grade 7, Section A - Mrs. Santos
├── 48 Students
├── Medical Records Access
└── Health Summary
```

### During Promotion (Automatic)
**What Happens to Adviser:**
- System automatically updates their assignments
- Previous class becomes "archived"
- New class roster appears (if assigned to new section)

**Behind the Scenes:**
```sql
-- Old assignment becomes inactive
UPDATE adviser_assignments SET is_active = FALSE 
WHERE adviser_id = 12 AND school_year_id = 1;

-- New assignment created
INSERT INTO adviser_assignments (adviser_id, section_id, school_year_id)
VALUES (12, 25, 2); -- New section for 2025-2026
```

### After Promotion
**What Adviser Sees:**
- **Current Class (2025-2026):** New students (promoted from Grade 6 or transferred)
- **Previous Class (2024-2025):** Archived, read-only access
- **Medical Records:** Still accessible for all students they've ever advised

**New Interface:**
```
My Class Management
├── Current Class (2025-2026)
│   ├── Grade 8, Section A
│   ├── 45 New Students (promoted from Grade 7)
│   └── Full Access (edit, view, medical records)
└── Previous Classes (Archived)
    └── Grade 7, Section A (2024-2025) - Read Only
```

---

## 👨‍⚕️ **CLINIC STAFF USER EXPERIENCE**

### Before, During, and After Promotion
**What Clinic Staff Sees:**
- **NO CHANGE** in their interface
- Can still access all student medical records
- Student information updates automatically
- Medical records remain continuous

**Why No Impact:**
- Clinic staff access students by medical needs, not by grade/section
- Medical records are linked to student ID, not grade level
- All historical medical data remains accessible

**Example:**
```
Student: Juan Dela Cruz
├── 2024-2025: Grade 7, Section A, Mrs. Santos
│   ├── Visit: Sept 15 - Fever
│   └── Visit: Nov 20 - Cough
└── 2025-2026: Grade 8, Section B, Mrs. Reyes
    ├── Visit: June 10 - Checkup
    └── Visit: July 5 - Vaccination
```

---

## 👨‍🎓 **STUDENT USER EXPERIENCE**

### Before Promotion
**What Student Sees:**
- Their current grade and section information
- Access to their medical records
- QR code for clinic visits

### During Promotion (Automatic)
**What Happens to Student:**
- Grade level automatically updates (Grade 7 → Grade 8)
- Section assignment may change (Section A → Section B)
- New adviser assigned
- **Medical records remain intact**

### After Promotion
**What Student Sees:**
- Updated profile information:
  - **Old:** Grade 7, Section A, Mrs. Santos
  - **New:** Grade 8, Section B, Mrs. Reyes
- Same QR code (still works)
- All medical history preserved
- Can still access all previous medical records

**Database Changes:**
```sql
-- Student record updated
UPDATE students SET 
    current_grade_level_id = 8,      -- Grade 7 → Grade 8
    current_section_id = 25,         -- New section
    current_adviser_id = 15,         -- New adviser
    current_school_year_id = 2       -- New school year
WHERE student_id = 123;
```

---

## 👨‍👩‍👧‍👦 **PARENT/GUARDIAN USER EXPERIENCE**

### Before Promotion
**What Parent Sees:**
- Child's current grade and section
- Access to child's medical records
- Adviser contact information

### During Promotion (Automatic)
**What Happens:**
- Child's information automatically updates
- New adviser contact information available
- Medical records remain accessible

### After Promotion
**What Parent Sees:**
- Updated child information
- New adviser details
- Continuous access to medical history
- SMS notifications (if implemented) about the promotion

---

## 🎓 **GRADUATED STUDENTS (Grade 12)**

### What Happens to Grade 12 Students
**During Promotion:**
```sql
UPDATE students SET 
    enrollment_status = 'graduated',
    current_grade_level_id = NULL,
    current_section_id = NULL,
    current_adviser_id = NULL
WHERE current_grade_level_id = 12;
```

**After Graduation:**
- **Status:** Changed to "Graduated"
- **Access:** Can still login and view medical records
- **Adviser:** No longer assigned to any adviser
- **Medical Records:** Permanently accessible
- **QR Code:** Still works for clinic visits (alumni access)

---

## 🔄 **SPECIAL CASES**

### Failed Students (Repeat Grade)
**What Happens:**
- Grade level stays the same (Grade 7 → Grade 7)
- May be moved to different section
- New adviser assigned
- Medical records preserved
- Marked in promotion history as "repeat_grade"

### Transferred Students
**What Happens:**
- Status changed to "transferred"
- Removed from active class rosters
- Medical records archived but accessible
- No longer appears in adviser's current class

### Dropped Out Students
**What Happens:**
- Status changed to "dropped"
- Removed from active class rosters
- Medical records archived but accessible
- System maintains record for potential re-enrollment

---

## 📊 **SYSTEM-WIDE CHANGES**

### Database Updates During Promotion
```sql
-- Example: 1,000 students promoted
UPDATE students SET 
    current_grade_level_id = current_grade_level_id + 1,
    current_section_id = new_section_id,
    current_adviser_id = new_adviser_id,
    current_school_year_id = 2,
    promotion_date = NOW()
WHERE enrollment_status = 'active' 
AND current_grade_level_id < 12;

-- Grade 12 students graduated
UPDATE students SET 
    enrollment_status = 'graduated',
    current_grade_level_id = NULL,
    current_section_id = NULL,
    current_adviser_id = NULL
WHERE current_grade_level_id = 12;
```

### Audit Trail Created
```sql
-- Every promotion logged
INSERT INTO student_promotions (
    student_id, previous_grade_level_id, new_grade_level_id,
    previous_section_id, new_section_id,
    previous_adviser_id, new_adviser_id,
    school_year_id, promoted_by_admin_id, promotion_type
) VALUES (...);
```

---

## 🔐 **ACCESS CONTROL CHANGES**

### Medical Records Access After Promotion

**Before Promotion:**
- Student can access their records
- Current adviser (Mrs. Santos) can access
- Clinic staff can access
- Admin can access

**After Promotion:**
- Student can access their records ✅ (unchanged)
- **Old adviser (Mrs. Santos) loses access** ❌
- **New adviser (Mrs. Reyes) gains access** ✅
- Clinic staff can access ✅ (unchanged)
- Admin can access ✅ (unchanged)

### Implementation:
```php
// Access control check
function canAccessStudentMedicalRecords($userId, $studentId) {
    $student = getStudent($studentId);
    $user = getUser($userId);
    
    // Current adviser has access
    if ($student['current_adviser_id'] == $userId) {
        return true;
    }
    
    // Clinic staff and admin always have access
    if (in_array($user['role'], ['Admin', 'Clinic Staff'])) {
        return true;
    }
    
    // Student can access their own records
    if ($student['student_id'] == $userId) {
        return true;
    }
    
    return false;
}
```

---

## 📱 **USER INTERFACE CHANGES**

### What Users See in Their Dashboards

#### Admin Dashboard
```
Before Promotion:
├── Total Students: 1,200
├── Grade 7: 200 students
├── Grade 8: 195 students
└── Grade 12: 180 students

After Promotion:
├── Total Active Students: 1,020 (180 graduated)
├── Grade 7: 200 new students (from Grade 6 or new enrollees)
├── Grade 8: 200 students (promoted from Grade 7)
└── Grade 12: 195 students (promoted from Grade 11)
```

#### Adviser Dashboard
```
Before: "Grade 7, Section A - 48 students"
After:  "Grade 8, Section A - 45 students (3 transferred/dropped)"
```

#### Student Profile
```
Before: 
- Grade: 7
- Section: A  
- Adviser: Mrs. Santos

After:
- Grade: 8
- Section: B
- Adviser: Mrs. Reyes
```

---

## ⏰ **TIMELINE OF CHANGES**

### Promotion Execution Timeline
```
T-0: Admin clicks "Execute Promotion"
├── T+1 sec: Database transaction begins
├── T+5 sec: All student records updated
├── T+10 sec: Adviser assignments updated
├── T+15 sec: Audit trail created
├── T+20 sec: Transaction committed
└── T+30 sec: Users see updated information
```

### User Experience Timeline
```
Immediate (T+30 sec):
├── Students see new grade/section
├── Advisers see new class rosters
├── Parents see updated child info
└── Admin sees completion summary

Next Login:
├── All dashboards reflect new data
├── Medical records access updated
└── QR codes continue working
```

---

## 🎯 **KEY BENEFITS FOR EACH USER**

### Admin
- ✅ Automated promotion process (saves hours of manual work)
- ✅ Complete audit trail for compliance
- ✅ Handles 1,000+ students in minutes
- ✅ Special cases handled systematically

### Adviser
- ✅ Automatic class roster updates
- ✅ Immediate access to new students' medical records
- ✅ Historical access to previous classes
- ✅ No manual data entry required

### Clinic Staff
- ✅ Zero disruption to medical services
- ✅ Continuous access to all medical records
- ✅ Student information automatically updated
- ✅ QR codes continue working seamlessly

### Students
- ✅ Seamless transition to new grade
- ✅ All medical history preserved
- ✅ QR code continues working
- ✅ No action required from student

### Parents
- ✅ Automatic updates to child's information
- ✅ New adviser contact details
- ✅ Continuous medical record access
- ✅ No paperwork or manual updates needed

---

## 🚨 **IMPORTANT NOTES**

### What DOESN'T Change
- **Medical Records:** All historical data preserved
- **QR Codes:** Continue working for all students
- **Login Credentials:** No change required
- **System Access:** Same permissions maintained

### What DOES Change
- **Grade/Section Information:** Updated automatically
- **Adviser Assignments:** New adviser relationships
- **Class Rosters:** Advisers get new student lists
- **Dashboard Statistics:** Reflect new grade distribution

### Rollback Capability
- Complete audit trail allows for rollback if needed
- All changes are logged with timestamps
- Previous assignments stored in history tables
- Medical records never affected by rollbacks

---

**The promotion system ensures a smooth, automated transition for all users while maintaining data integrity and access control.**