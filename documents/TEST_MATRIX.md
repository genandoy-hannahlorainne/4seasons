# StudentCare+ — Test Matrix

**System:** Studentcare+: A Web-Based Clinic Management System with QR Scanning and SMS Notifications
**Institution:** President Diosdado Macapagal High School (PDMHS)
**Testing Date:** May 2026
**Prepared by:** Team 4seasons
**Total Test Cases:** 148 | **Passed:** 143 (97%) | **Failed:** 0 (0%) | **Warnings:** 5 (3%)

---

## Summary by Module

| Module | Total TCs | Passed | Failed | Warnings | Pass Rate |
|--------|-----------|--------|--------|----------|-----------|
| 1. Authentication & Authorization | 20 | 20 | 0 | 0 | 100% |
| 2. User Management | 15 | 15 | 0 | 0 | 100% |
| 3. Student Health Data Form (SHDF) | 27 | 27 | 0 | 0 | 100% |
| 4. Medical Visit Management | 24 | 24 | 0 | 0 | 100% |
| 5. Student Profile & Medical Records | 13 | 13 | 0 | 0 | 100% |
| 6. Adviser Features | 17 | 17 | 0 | 0 | 100% |
| 7. Clinic Staff Features | 8 | 8 | 0 | 0 | 100% |
| 8. Admin Features | 38 | 37 | 0 | 1 | 97% |
| 9. Notification System | 17 | 17 | 0 | 0 | 100% |
| 10. SMS Notifications | 6 | 6 | 0 | 0 | 100% |
| 11. Email Notifications | 6 | 5 | 0 | 1 | 83% |
| 12. Audit Logging | 10 | 10 | 0 | 0 | 100% |
| 13. Security Testing | 15 | 15 | 0 | 0 | 100% |
| 14. Dashboard Features | 17 | 17 | 0 | 0 | 100% |
| 15. Mobile Responsiveness | 12 | 12 | 0 | 0 | 100% |
| 16. Error Handling & Edge Cases | 21 | 19 | 0 | 2 | 90% |
| **TOTAL** | **148** | **143** | **0** | **5** | **97%** |

---

## Detailed Test Matrix

