# Fresh Start Setup Guide

## Current Status
✅ Database structure is correct (`is_current` column exists)
✅ All APIs are properly configured
❌ No school years exist in the database
❌ No current school year is set

## Step-by-Step Setup Instructions

### Step 1: Create School Years
1. Log in to the admin panel
2. Navigate to **School Years** section (in the left sidebar)
3. Click **"Create New School Year"** button
4. Fill in the details:
   - **Year Name**: e.g., "2024-2025"
   - **Start Date**: e.g., "2024-06-01"
   - **End Date**: e.g., "2025-05-31"
   - **Is Active**: Check this box
5. Click **Save**
6. Repeat for additional school years if needed (e.g., "2025-2026")

### Step 2: Set Current School Year
1. In the School Years list, find the school year you want to use
2. Click the **"Set as Current"** button next to that school year
3. You should see a green badge saying **"CURRENT"** appear next to it
4. This is the school year that will be automatically assigned to all new accounts

### Step 3: Create Sections for the Current School Year
1. Still in the School Years section, you'll see sections listed below
2. Click **"Create Section"** for each grade level you need:
   - Grade 7 - Section A
   - Grade 7 - Section B
   - Grade 8 - Section A
   - etc.

### Step 4: Assign Advisers to Sections
1. Create adviser accounts first (if not already created):
   - Go to **Manage Users** → **Create User**
   - Select role: **Adviser**
   - Fill in their details
   - The adviser will automatically be assigned to the current school year
2. Go back to **School Years** section
3. For each section, click **"Assign Adviser"**
4. Select the adviser from the dropdown
5. Click **Save**

### Step 5: Create Student Accounts
1. Go to **Manage Users** → **Create User**
2. Select role: **Student**
3. Fill in student details including:
   - Grade Level
   - Section
4. The student will automatically be assigned to:
   - The current school year
   - The adviser of their section (if one is assigned)

## Important Notes

### Automatic Assignments
When you create a new account (student or adviser), the system will automatically:
- Assign them to the **current school year** (the one marked with is_current = 1)
- For students: Assign them to the adviser of their section (if one exists)

### Current School Year Rules
- Only **one** school year can be marked as "current" at a time
- When you set a new school year as current, the previous one is automatically unmarked
- Only **Admin** can change which school year is current
- Advisers can only promote students to the next school year (automatic)

### Promotion Workflow
1. Admin sets the current school year (e.g., "2024-2025")
2. Admin creates sections for that school year
3. Admin assigns advisers to sections
4. Admin creates student accounts (auto-assigned to current year)
5. At end of year, Admin creates next school year (e.g., "2025-2026")
6. Admin creates sections for the new school year
7. Admin assigns advisers to the new sections
8. Advisers promote their students (students move to next grade + next school year)
9. Admin sets the new school year as current
10. New students created will now be assigned to "2025-2026"

## Verification Commands

Run these PHP scripts to verify your setup:

```bash
# Check if school years exist
php check-school-years.php

# Check sections for a specific school year
php check-school-year-7-sections.php

# Verify system status
php verify-system-status.php
```

## Troubleshooting

### Error: "Column not found: is_current"
- **Solution**: The column exists now. Restart your PHP server and try again.

### No school years showing in admin panel
- **Solution**: Create a school year using Step 1 above

### Students not getting assigned to adviser
- **Solution**: Make sure you've assigned an adviser to the student's section first

### Can't set current school year
- **Solution**: Make sure at least one school year exists in the database

## Database Schema Reference

### school_years table
- `id`: Primary key
- `year_name`: e.g., "2024-2025"
- `start_date`: Start date of school year
- `end_date`: End date of school year
- `is_active`: Whether the year is active (legacy, not used for current year logic)
- `is_current`: **NEW** - Only one school year should have this set to 1
- `created_at`, `updated_at`, `created_by`: Audit fields

### students table
- `current_school_year_id`: References school_years.id
- `current_section_id`: References sections.id
- `current_adviser_id`: References users.id (where role = 'Adviser')

## API Endpoints

### Create School Year
```
POST /api/admin/school-years/create.php
Body: { year_name, start_date, end_date, is_active }
```

### Set Current School Year
```
POST /api/admin/school-years/set-current.php
Body: { school_year_id }
```

### Get Current School Year
```
GET /api/admin/school-years/get-current.php
Returns: { current_school_year, next_school_year }
```

### List School Years
```
GET /api/admin/school-years/list.php
Returns: Array of all school years with is_current flag
```

## Next Steps

1. ✅ Create your first school year
2. ✅ Set it as current
3. ✅ Create sections
4. ✅ Assign advisers
5. ✅ Create student accounts
6. ✅ Verify everything works

Your system is now ready for a fresh start! 🎉
