# Chapter 4: Instruments & Tools for StudentCare+ System

**Purpose:** Support Chapter 4 implementation with practical testing and verification tools

---

## 1. API TESTING INSTRUMENT
**File:** `CHAPTER4_API_TESTING_INSTRUMENT.md`

### Purpose
Verify all API endpoints work correctly with actual test cases

### Content Structure
```markdown
# API Testing Instrument for StudentCare+

## 1. AUTHENTICATION ENDPOINTS

### Test Case 1.1: User Login
Endpoint: POST /api/login.php
Input:
  - email: "nurse@pdmhs.edu.ph"
  - password: "SecurePass123"

Expected Output:
  - HTTP 200
  - Response includes: user_id, role, token
  - Activity log created

Test Procedure:
1. Send POST request with valid credentials
2. Verify response contains JWT token
3. Check activity_logs table for entry
4. Save token for subsequent requests

Pass Criteria: ✅ if all above verified

---

### Test Case 1.2: Invalid Login
Endpoint: POST /api/login.php
Input:
  - email: "invalid@test.com"
  - password: "wrong"

Expected: HTTP 401, error message

---

## 2. QR CODE ENDPOINTS

### Test Case 2.1: Generate Student QR
Endpoint: GET /api/get-student-qr.php?student_id=1

Expected:
- HTTP 200
- Response: { qr_code: "base64_encoded_string" }
- QR contains: { student_id, name, section }

---

## 3. MEDICAL VISIT ENDPOINTS

### Test Case 3.1: Save Medical Visit (Regular)
Endpoint: POST /api/save-medical-visit.php
Input:
{
  "student_id": 1,
  "visit_type": "regular",
  "notes": "Headache",
  "vitals": { "temp": 37.2, "bp": "120/80" },
  "notifyParent": true
}

Expected:
- HTTP 200
- Visit saved to database
- SMS message queued (framework check)
- Activity log created
- Adviser notification sent

---

### Test Case 3.2: Save Medical Visit (Emergency)
Same as 3.1 but:
- visit_type: "emergency"
- Priority: HIGH
- Both parent + adviser notified
- Admin alert created

---

## 4. FORM VALIDATION INSTRUMENT

### Test Cases for Phone Number Validation
- ✅ Valid: 09123456789
- ✅ Valid: 639123456789
- ✅ Valid: +639123456789
- ❌ Invalid: 08123456789 (wrong carrier)
- ❌ Invalid: 123456 (too short)
- ❌ Invalid: abcdefghijk (letters)

### Test Cases for Email Validation
- ✅ Valid: nurse@pdmhs.edu.ph
- ❌ Invalid: nurse@pdmhs (no extension)
- ❌ Invalid: @pdmhs.edu.ph (no address)

### Test Cases for Medical Data
- ✅ Valid Diagnosis: "Headache with fever"
- ✅ Valid Temperature: 37.5°C
- ❌ Invalid Temperature: 45.0°C (unrealistic)
- ❌ Blank diagnosis (required field)
```

---

## 2. DATABASE TESTING INSTRUMENT
**File:** `CHAPTER4_DATABASE_TESTING_INSTRUMENT.md`

### Purpose
Verify database integrity, relationships, and data quality

