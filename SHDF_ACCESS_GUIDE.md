# Student Health Data Form (SHDF) - Access Guide

## Paano Ma-access ang SHDF Feature

### 1. Para sa Students

**Via Dashboard:**
1. Login bilang Student
2. Pumunta sa Student Dashboard
3. Makikita mo ang **"Student Health Data Form (SHDF)"** card sa right column
4. I-click ang **"📋 Fill Out SHDF Form"** button

**Direct URL:**
```
http://localhost:4200/shdf/{your_student_id}
```

### 2. Para sa Clinic Staff

**Via Student List:**
1. Login bilang Clinic Staff
2. Pumunta sa Students page
3. Sa table, makikita mo ang **"SHDF"** button sa Actions column
4. I-click ang SHDF button ng student na gusto mong tingnan/i-fill up

**Direct URL:**
```
http://localhost:4200/shdf/{student_id}
```

### 3. Para sa Advisers

**Via Student List:**
1. Login bilang Adviser
2. Pumunta sa Students page (kung may access)
3. I-click ang **"SHDF"** button sa Actions column

**Direct URL:**
```
http://localhost:4200/shdf/{student_id}
```

## Ano ang Makikita sa SHDF Form

Ang form ay may mga sumusunod na sections:

### 📋 Student Information
- Pre-filled, read-only fields
- Student name, number, grade level, etc.
- Parent/Guardian information
- Emergency contact details

### 💉 PhilHealth Information
- Learner PhilHealth ID (optional, 12 characters)
- Parent PhilHealth ID (optional, 12 characters)
- Parent name and relationship

### 💉 Immunization Records
9 vaccines na kailangan i-indicate (Yes/No/N/A):
- BCG (Tuberculosis Vaccine)
- Diphtheria Pertussis
- Oral Polio Vaccine
- MMR (Measles, Mumps, Rubella)
- Chicken Pox Vaccine
- Hepatitis B Vaccine
- Tetanus Toxoid Vaccine
- Flu Vaccine
- Pneumococcal Vaccine

### 🏥 Medical History
- Menarche age (for female students only)
- Allergy status
- Medical conditions (with "None" exclusivity)
- Current medications (with "None" exclusivity)
- PWD status
- Surgery history

### 👨‍👩‍👧‍👦 Family History
- Family medical conditions (with "None" exclusivity)
- Smoke exposure
- 4Ps beneficiary status
- SBFP beneficiary status

### ✍️ Parental Consent
- Information certification (required)
- Deworming consent (required)
- MRTD consent (required for Grade 7 only)
- WIFA consent (required for female students only)
- Signature file upload (PDF, JPEG, or PNG, max 100MB)

## Validation Rules

### Required Fields
- All student information fields
- All 9 immunization statuses
- Allergy status
- Parental consent checkboxes
- Signature file

### Conditional Required Fields
- **Menarche age**: Required for female students
- **MRTD consent**: Required for Grade 7 students (cannot be "not applicable")
- **WIFA consent**: Required for female students (cannot be "not applicable")
- **Emergency contact other**: Required when "Other" is selected
- **PWD congenital detail**: Required when PWD status is "Congenital"
- **Deworming refusal reason**: Required when deworming consent is "Hindi"

### "None" Exclusivity
Hindi pwedeng mag-select ng "None" kasama ng ibang options sa:
- Medical conditions
- Medications
- Family history conditions

### File Upload
- Accepted formats: PDF, JPEG, PNG
- Maximum size: 100 MB
- Required field

## API Endpoints

### Backend (Laravel)
```
GET  /api/shdf/{student_id}                    - Get SHDF data
POST /api/shdf                                  - Submit SHDF form
GET  /api/shdf/{student_id}/{school_year_id}   - Get SHDF by school year
```

### Authentication
Lahat ng endpoints ay nangangailangan ng authentication token (Sanctum).

## Access Control

### Clinic Staff
- ✅ Can view any student's SHDF
- ✅ Can submit SHDF for any student

### Adviser
- ✅ Can view SHDF of students in their section only
- ❌ Cannot submit SHDF

### Student
- ✅ Can view their own SHDF only
- ✅ Can submit their own SHDF

## Database Tables

Ang SHDF data ay naka-store sa:
- `students` - parent_guardian_name, emergency contact
- `student_philhealth` - PhilHealth information
- `student_immunizations` - Immunization records
- `medical_history` - Medical conditions and history
- `student_family_history` - Family medical history
- `student_parental_consent` - Consent and signature

## Testing

### Manual Testing
1. I-start ang Docker containers:
   ```bash
   docker-compose up -d
   ```

2. I-access ang frontend:
   ```
   http://localhost:4200
   ```

3. Login at i-navigate sa SHDF form

4. I-fill up ang form at i-submit

5. I-verify sa PHPMyAdmin:
   ```
   http://localhost:8081
   ```
   - Username: root
   - Password: secret
   - Database: 4seasons

### API Testing
```bash
# Get SHDF data
curl -X GET "http://localhost:8082/api/shdf/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/json"

# Submit SHDF
curl -X POST "http://localhost:8082/api/shdf" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "student_id=1" \
  -F "parent_guardian_name=Juan Dela Cruz" \
  -F "signature=@signature.pdf" \
  ...
```

## Troubleshooting

### Hindi makita ang SHDF button
- I-check kung naka-login ka
- I-verify ang role (student/clinic_staff/adviser)
- I-refresh ang page
- I-clear ang browser cache

### Form validation errors
- I-check kung lahat ng required fields ay na-fill up
- I-verify ang file format at size ng signature
- I-check ang conditional fields based sa gender at grade level

### Database connection error
- I-check kung running ang MySQL container: `docker-compose ps`
- I-restart ang containers: `docker-compose restart`
- I-check ang logs: `docker-compose logs backend`

## Next Steps

1. ✅ Backend API - Complete
2. ✅ Frontend Form - Complete
3. ✅ Validation - Complete
4. ✅ Access Control - Complete
5. ✅ Navigation Links - Complete
6. 🔄 Testing - Ready for manual testing
7. ⏳ User Acceptance Testing
8. ⏳ Production Deployment

---

**Note:** Ang SHDF feature ay fully implemented na. Kailangan lang i-start ang Docker containers at i-test manually sa browser.
