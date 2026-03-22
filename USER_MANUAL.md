# User Manual — Medical Record System
### PDMHS Medical Record System

---

## Table of Contents

1. [Getting Started — Login](#1-getting-started--login)
2. [Admin Account](#2-admin-account)
   - Dashboard
   - Manage Users
   - Manage Sections
   - School Year Management
   - Grade Promotion
   - Emergency Drills
   - Reports
   - System Settings
   - Backup & Recovery
3. [Clinic Staff Account](#3-clinic-staff-account)
   - Dashboard
   - Student Records
   - Medical Visits
   - Reports
4. [Adviser Account](#4-adviser-account)
   - Dashboard
   - Class Management
   - Health Monitoring
   - Alerts
5. [Student Account](#5-student-account)
   - Dashboard
   - Medical Records
   - Profile

---

## 1. Getting Started — Login

1. Open the system URL in your browser
2. Enter your **Username** and **Password**
3. Click **Login**

> First-time login: You will be asked to change your temporary password before proceeding.

**Roles in the system:**

| Role | Access Level |
|------|-------------|
| Admin | Full system access |
| Clinic Staff | Medical visits, student records |
| Adviser | Class students, health monitoring |
| Student | Own medical records and profile |

---

## 2. Admin Account

### Dashboard

Upon login, the admin sees an overview of the system:

- Total users (students, faculty, clinic staff, admins)
- Recent user registrations (last 30 days)
- School health insights (average BMI, overweight/obese count)
- Health risk visualization by grade level

---

### Manage Users

**Location:** Sidebar → Manage Users

#### View Users
- All users are listed in a table with name, username, email, role, and status
- Use the **Filter by Role** dropdown to show only Students, Faculty, Clinic Staff, or Admins
- Use the **Search** box to find users by name, username, or email

#### Create New User

Click **Create New User** button (top right).

**Creating a Student Account:**
1. Select Role: **Student**
2. Fill in:
   - Student Number (required)
   - First Name, Last Name (required)
   - Middle Name (optional)
   - Gender (required)
   - Birth Date (required)
   - Grade Level — select from dropdown (required)
   - Section — automatically loads sections for the selected grade level (required)
   - Email (optional — if provided, temp password will be sent via email)
   - Phone (optional)
3. Click **Create User**
4. The student is automatically assigned to the adviser of the selected section

> Note: A temporary password is generated. If email is provided, it will be sent to the student's email via Mailtrap (testing) or Resend (production).

**Creating a Faculty/Adviser Account:**
1. Select Role: **Adviser**
2. Fill in:
   - Employee Number (required — used as username)
   - First Name, Last Name (required)
   - Email (optional)
   - Phone (optional)
3. Click **Create User**

**Creating a Clinic Staff Account:**
1. Select Role: **Clinic Staff**
2. Fill in:
   - Full Name (required)
   - Staff Code (required — used as username)
   - Position (required, e.g. School Nurse)
   - Email (optional)
3. Click **Create User**

#### Edit / View User
- Click any user row to open the user details modal
- Edit name, email, or phone
- Click **Save Changes**

#### Reset Password
- Open user details → Click **Reset Password**
- Enter new password (minimum 6 characters)
- Click **Reset**

#### Activate / Deactivate User
- Open user details → Click **Deactivate** or **Activate**
- Deactivated users cannot log in

#### Delete User
- Open user details → Click **Delete**
- Confirm the action — this cannot be undone

#### Bulk Import Students (CSV)

> Note: Bulk import is available for **Students only**. Adviser and Clinic Staff accounts must be created individually.

1. Click **Bulk Import Students** button
2. Download the CSV template
3. Fill in student data following the template format
4. Drag and drop or select the CSV file
5. Click **Upload**

**CSV Columns:**

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| student_number | Yes | Unique student ID number | 2024001 |
| first_name | Yes | Student's first name | Juan |
| middle_name | No | Student's middle name (leave blank if none) | |
| last_name | Yes | Student's last name | Dela Cruz |
| birth_date | No | Format: YYYY-MM-DD | 2010-01-15 |
| gender | No | M or F | M |
| grade_level | No | Must match exactly (e.g. Grade 7) | Grade 7 |
| section_name | No | Must match existing section name | Genesis |
| email | No | Student's email address | juan@email.com |
| phone | No | Student's phone number | 09171234567 |
| emergency_contact_name | No | Parent/guardian name | Maria Dela Cruz |
| emergency_contact_phone | No | Parent/guardian phone | 09181234567 |

**Sample CSV row:**
```
2024001,Juan,,Dela Cruz,2010-01-15,M,Grade 7,Genesis,juan@email.com,09171234567,Maria Dela Cruz,09181234567
```

> Important: `grade_level` must match exactly (e.g. `Grade 7`, not `7`). `section_name` must match an existing section in the database.

---

### Manage Sections

**Location:** Sidebar → Manage Sections

- View all sections grouped by grade level
- Each section shows: section name, adviser assigned, capacity, current enrollment

#### Create Section
1. Click **Add Section**
2. Enter section name, select grade level, set capacity
3. Click **Save**

#### Edit Section
- Click the edit icon on any section
- Update section name, capacity, or assigned adviser
- Click **Save**

#### Assign Adviser to Section
- Click the edit icon on a section
- Select an adviser from the dropdown
- Click **Save**
- All students in that section will automatically be reassigned to the new adviser

#### Delete Section
- Click the delete icon
- Confirm — students in the section will be unassigned

---

### School Year Management

**Location:** Sidebar → School Year Management

- View all school years
- Create a new school year (e.g. 2026-2027)
- Set a school year as **Current** — this affects which sections and students are active

> Only one school year can be current at a time.

---

### Grade Promotion

**Location:** Sidebar → Grade Promotion

Used at the end of the school year to promote students to the next grade level.

1. View promotion summary — shows how many students are in each grade
2. Select students or promote all
3. Click **Bulk Promote**
4. Optionally copy sections from the current year to the new school year

---

### Emergency Drills

**Location:** Sidebar → Emergency Drills

#### Create a Drill
1. Click **New Drill**
2. Enter drill name, date, and description
3. Click **Create**

#### Manage Drill
- Click on a drill to view details
- View **Dashboard** — real-time participant count and scan status
- Use **QR Scanner** — opens camera to scan student QR codes during the drill

#### How QR Scanning Works
- Each student has a unique QR code
- During a drill, clinic staff or admin opens the scanner
- Point the camera at the student's QR code
- The system records the student as present in the drill

---

### Reports

**Location:** Sidebar → Reports

- View health trend reports
- Principal health trend report — BMI statistics, visit frequency by grade level
- Filter by school year or grade level

---

### System Settings

**Location:** Sidebar → Settings

- Update system name, school information
- Configure notification settings
- Manage system-wide preferences

---

### Backup & Recovery

**Location:** Sidebar → Backup & Recovery

- View backup history
- Create a new backup manually
- Restore from a previous backup
- Delete old backups

> Recommended: Create a backup before major operations like grade promotion or bulk imports.

---

## 3. Clinic Staff Account

### Dashboard

Overview of clinic activity:
- Today's visits count
- Recent medical visits list
- Student health alerts
- Quick access to new visit form

---

### Student Records

**Location:** Sidebar → Student Records

- View all enrolled students (all grades and sections)
- Search by name or student number
- Filter by grade level or section
- Click **View Profile** to open a student's full medical profile

**Student Medical Profile includes:**
- Personal information (name, grade, section, adviser)
- Physical info (height, weight, BMI)
- Medical history
- Allergies
- Visit history

---

### Medical Visits

**Location:** Sidebar → Medical Visits

#### View Visits
- List of all recorded medical visits
- Filter by date or student

#### Record New Visit
1. Click **New Visit**
2. Search for the student by name or scan their QR code
3. Fill in:
   - Chief complaint
   - Diagnosis
   - Treatment given
   - Vital signs (temperature, blood pressure, heart rate, weight, height)
   - Medicines dispensed
4. Click **Save Visit**

#### Edit Visit
- Click on any visit to view or edit details

---

### Reports

**Location:** Sidebar → Reports

- View clinic visit statistics
- Export reports for submission

---

## 4. Adviser Account

### Dashboard

Overview of the adviser's class:
- Total students in advisory class
- Students with recent health alerts
- BMI summary of the class
- Recent visit notifications

---

### Class Management

**Location:** Sidebar → Class Management

- View all students in the advisory section
- See each student's basic health info (BMI, allergies, last visit)
- Click a student to view their medical profile

---

### Health Monitoring

**Location:** Sidebar → Health Monitoring

- View health status of all students in the class
- BMI distribution chart
- Students flagged as underweight, overweight, or obese

---

### Alerts

**Location:** Sidebar → Alerts

- Notifications about students who visited the clinic
- Health alerts for students needing attention

---

## 5. Student Account

### Dashboard

- Welcome screen with streak badge progress
- Summary of recent clinic visits
- Health status overview

---

### Medical Records

**Location:** Sidebar → Medical Records

- View personal medical visit history
- See diagnoses, treatments, and vital signs per visit
- View medical history and allergies on file

---

### Profile

**Location:** Sidebar → Profile

- View personal information
- Update contact details
- Change password

---

## General Notes

**Changing Password**
- All users must change their temporary password on first login
- To change password anytime: go to Profile → Change Password

**Session Timeout**
- Sessions expire after 120 minutes of inactivity
- You will be redirected to the login page — log in again to continue

**Email Notifications**
- Account creation emails with temporary passwords are sent automatically when an email address is provided
- Emails are sent via Mailtrap (testing environment) or Resend (production)