### Content
```markdown
# Database Testing Instrument

## 1. DATA INTEGRITY TESTS

### Test 1.1: Foreign Key Relationships
Verify:
- All medical_visits.student_id exist in students table
- All adviser_assignments.adviser_id exist in users table
- All notifications.student_id exist in students table

SQL Query:
SELECT COUNT(*) FROM medical_visits
WHERE student_id NOT IN (SELECT student_id FROM students);
-- Expected: 0 (no orphaned records)

---

### Test 1.2: Role Integrity
Verify all users have valid role_id

SQL Query:
SELECT COUNT(*) FROM users
WHERE role_id NOT IN (SELECT role_id FROM roles);
-- Expected: 0

---

## 2. DATA QUALITY TESTS

### Test 2.1: Null Values in Required Fields
Fields that MUST NOT be NULL:
- users.first_name
- users.last_name
- students.student_number
- students.grade_level
- parents.phone
- medical_visits.student_id
- medical_visits.visit_datetime

### Test 2.2: Phone Number Format
SELECT phone FROM parents 
WHERE phone NOT REGEXP '^63[0-9]{10}$';
-- Should return: 0 records

---

## 3. BACKUP INTEGRITY TEST

### Test 3.1: Daily Backup Verification
Check every morning:
1. Backup file exists: /backend/backups/backup_*.sql
2. File size > 1MB
3. File modified time recent (within 24 hours)
4. Can be restored without errors

### Test 3.2: Restore Test
Monthly restoration drill:
1. Take backup from 2 weeks ago
2. Restore to test database
3. Verify record count matches
4. Verify no data corruption
5. Document restore time

---

## 4. SECURITY TESTS

### Test 4.1: Password Storage
Verify:
- Passwords are hashed (not plaintext)
- Hashes consistent (same password = same hash)

### Test 4.2: SQL Injection Prevention
Try to inject: '; DROP TABLE users; --
Expected: Rejected or escaped safely

### Test 4.3: Authentication
Verify:
- Unauthenticated requests rejected
- Session tokens expire
- Multiple simultaneous sessions tracked
```

---

## 3. USER ACCEPTANCE TESTING (UAT) INSTRUMENT
**File:** `CHAPTER4_UAT_INSTRUMENT.md`

### Purpose
Structured testing with clinic staff, advisers, and students

### Content
```markdown
# User Acceptance Testing Instrument

## UAT TEST CASES BY USER ROLE

### A. CLINIC STAFF TESTING

#### Test Case A.1: Student Check-In via QR Scan
Steps:
1. Click "New Medical Visit"
2. Scan student QR code
3. Verify student information shows correctly
4. Fill in: temperature, diagnosis, treatment
5. Check "Notify Parent"
6. Click "Save"

Acceptance Criteria:
- ✅ Student found immediately (< 3 seconds)
- ✅ Data populated correctly
- ✅ Form saves without errors
- ✅ Patient record updated
- ✅ Parent SMS checkbox available

---

#### Test Case A.2: Emergency Visit
Steps:
1. New Medical Visit
2. Set Visit Type: "Emergency"
3. Fill medical information
4. Note shows emergency checkmark/indicator

Acceptance Criteria:
- ✅ Emergency flag visible
- ✅ Admin notified (check notifications)
- ✅ SMS to parent marked (pending SMS integration)
- ✅ Adviser gets alert
- ✅ Record marked HIGH priority

---

#### Test Case A.3: Search Student Without QR
Steps:
1. Click "Search Manually"
2. Type student name/number
3. Results show immediately
4. Click to select student

Acceptance Criteria:
- ✅ Search returns matching students
- ✅ No delay (< 2 seconds)
- ✅ Correct student selection
- ✅ Can proceed with visit

---

### B. ADVISER/TEACHER TESTING

#### Test Case B.1: View Class Health Status
Steps:
1. Login as adviser
2. Go to Dashboard > Health Monitoring
3. View student health summaries
4. Click on student for details

Acceptance Criteria:
- ✅ All class students listed
- ✅ Recent clinic visits shown
- ✅ Allergies displayed prominently
- ✅ Can view complete student health record

---

#### Test Case B.2: Receive Health Alert
Steps:
1. Student in your class visits clinic
2. Refresh your dashboard
3. Should see new notification

Acceptance Criteria:
- ✅ Alert appears within 2 minutes
- ✅ Shows student name, reason
- ✅ Can mark as read
- ✅ Alert includes medical details

---

### C. STUDENT TESTING

#### Test Case C.1: View My QR Code
Steps:
1. Login as student
2. Go to Profile
3. Click "View QR Code"
4. Download QR code

Acceptance Criteria:
- ✅ QR code displays clearly
- ✅ Can download as image
- ✅ QR contains correct student data
- ✅ Can print and use

---

#### Test Case C.2: View Medical History
Steps:
1. Go to Medical Records
2. View all past clinic visits
3. Check for allergies section

Acceptance Criteria:
- ✅ All visits listed with dates
- ✅ Can see past diagnoses
- ✅ Allergies prominently shown
- ✅ Information accurate

---

### D. ADMIN TESTING

#### Test Case D.1: Emergency Alerts Dashboard
Steps:
1. Login as admin
2. View Emergency Alerts section
3. Should show all urgent cases

Acceptance Criteria:
- ✅ List shows in real-time
- ✅ Color coded by severity
- ✅ Can send SMS to parent
- ✅ Can view full details
- ✅ Alert clears when marked resolved

---

#### Test Case D.2: Manual Backup Trigger
Steps:
1. Go to System Settings > Backup
2. Click "Create Backup Now"
3. Watch progress

Acceptance Criteria:
- ✅ Shows progress indication
- ✅ Completes successfully
- ✅ File created in backups folder
- ✅ Can download backup file

---

## UAT FEEDBACK FORM

**For Each Tester:**

1. Ease of Use: 1-5 ☐
2. Speed: 1-5 ☐
3. Accuracy: 1-5 ☐
4. Would you use this daily? Yes/No ☐
5. Top 3 Issues:
   - Issue 1: __________
   - Issue 2: __________
   - Issue 3: __________
6. Suggested Improvements:
   - ________
   - ________

---

## SIGN-OFF

After all UAT tests pass:

Clinic Staff Representative: _____________ Date: _______
System passed UAT with clinic staff

Adviser Representative: _____________ Date: _______
System meets adviser requirements

Admin Representative: _____________ Date: _______
System admin features working correctly
```

