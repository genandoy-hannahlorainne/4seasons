# Database

This folder contains SQL scripts for the PDMHS Student Medical System database.

## Files

- **4seasons.sql** - Main database schema with all tables and relationships

## Database Structure

### Core Tables
- `users` - User accounts and authentication
- `roles` - User role definitions
- `students` - Student information
- `advisers` - Adviser/teacher information
- `clinic_staff` - Clinic staff information
- `parents` - Parent/guardian information

### Medical Records
- `medical_visits` - Medical visit records
- `vitals` - Vital signs measurements
- `diagnoses` - Diagnosis records
- `treatments` - Treatment records
- `medications` - Medication prescriptions
- `allergies` - Student allergy records
- `immunizations` - Immunization records

### System Tables
- `qr_codes` - QR code tokens for students
- `notifications` - SMS/Email notification logs
- `activity_logs` - System activity audit trail
- `student_adviser` - Student-adviser relationships
- `student_parent` - Student-parent relationships

## Setup Instructions

1. Create a new MySQL/MariaDB database:
   ```sql
   CREATE DATABASE 4seasons;
   ```

2. Import the schema:
   ```bash
   mysql -u root -p 4seasons < database/4seasons.sql
   ```

   Or using phpMyAdmin:
   - Select the database
   - Go to Import tab
   - Choose `4seasons.sql`
   - Click Go

## Notes

- Database uses `utf8mb4` character set
- All timestamps use server timezone
- Soft deletes implemented via `deleted_at` columns
- BMI calculations are auto-computed in `vitals` table