| Test Case ID | Module | Sub-Module | Test Description | Type | Priority | Status |
|-------------|--------|-----------|-----------------|------|----------|--------|
| TC-AUTH-001 | Authentication | User Login | Valid credentials login | Functional | High | PASS |
| TC-AUTH-002 | Authentication | User Login | Invalid username | Negative | High | PASS |
| TC-AUTH-003 | Authentication | User Login | Wrong password | Negative | High | PASS |
| TC-AUTH-004 | Authentication | User Login | Inactive account login | Negative | High | PASS |
| TC-AUTH-005 | Authentication | User Login | Missing role profile | Negative | High | PASS |
| TC-AUTH-006 | Authentication | User Login | Sanctum token generation | Functional | High | PASS |
| TC-AUTH-007 | Authentication | User Login | Token expiration handling | Functional | High | PASS |
| TC-AUTH-008 | Authentication | User Login | Token refresh | Functional | Medium | PASS |
| TC-AUTH-009 | Authentication | User Login | Logout | Functional | High | PASS |
| TC-AUTH-010 | Authentication | User Login | Rate limiting | Security | High | PASS |
| TC-AUTH-011 | Authentication | Role Routing | Student login redirect | Functional | High | PASS |
| TC-AUTH-012 | Authentication | Role Routing | Adviser login redirect | Functional | High | PASS |
| TC-AUTH-013 | Authentication | Role Routing | Clinic Staff login redirect | Functional | High | PASS |
| TC-AUTH-014 | Authentication | Role Routing | Admin login redirect | Functional | High | PASS |
| TC-AUTH-015 | Authentication | Role Routing | Token includes role_name | Functional | Medium | PASS |
| TC-AUTH-016 | Authentication | Role Routing | Role middleware enforcement | Security | High | PASS |
| TC-AUTH-017 | Authentication | Force Password | First login with temp password | Functional | High | PASS |
| TC-AUTH-018 | Authentication | Force Password | Submit new password | Functional | High | PASS |
| TC-AUTH-019 | Authentication | Force Password | New password same as current | Negative | Medium | PASS |
| TC-AUTH-020 | Authentication | Force Password | Password min length enforced | Validation | Medium | PASS |
| TC-USR-001 | User Management | User Creation | Create student account | Functional | High | PASS |
| TC-USR-002 | User Management | User Creation | Create adviser account | Functional | High | PASS |
| TC-USR-003 | User Management | User Creation | Create clinic staff account | Functional | High | PASS |
| TC-USR-004 | User Management | User Creation | Duplicate username/email | Negative | High | PASS |
| TC-USR-005 | User Management | User Creation | Student number format validation | Validation | High | PASS |
| TC-USR-006 | User Management | User Creation | Required fields validation | Validation | High | PASS |
| TC-USR-007 | User Management | User Creation | Account creation email | Functional | Medium | PASS |
| TC-USR-008 | User Management | User Creation | password_must_change flag set | Functional | High | PASS |
| TC-USR-009 | User Management | Operations | View all users | Functional | Medium | PASS |
| TC-USR-010 | User Management | Operations | Edit user details | Functional | High | PASS |
| TC-USR-011 | User Management | Operations | Deactivate user | Functional | High | PASS |
| TC-USR-012 | User Management | Operations | Activate user | Functional | High | PASS |
| TC-USR-013 | User Management | Operations | Delete user | Functional | High | PASS |
| TC-USR-014 | User Management | Operations | Admin reset user password | Functional | High | PASS |
| TC-USR-015 | User Management | Operations | Password change request workflow | Functional | Medium | PASS |
| TC-SHDF-001 | SHDF | Stage 1 | Submit basic info | Functional | High | PASS |
| TC-SHDF-002 | SHDF | Stage 1 | Required fields validation | Validation | High | PASS |
| TC-SHDF-003 | SHDF | Stage 1 | Emergency contact phone format | Validation | Medium | PASS |
| TC-SHDF-004 | SHDF | Stage 1 | Optional physical data | Functional | Low | PASS |
| TC-SHDF-005 | SHDF | Stage 1 | Student authorization check | Security | High | PASS |
| TC-SHDF-006 | SHDF | Stage 1 | Username-to-student mapping fix | Functional | High | PASS |
| TC-SHDF-007 | SHDF | Stage 1 | SHDF status tracking | Functional | High | PASS |
| TC-SHDF-008 | SHDF | Stage 2 | Submit comprehensive form | Functional | High | PASS |
| TC-SHDF-009 | SHDF | Stage 2 | Requires Stage 1 first | Negative | High | PASS |
| TC-SHDF-010 | SHDF | Stage 2 | PhilHealth ID format | Validation | Medium | PASS |
| TC-SHDF-011 | SHDF | Stage 2 | Immunization fields required | Validation | High | PASS |
| TC-SHDF-012 | SHDF | Stage 2 | Medical condition None exclusivity | Validation | High | PASS |
| TC-SHDF-013 | SHDF | Stage 2 | Medication None exclusivity | Validation | High | PASS |
| TC-SHDF-014 | SHDF | Stage 2 | Family history None exclusivity | Validation | High | PASS |
| TC-SHDF-015 | SHDF | Stage 2 | Female-only fields | Conditional | High | PASS |
| TC-SHDF-016 | SHDF | Stage 2 | Grade 7 MRTD consent | Conditional | High | PASS |
| TC-SHDF-017 | SHDF | Stage 2 | Deworming refusal reason | Conditional | High | PASS |
| TC-SHDF-018 | SHDF | Stage 2 | PWD congenital detail | Conditional | Medium | PASS |
| TC-SHDF-019 | SHDF | Stage 2 | Signature file upload | Functional | High | PASS |
| TC-SHDF-020 | SHDF | Stage 2 | Emergency contact Other | Conditional | Medium | PASS |
| TC-SHDF-021 | SHDF | Stage 2 | information_certified required | Validation | High | PASS |
| TC-SHDF-022 | SHDF | Retrieval | Get SHDF for current school year | Functional | High | PASS |
| TC-SHDF-023 | SHDF | Retrieval | Get SHDF for specific school year | Functional | Medium | PASS |
| TC-SHDF-024 | SHDF | Retrieval | Get SHDF completion status | Functional | High | PASS |
| TC-SHDF-025 | SHDF | Retrieval | Deadline approaching detection | Functional | Medium | PASS |
| TC-SHDF-026 | SHDF | Retrieval | Overdue detection | Functional | Medium | PASS |
| TC-SHDF-027 | SHDF | Retrieval | Adviser SHDF download | Functional | Medium | PASS |
| TC-VIS-001 | Medical Visits | Recording | Create routine visit | Functional | High | PASS |
| TC-VIS-002 | Medical Visits | Recording | Create emergency visit | Functional | High | PASS |
| TC-VIS-003 | Medical Visits | Recording | Required fields validation | Validation | High | PASS |
| TC-VIS-004 | Medical Visits | Recording | Chief complaint max length | Validation | Medium | PASS |
| TC-VIS-005 | Medical Visits | Recording | Notes max length | Validation | Low | PASS |
| TC-VIS-006 | Medical Visits | Recording | Visit type validation | Validation | High | PASS |
| TC-VIS-007 | Medical Visits | Recording | Status validation | Validation | Medium | PASS |
| TC-VIS-008 | Medical Visits | Recording | Notification method validation | Validation | Medium | PASS |
| TC-VIS-009 | Medical Visits | Recording | Vitals recording | Functional | High | PASS |
| TC-VIS-010 | Medical Visits | Recording | Blood pressure parsing | Functional | Medium | PASS |
| TC-VIS-011 | Medical Visits | Recording | Transaction rollback on error | Functional | High | PASS |
| TC-VIS-012 | Medical Visits | Recording | Adviser push notification | Integration | High | PASS |
| TC-VIS-013 | Medical Visits | Recording | Emergency SMS dispatch | Integration | High | PASS |
| TC-VIS-014 | Medical Visits | Viewing | List all visits paginated | Functional | Medium | PASS |
| TC-VIS-015 | Medical Visits | Viewing | Filter by student_id | Functional | Medium | PASS |
| TC-VIS-016 | Medical Visits | Viewing | Filter by date range | Functional | Medium | PASS |
| TC-VIS-017 | Medical Visits | Viewing | Filter emergency only | Functional | Medium | PASS |
| TC-VIS-018 | Medical Visits | Viewing | Filter by visit type | Functional | Medium | PASS |
| TC-VIS-019 | Medical Visits | Viewing | View single visit | Functional | Medium | PASS |
| TC-VIS-020 | Medical Visits | Viewing | Student visit history | Functional | High | PASS |
| TC-VIS-021 | Medical Visits | Viewing | Visit statistics | Functional | Medium | PASS |
| TC-VIS-022 | Medical Visits | QR Lookup | QR scan lookup | Functional | High | PASS |
| TC-VIS-023 | Medical Visits | QR Lookup | QR requires basic SHDF | Functional | High | PASS |
| TC-VIS-024 | Medical Visits | QR Lookup | Invalid QR code | Negative | High | PASS |
| TC-STU-001 | Student Profile | Profile | View own profile | Functional | High | PASS |
| TC-STU-002 | Student Profile | Profile | Update student profile | Functional | High | PASS |
| TC-STU-003 | Student Profile | Profile | BMI auto-calculation | Functional | Medium | PASS |
| TC-STU-004 | Student Profile | Profile | BMI category assignment | Functional | Medium | PASS |
| TC-STU-005 | Student Profile | Profile | View medical data | Functional | High | PASS |
| TC-STU-006 | Student Profile | Profile | Update medical data | Functional | High | PASS |
| TC-STU-007 | Student Profile | Profile | Search students | Functional | Medium | PASS |
| TC-STU-008 | Student Profile | Profile | Student list staff view | Functional | Medium | PASS |
| TC-STU-009 | Student Profile | Badges | View student badges | Functional | Low | PASS |
| TC-STU-010 | Student Profile | Badges | Badge notifications | Functional | Low | PASS |
| TC-STU-011 | Student Profile | Badges | Mark badge notification read | Functional | Low | PASS |
| TC-STU-012 | Student Profile | Badges | Badge summary | Functional | Low | PASS |
| TC-STU-013 | Student Profile | Badges | Streak badge metadata | Functional | Low | PASS |
| TC-ADV-001 | Adviser | Dashboard | View adviser dashboard | Functional | High | PASS |
| TC-ADV-002 | Adviser | Dashboard | Student count | Functional | Medium | PASS |
| TC-ADV-003 | Adviser | Dashboard | Students with allergies count | Functional | Medium | PASS |
| TC-ADV-004 | Adviser | Dashboard | Recent visits last 7 days | Functional | Medium | PASS |
| TC-ADV-005 | Adviser | Dashboard | Section fallback logic | Functional | High | PASS |
| TC-ADV-006 | Adviser | Heatmap | View health heatmap | Functional | High | PASS |
| TC-ADV-007 | Adviser | Heatmap | Configurable date range | Functional | Medium | PASS |
| TC-ADV-008 | Adviser | Heatmap | Trending symptoms | Functional | High | PASS |
| TC-ADV-009 | Adviser | Heatmap | High-risk alert | Functional | High | PASS |
| TC-ADV-010 | Adviser | Heatmap | Percentage calculation | Functional | Medium | PASS |
| TC-ADV-011 | Adviser | Class Roster | View advisory students | Functional | High | PASS |
| TC-ADV-012 | Adviser | Class Roster | Advisory students with SHDF status | Functional | High | PASS |
| TC-ADV-013 | Adviser | Class Roster | Class roster by school year | Functional | Medium | PASS |
| TC-ADV-014 | Adviser | Class Roster | Roster sorted by name | Functional | Low | PASS |
| TC-ADV-015 | Adviser | Class Roster | Adviser notifications | Functional | High | PASS |
| TC-ADV-016 | Adviser | Profile | Adviser profile view | Functional | Medium | PASS |
| TC-ADV-017 | Adviser | Profile | Adviser profile update | Functional | Medium | PASS |
| TC-STF-001 | Clinic Staff | Dashboard | View clinic dashboard | Functional | High | PASS |
| TC-STF-002 | Clinic Staff | Dashboard | Visits today count | Functional | Medium | PASS |
| TC-STF-003 | Clinic Staff | Dashboard | Emergency visits this week | Functional | Medium | PASS |
| TC-STF-004 | Clinic Staff | Dashboard | Visits by day chart | Functional | Medium | PASS |
| TC-STF-005 | Clinic Staff | Dashboard | Visit type breakdown | Functional | Medium | PASS |
| TC-STF-006 | Clinic Staff | Reports | Staff reports and analytics | Functional | Medium | PASS |
| TC-STF-007 | Clinic Staff | Profile | Staff profile view | Functional | Low | PASS |
| TC-STF-008 | Clinic Staff | Profile | Staff profile update | Functional | Low | PASS |
| TC-ADM-001 | Admin | Dashboard | View admin dashboard | Functional | High | PASS |
| TC-ADM-002 | Admin | Dashboard | Total users by role | Functional | Medium | PASS |
| TC-ADM-003 | Admin | Dashboard | Recent users last 30 days | Functional | Low | PASS |
| TC-ADM-004 | Admin | Dashboard | School average BMI | Functional | Medium | PASS |
| TC-ADM-005 | Admin | Dashboard | Overweight/obese count | Functional | Medium | PASS |
| TC-ADM-006 | Admin | Dashboard | Health risk visualization | Functional | Medium | PASS |
| TC-ADM-007 | Admin | Dashboard | Recent visits last 5 | Functional | Medium | PASS |
| TC-ADM-008 | Admin | Sections | View all sections | Functional | High | PASS |
| TC-ADM-009 | Admin | Sections | Create section | Functional | High | PASS |
| TC-ADM-010 | Admin | Sections | Section name max length | Validation | Medium | PASS |
| TC-ADM-011 | Admin | Sections | Section capacity validation | Validation | Medium | PASS |
| TC-ADM-012 | Admin | Sections | Update section | Functional | High | PASS |
| TC-ADM-013 | Admin | Sections | Assign adviser to section | Functional | High | PASS |
| TC-ADM-014 | Admin | Sections | Remove adviser from section | Functional | Medium | PASS |
| TC-ADM-015 | Admin | Sections | Delete section | Functional | High | WARNING |
| TC-ADM-016 | Admin | Sections | View section students | Functional | Medium | PASS |
| TC-ADM-017 | Admin | Sections | Grade levels with sections | Functional | Medium | PASS |
| TC-ADM-018 | Admin | School Year | View all school years | Functional | Medium | PASS |
| TC-ADM-019 | Admin | School Year | Get current school year | Functional | High | PASS |
| TC-ADM-020 | Admin | School Year | Create school year | Functional | High | PASS |
| TC-ADM-021 | Admin | School Year | Update school year | Functional | Medium | PASS |
| TC-ADM-022 | Admin | School Year | Set current school year | Functional | High | PASS |
| TC-ADM-023 | Admin | School Year | Auto-set current check | Functional | Medium | PASS |
| TC-ADM-024 | Admin | Grade Promotion | View promotion summary | Functional | High | PASS |
| TC-ADM-025 | Admin | Grade Promotion | Bulk grade promotion | Functional | High | PASS |
| TC-ADM-026 | Admin | Grade Promotion | Copy sections to new year | Functional | High | PASS |
| TC-ADM-027 | Admin | Backup | View backup history | Functional | Medium | PASS |
| TC-ADM-028 | Admin | Backup | Create database backup | Functional | High | PASS |
| TC-ADM-029 | Admin | Backup | Download backup | Functional | High | PASS |
| TC-ADM-030 | Admin | Backup | Restore from backup | Functional | High | PASS |
| TC-ADM-031 | Admin | Backup | Delete backup file | Functional | Medium | PASS |
| TC-ADM-032 | Admin | Reports | View general reports | Functional | Medium | PASS |
| TC-ADM-033 | Admin | Reports | Principal health trends report | Functional | Medium | PASS |
| TC-ADM-034 | Admin | Settings | View system settings | Functional | Medium | PASS |
| TC-ADM-035 | Admin | Settings | Update system settings | Functional | High | PASS |
| TC-ADM-036 | Admin | Settings | Session timeout setting | Functional | High | PASS |
| TC-ADM-037 | Admin | Settings | Password min length setting | Functional | High | PASS |
| TC-ADM-038 | Admin | Settings | SMS settings | Functional | Medium | PASS |
| TC-NOT-001 | Notifications | Creation | Routine visit notification | Functional | High | PASS |
| TC-NOT-002 | Notifications | Creation | Emergency visit notification | Functional | High | PASS |
| TC-NOT-003 | Notifications | Creation | Student visit summary notification | Functional | High | PASS |
| TC-NOT-004 | Notifications | Creation | Password change request notification | Functional | Medium | PASS |
| TC-NOT-005 | Notifications | Creation | Notification priority levels | Functional | High | PASS |
| TC-NOT-006 | Notifications | Creation | Notification type classification | Functional | Medium | PASS |
| TC-NOT-007 | Notifications | Admin | View admin notifications | Functional | Medium | PASS |
| TC-NOT-008 | Notifications | Admin | Mark notification as read | Functional | Medium | PASS |
| TC-NOT-009 | Notifications | Admin | Mark all as read | Functional | Medium | PASS |
| TC-NOT-010 | Notifications | Admin | Approve password change request | Functional | High | PASS |
| TC-NOT-011 | Notifications | Admin | Dismiss password change request | Functional | Medium | PASS |
| TC-NOT-012 | Notifications | Push | VAPID public key retrieval | Functional | Medium | PASS |
| TC-NOT-013 | Notifications | Push | Subscribe to push notifications | Functional | Medium | PASS |
| TC-NOT-014 | Notifications | Push | Unsubscribe from push | Functional | Medium | PASS |
| TC-NOT-015 | Notifications | Push | FCM send to user | Integration | High | PASS |
| TC-NOT-016 | Notifications | Push | FCM send to topic | Integration | Medium | PASS |
| TC-NOT-017 | Notifications | Push | Adviser push on visit | Integration | High | PASS |
| TC-SMS-001 | SMS | Emergency SMS | Emergency visit triggers SMS | Integration | High | PASS |
| TC-SMS-002 | SMS | Emergency SMS | Fallback to student phone | Functional | High | PASS |
| TC-SMS-003 | SMS | Emergency SMS | SMS sent outside transaction | Functional | High | PASS |
| TC-SMS-004 | SMS | Emergency SMS | SMS disabled by default | Functional | Medium | PASS |
| TC-SMS-005 | SMS | Emergency SMS | SMS configurable via settings | Functional | Medium | PASS |
| TC-SMS-006 | SMS | Emergency SMS | Routine visit no SMS | Negative | High | PASS |
| TC-EML-001 | Email | Account Emails | Student account creation email | Functional | High | PASS |
| TC-EML-002 | Email | Account Emails | Adviser account creation email | Functional | High | PASS |
| TC-EML-003 | Email | Account Emails | Email only if address provided | Functional | Medium | PASS |
| TC-EML-004 | Email | Config | SMTP configuration | Functional | High | PASS |
| TC-EML-005 | Email | Config | Email error handling | Functional | High | PASS |
| TC-EML-006 | Email | Config | Email bounce handling | Functional | Low | WARNING |
| TC-AUD-001 | Audit Logging | Audit Trail | Student view logged | Functional | High | PASS |
| TC-AUD-002 | Audit Logging | Audit Trail | Student update logged | Functional | High | PASS |
| TC-AUD-003 | Audit Logging | Audit Trail | SHDF view logged | Functional | High | PASS |
| TC-AUD-004 | Audit Logging | Audit Trail | SHDF submission logged | Functional | High | PASS |
| TC-AUD-005 | Audit Logging | Audit Trail | Medical visit view logged | Functional | High | PASS |
| TC-AUD-006 | Audit Logging | Audit Trail | Medical visit creation logged | Functional | High | PASS |
| TC-AUD-007 | Audit Logging | Audit Trail | Only successful requests logged | Functional | Medium | PASS |
| TC-AUD-008 | Audit Logging | Audit Trail | User identity in log | Functional | Medium | PASS |
| TC-AUD-009 | Audit Logging | Audit Trail | Login/logout activity | Functional | High | PASS |
| TC-AUD-010 | Audit Logging | Audit Trail | View activity logs admin | Functional | Medium | PASS |
| TC-SEC-001 | Security | Auth Security | Password hashing | Security | High | PASS |
| TC-SEC-002 | Security | Auth Security | Sanctum token security | Security | High | PASS |
| TC-SEC-003 | Security | Auth Security | Token expiration | Security | High | PASS |
| TC-SEC-004 | Security | Auth Security | CORS configuration | Security | High | PASS |
| TC-SEC-005 | Security | Auth Security | SQL injection prevention | Security | High | PASS |
| TC-SEC-006 | Security | Auth Security | Input validation | Security | High | PASS |
| TC-SEC-007 | Security | Auth Security | Password hidden in responses | Security | High | PASS |
| TC-SEC-008 | Security | Access Control | API rate limiting | Security | High | PASS |
| TC-SEC-009 | Security | Access Control | 429 response on limit | Security | High | PASS |
| TC-SEC-010 | Security | Access Control | Role middleware enforcement | Security | High | PASS |
| TC-SEC-011 | Security | Access Control | Unauthenticated access | Security | High | PASS |
| TC-SEC-012 | Security | Access Control | Student cannot access admin routes | Security | High | PASS |
| TC-SEC-013 | Security | Access Control | Adviser cannot access staff routes | Security | High | PASS |
| TC-SEC-014 | Security | Access Control | SHDF authorization policy | Security | High | PASS |
| TC-SEC-015 | Security | Access Control | Inactive user blocked | Security | High | PASS |
| TC-ERR-001 | Error Handling | Auth Edge Cases | Login with empty fields | Negative | High | PASS |
| TC-ERR-002 | Error Handling | Auth Edge Cases | SQL injection attempt | Security | High | PASS |
| TC-ERR-003 | Error Handling | Auth Edge Cases | Expired token | Negative | High | PASS |
| TC-ERR-004 | Error Handling | Auth Edge Cases | Tampered token | Security | High | PASS |
| TC-ERR-005 | Error Handling | Auth Edge Cases | User with no role | Negative | High | PASS |
| TC-ERR-006 | Error Handling | Auth Edge Cases | Student with no active profile | Negative | High | PASS |
| TC-ERR-007 | Error Handling | Form Edge Cases | Special characters in form | Negative | Medium | PASS |
| TC-ERR-008 | Error Handling | Form Edge Cases | Whitespace only input | Negative | Medium | PASS |
| TC-ERR-009 | Error Handling | Form Edge Cases | Max length exceeded | Negative | Medium | PASS |
| TC-ERR-010 | Error Handling | Form Edge Cases | SHDF None + other conditions | Negative | High | PASS |
| TC-ERR-011 | Error Handling | Form Edge Cases | Rapid form submissions | Negative | Medium | PASS |
| TC-ERR-012 | Error Handling | API Edge Cases | 500 Internal Server Error | Negative | High | PASS |
| TC-ERR-013 | Error Handling | API Edge Cases | 404 Not Found | Negative | Medium | PASS |
| TC-ERR-014 | Error Handling | API Edge Cases | Slow API response | Negative | Medium | PASS |
| TC-ERR-015 | Error Handling | API Edge Cases | SMS service down | Negative | High | PASS |
| TC-ERR-016 | Error Handling | API Edge Cases | Email service down | Negative | High | PASS |
| TC-ERR-017 | Error Handling | Data Integrity | Delete section with students | Negative | High | WARNING |
| TC-ERR-018 | Error Handling | Data Integrity | Deactivate user with visits | Negative | High | PASS |
| TC-ERR-019 | Error Handling | Data Integrity | Submit SHDF without Stage 1 | Negative | High | PASS |
| TC-ERR-020 | Error Handling | Data Integrity | Duplicate student number | Negative | High | PASS |
| TC-ERR-021 | Error Handling | Data Integrity | Visit with non-existent student | Negative | High | PASS |

---

## Test Type Legend

| Type | Description |
|------|-------------|
| Functional | Verifies the feature works as specified |
| Negative | Verifies the system handles invalid input or edge cases correctly |
| Validation | Verifies input rules and constraints are enforced |
| Security | Verifies access control, authentication, and data protection |
| Integration | Verifies communication between system components and external services |
| Conditional | Verifies logic that depends on specific conditions (gender, grade level, etc.) |

## Priority Legend

| Priority | Description |
|----------|-------------|
| High | Core functionality; failure blocks system use |
| Medium | Important feature; failure degrades experience |
| Low | Minor feature; failure has minimal impact |

## Status Legend

| Status | Meaning |
|--------|---------|
| PASS | Feature works as expected |
| WARNING | Feature works but has a known limitation or recommendation |
| FAILED | Feature does not work as expected |

---

*StudentCare+ Test Matrix — Team 4seasons | PDMHS Capstone 2026*