---

## 4. SECURITY TESTING INSTRUMENT
**File:** `CHAPTER4_SECURITY_TESTING_INSTRUMENT.md`

### Purpose
Verify system meets security standards without data breaches

### Content
```markdown
# Security Testing Instrument

## 1. AUTHENTICATION TESTING

### Test 1.1: Access Control
- ✅ Student cannot access Clinic Staff module
- ✅ Clinic Staff cannot access Admin settings
- ✅ Adviser can only see their own class students
- ✅ Login required for all pages
- ✅ Logout clears session

Procedure:
1. Login as student
2. Try to access: /dashboard/staff/visits
3. Should be rejected (403 Forbidden)

---

## 2. DATA PRIVACY TESTING

### Test 2.1: Sensitive Data Access
Verify:
- ❌ Parent phone numbers NOT visible in user list
- ❌ Medical diagnoses NOT visible to students
- ✅ Only student can view own medical record
- ✅ Adviser can see limited health info only

---

### Test 2.2: Encryption Testing (After Implementation)
- Verify parent phone encrypted in database
- Verify visible in system for SMS
- Verify encrypted in logs

---

## 3. INPUT VALIDATION TESTING

### Test 3.1: SQL Injection
Input: admin' --
Expected: Rejected or safely escaped
Result: ❌ ✅

### Test 3.2: XSS Injection
Input: <script>alert('xss')</script>
Expected: Escaped to text
Result: ❌ ✅

### Test 3.3: Path Traversal
Input: ../../../../../../etc/passwd
Expected: Rejected
Result: ❌ ✅

---

## 4. SESSION TESTING

### Test 4.1: Session Timeout
1. Login
2. Wait 30 minutes
3. Try to access page
Expected: Redirected to login

---

### Test 4.2: Concurrent Sessions
1. Login on Browser A
2. Login on Browser B with same user
3. Verify both sessions work
4. Or verify only latest session valid

---

## 5. BACKUP SECURITY

### Test 5.1: Backup Access
- ❌ Backup files NOT accessible via web browser
- ✅ Only admin can download backups
- ✅ Backup filesystem protected

---

## SECURITY ISSUES LOG

| Issue | Severity | Found | Fixed | Verified |
|-------|----------|-------|-------|----------|
| No rate limiting | High | ✅ | ⏳ | ❌ |
| Weak CORS | Medium | ✅ | ⏳ | ❌ |
| No encryption | High | ✅ | ⏳ | ❌ |
| XSS vulnerability? | TBD | ? | ? | ? |
```

