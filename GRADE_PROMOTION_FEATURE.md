# Grade Promotion Feature for Advisers

## Overview
Advisers can promote their students to the next grade level or mark Grade 12 students as graduated at the end of the school year.

## Features

### 1. Bulk Student Promotion
- Select multiple students
- Promote to next grade level (Grade 7 → Grade 8, etc.)
- Assign to new section for next school year
- Mark Grade 12 students as "Graduated"

### 2. Individual Student Actions
- View student profile
- Promote individual student
- Mark as retained (repeat same grade)

### 3. Promotion Rules
- Grade 7-11: Promote to next grade level
- Grade 12: Mark as "Graduated" (enrollment_status = 'graduated')
- Can only promote students in current/active school year
- Promotion creates record in next school year

## Database Changes Needed

### Students Table
- `enrollment_status` enum: 'active', 'promoted', 'graduated', 'transferred', 'dropped', 'inactive'
- `promotion_date`: timestamp when promoted
- `last_promotion_date`: last time student was promoted

### Promotion History (Optional)
Track all promotions for audit trail.

## API Endpoints

### POST /api/adviser/promote-students.php
Bulk promote students to next grade level

**Request:**
```json
{
  "student_ids": [1, 2, 3],
  "action": "promote" | "graduate",
  "to_school_year_id": 2,
  "to_grade_level": 8,
  "to_section_id": 5
}
```

**Response:**
```json
{
  "success": true,
  "promoted_count": 3,
  "graduated_count": 0,
  "total_processed": 3,
  "errors": [],
  "message": "3 student(s) promoted successfully"
}
```

### GET /api/admin/sections/list.php
List sections filtered by school year and grade level

**Query Parameters:**
- `school_year_id` (optional): Filter by school year
- `grade_level` (optional): Filter by grade level number

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "section_name": "A",
      "grade_level_id": 2,
      "school_year_id": 7,
      "adviser_id": null,
      "capacity": 50,
      "current_enrollment": 0,
      "is_active": 1,
      "level_name": "Grade 8",
      "level_number": 8,
      "year_name": "2025-2026",
      "adviser_name": null
    }
  ],
  "count": 1
}
```

## UI Flow

1. Adviser selects school year (e.g., 2024-2025)
2. Views current class roster
3. Clicks "Promote Students" button
4. Modal opens showing:
   - List of students with checkboxes
   - Target school year (auto: next year)
   - Target grade level (auto: current + 1)
   - Target section (dropdown)
   - For Grade 12: "Mark as Graduated" option
5. Confirms promotion
6. System updates student records

## Implementation Steps

1. ✅ Fix CORS and authentication issues
2. ✅ Setup school years and sections
3. ✅ Add promotion UI to class management
4. ✅ Create promote-students API
5. ✅ Create sections list API
6. ✅ Add getSections method to AdviserService
7. ✅ Implement loadTargetSections in component
8. ✅ Fix RxJS deprecation warnings
9. ✅ Create test data setup script
10. ⏳ Test promotion workflow

## Testing Instructions

1. Run setup script to create sections for next school year:
   ```bash
   php setup-promotion-test-data.php
   ```

2. Login as adviser (username: 00001)

3. Navigate to "My Class Management"

4. Select school year "2024-2025"

5. Select students using checkboxes

6. Click "Promote Selected" button

7. For Grade 7-11 students:
   - Select target school year (2025-2026)
   - Target grade level is auto-calculated
   - Select target section from dropdown
   - Click "Promote Students"

8. For Grade 12 students:
   - Click "Graduate Students"
   - No section selection needed

9. Verify promotion success message

10. Reload class roster to see updated student list

## Notes
- Only advisers can promote their own students
- Admin can promote any student
- Promotion is irreversible (but can be manually adjusted by admin)
- Graduated students remain in system for records