---

## 5. PERFORMANCE TESTING INSTRUMENT
**File:** `CHAPTER4_PERFORMANCE_TESTING_INSTRUMENT.md`

### Purpose
Verify system meets speed and reliability requirements

### Content
```markdown
# Performance Testing Instrument

## PERFORMANCE BENCHMARKS

### 1. QR Scan Performance
Requirement: 1-2 seconds
Test: Scan QR code 10 times, measure time

| Attempt | Time (ms) | Pass? |
|---------|-----------|-------|
| 1 | _____ | ✅/❌ |
| 2 | _____ | ✅/❌ |
| ... | ... | ... |

Average: _____ ms
Status: ✅ Pass / ❌ Fail

---

### 2. Student Search Performance
Requirement: < 2 seconds
Test: Search for "John" (common name)

Results returned: _____ records
Time: _____ ms
Status: ✅ Pass / ❌ Fail

---

### 3. Dashboard Load Time
Requirement: < 3 seconds
Test: Load admin dashboard with full data

Time: _____ ms
Status: ✅ Pass / ❌ Fail

---

### 4. SMS Processing Time
Requirement: Message queued within 60 seconds
Test: Record visit, check when SMS message appears in logs

Time: _____ seconds
Status: ✅ Pass / ❌ Fail (After SMS integration)

---

## LOAD TESTING

### Test: Multiple simultaneous visits
Scenario: 10 clinic staff recording visits at same time

Test:
1. Open 10 browser windows
2. All simultaneously save medical visits
3. Verify all records created
4. Database doesn't crash
5. No data loss

Results: _______________
Status: ✅ Pass / ❌ Fail

---

## STRESS TESTING

### Test: High-volume data
Scenario: 1000 medical visits in single day

Measure:
- Response time (should not degrade)
- Database query time
- Memory usage

Results: _______________
Status: ✅ Pass / ❌ Fail
```

---

## 6. DEPLOYMENT VERIFICATION INSTRUMENT
**File:** `CHAPTER4_DEPLOYMENT_VERIFICATION_INSTRUMENT.md`

### Purpose
Checklist to verify system ready and working in production

### Content
```markdown
# Deployment Verification Instrument

## PRE-DEPLOYMENT CHECKLIST

### Database
- [ ] Database backup created
- [ ] All migrations applied
- [ ] Data integrity verified (no orphaned records)
- [ ] Backup can be restored successfully

### Backend API
- [ ] All endpoints tested and working
- [ ] Error handling verified
- [ ] Logging enabled
- [ ] Rate limiting configured (placeholder if not ready)

### Frontend
- [ ] All pages load correctly
- [ ] Forms validate input properly
- [ ] Error messages clear
- [ ] Mobile responsive

### Security
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Passwords hashed
- [ ] Sessions secured

### Feature Verification
- [ ] QR scanning works with real QR codes
- [ ] Medical visits save correctly
- [ ] Notifications send framework activated
- [ ] Backups functional
- [ ] Audit logs recording

---

## DEPLOYMENT DAY CHECKLIST

### Morning (Before Going Live)

- [ ] Final database backup taken
- [ ] System accessible from school network
- [ ] Staff credentials tested
- [ ] QR code test with 3 students
- [ ] SMS mock test (framework check)
- [ ] Backup/restore tested

### Go-Live

- [ ] All users notified of launch
- [ ] Clinic staff on-site and trained
- [ ] Admin monitors error logs
- [ ] First 10 visits recorded without issues
- [ ] Dashboard showing correct data

### Post-Launch (First 7 Days)

Day 1:
- [ ] Monitor error logs every hour
- [ ] Collect staff feedback
- [ ] Fix critical issues

Day 2-7:
- [ ] Monitor system performance
- [ ] Verify backups created daily
- [ ] Staff comfortable using system
- [ ] Close out any issues

---

## SIGN-OFF

System passed all verification checks:

Date: ___________
Verified By: ___________
Notes: ___________

Ready for production deployment: ☐ YES ☐ NO
```

---

## 7. SMS INTEGRATION TEST INSTRUMENT (Once Ready)
**File:** `CHAPTER4_SMS_TESTING_INSTRUMENT.md`

### Purpose
Verify SMS system works correctly when integrated

### Content
```markdown
# SMS Integration Testing Instrument

## SMS GATEWAY TESTS

### Test 1: SMS Delivery
What: Send SMS from system to real phone
When: After SMS gateway integrated

Test Case 1.1: Regular Visit SMS
Step 1: Save medical visit (regular type)
Step 2: Check "Notify Parent"
Step 3: Save
Expected: SMS arrives on parent phone within 60 seconds

Message should contain:
- Student name
- Visit type
- Diagnosis/reason
- Timestamp

---

### Test 1.2: Emergency SMS
Step 1: Save medical visit (emergency type)
Step 2: SMS auto-checked
Step 3: Save
Expected: SMS arrives within 30 seconds

Message should be marked:
- 🚨 URGENT at beginning
- Student name
- Request immediate contact

---

### Test 2: Multiple Recipients
Test: Send SMS to both parent and adviser

For Parent: "Your child visited clinic..."
For Adviser: "Student in your class visited clinic..."

Expected: Both receive appropriate messages

---

### Test 3: Invalid Phone Numbers
Try sending to:
- ❌ 123456 (too short)
- ❌ blank (empty)
- ✅ 09123456789 (valid)

---

### Test 4: Failure Handling
What: SMS gateway offline

Expected:
- System logs failed attempt
- Message queued for retry
- Recommends email alternative
- Admin notified of failure

---

## SMS LOGGING

For each SMS:
- [ ] Logged to database
- [ ] Timestamp recorded
- [ ] Recipient number stored
- [ ] Message content logged
- [ ] Delivery status tracked
- [ ] Response from gateway logged

---

## SMS METRICS

Track:
- Total SMS sent: _____
- Delivery success rate: _____%
- Average delivery time: _____ seconds
- Failed deliveries: _____
- Cost per SMS: ₱_____
```

---

## SUMMARY TABLE: ALL INSTRUMENTS

| Instrument | Purpose | When to Use | Owner |
|-----------|---------|-----------|-------|
| **API Testing** | Verify endpoints work | During implementation | Backend Dev |
| **Database Testing** | Verify data integrity | Weekly | Backend Dev |
| **UAT Testing** | Real user testing | Week 4 of Phase 1 | Clinic Staff |
| **Security Testing** | Verify no vulnerabilities | Week 3 | Security Lead |
| **Performance Testing** | Verify speed/performance | Week 4 | QA Lead |
| **Deployment Verification** | Pre-launch checklist | Day before go-live | Admin |
| **SMS Testing** | Verify SMS integration | After SMS implementation | Backend Dev |

---

## HOW TO USE THESE INSTRUMENTS

### For Development Team
1. Print each instrument
2. Check items as you build features
3. Record results
4. Fix issues found

### For Testing Team
1. Run through test cases
2. Document results
3. Report failures
4. Verify fixes

### For Stakeholders
1. Review sign-off sections
2. Approve progress
3. Authorize Go-Live

### For Documentation
1. Archive all test results
2. Include in final deployment report
3. Use for lessons learned
4. Reference for future updates

---

**Total Instruments Created:** 7  
**Total Test Cases:** 50+  
**Expected Testing Time:** 3-4 weeks (Phase 1 & 2)

These instruments support Chapter 4 with practical, actionable testing procedures.
