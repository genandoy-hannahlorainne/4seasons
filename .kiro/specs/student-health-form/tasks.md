# Implementation Plan: Student Health Data Form (SHDF)

## Overview

Implement the SHDF feature as a Laravel 11 REST API with an Angular frontend. Work proceeds in layers: migrations → models → validation → service → policy → controller/routes → frontend → tests.

## Tasks

- [x] 1. Database migrations
  - [x] 1.1 Create migration `add_parent_guardian_name_to_students_table`
    - Add `parent_guardian_name VARCHAR(150) NULL` to `students` table
    - Must not drop or modify any existing column
    - _Requirements: 9.1, 9.7_

  - [x] 1.2 Create migration `add_shdf_fields_to_medical_history_table`
    - Add all new columns listed in the design: `menarche_age`, `menarche_age_other`, `allergy_status` enum, all `condition_*` booleans, all `medications_*` booleans, `pwd_status` enum, `pwd_congenital_detail`, `surgery_history`
    - Must not drop or modify any existing column
    - _Requirements: 9.4, 9.7_

  - [x] 1.3 Create migration `create_student_philhealth_table`
    - Fields: `id`, `student_id` (unique FK), `learner_philhealth_id`, `parent_philhealth_id`, `parent_philhealth_name`, `parent_relationship` enum, timestamps
    - _Requirements: 9.2_

  - [x] 1.4 Create migration `create_student_immunizations_table`
    - Fields: `id`, `student_id` (unique FK), nine vaccine enum columns (`yes/no/na`), timestamps
    - _Requirements: 9.3_

  - [x] 1.5 Create migration `create_student_family_history_table`
    - Fields: `id`, `student_id` (unique FK), all `condition_*` booleans, `smoke_exposure`, `is_4ps_beneficiary`, `is_sbfp_beneficiary`, `condition_other_text`, timestamps
    - _Requirements: 9.5_

  - [x] 1.6 Create migration `create_student_parental_consent_table`
    - Fields: `id`, `student_id` (FK), `school_year_id` (FK), `information_certified`, `deworming_consent` enum, `deworming_refusal_reason` enum, `deworming_refusal_other`, `mrtd_consent` enum, `wifa_consent` enum, `signature_file_path`, `signature_file_type`, `submitted_at`
    - Add unique constraint on `(student_id, school_year_id)`
    - _Requirements: 9.6_

- [x] 2. Eloquent models
  - [x] 2.1 Create `App\Models\StudentPhilhealth`
    - Set `$fillable` for all columns, `belongsTo(Student::class)` relationship
    - _Requirements: 9.2_

  - [x] 2.2 Create `App\Models\StudentImmunization`
    - Set `$fillable` for all nine vaccine columns, `belongsTo(Student::class)` relationship
    - _Requirements: 9.3_

  - [x] 2.3 Create `App\Models\StudentFamilyHistory`
    - Set `$fillable`, boolean casts for all condition/flag columns, `belongsTo(Student::class)` relationship
    - _Requirements: 9.5_

  - [x] 2.4 Create `App\Models\StudentParentalConsent`
    - Set `$fillable`, cast `information_certified` to boolean, cast `submitted_at` to datetime, `belongsTo(Student::class)` and `belongsTo(SchoolYear::class)` relationships
    - _Requirements: 9.6_

  - [x] 2.5 Update `App\Models\Student` and `App\Models\MedicalHistory`
    - Add `parent_guardian_name` to `Student::$fillable`
    - Add all new SHDF columns to `MedicalHistory::$fillable` and add boolean casts for the new boolean columns
    - Add `hasOne` relationships on `Student` for `StudentPhilhealth`, `StudentImmunization`, `StudentFamilyHistory`, and `hasMany` for `StudentParentalConsent`
    - _Requirements: 9.1, 9.4_

- [x] 3. File storage configuration
  - [x] 3.1 Add `signatures` disk to `config/filesystems.php`
    - Driver: `local`, root: `storage_path('app/signatures')`, visibility: `private`
    - Add `.env` keys `SIGNATURES_DRIVER`, `SIGNATURES_BUCKET` for production S3 swap
    - _Requirements: 6.13_

- [x] 4. SHDFFormRequest validation
  - [x] 4.1 Create `App\Http\Requests\SHDFFormRequest`
    - Implement `authorize()` delegating to `SHDFPolicy`
    - Implement `rules()` with all field groups: student identity, PhilHealth (nullable 12-char alphanumeric regex), immunization enums (all nine required), medical history (enums, booleans, conditional fields), family history booleans, parental consent (conditional by gender/grade), signature file (`required|file|mimes:pdf,jpeg,png|max:102400`)
    - _Requirements: 1.5, 2.5, 3.3, 4.1, 4.6, 6.9, 6.10, 6.11, 6.12_

  - [x] 4.2 Add cross-field validation in `SHDFFormRequest::after()`
    - "None" exclusivity for medical conditions (Property 7)
    - "None" exclusivity for medications (Property 8)
    - "None" exclusivity for family conditions (Property 9)
    - Emergency contact "Other" requires free-text (Property 2)
    - PWD congenital requires detail (Property 6)
    - Deworming refusal reason required when consent is "hindi" (Property 11)
    - MRTD consent required for Grade 7 (Property 12)
    - WIFA consent required for female students (Property 13)
    - _Requirements: 1.6, 4.6, 4.8, 4.9, 5.5, 6.3, 6.4, 6.6_

- [x] 5. SHDFService
  - [x] 5.1 Create `App\Services\SHDFService` with `upsert(array $validated, ?UploadedFile $signature): array`
    - Wrap all writes in `DB::transaction()`
    - Upsert `students.parent_guardian_name`
    - Upsert `student_philhealth`, `student_immunizations`, `student_family_history` via `updateOrCreate`
    - Upsert `medical_history` additive columns via `updateOrCreate`
    - For `student_parental_consent`: if existing record found for `(student_id, school_year_id)`, delete old signature file from `signatures` disk, then `updateOrCreate`
    - Store new signature file at `signatures/{student_id}/{school_year_id}/{uuid}.{ext}` and save path
    - Set `submitted_at` to `now()`
    - On exception: roll back transaction and re-throw
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 6.13_

- [x] 6. SHDFPolicy
  - [x] 6.1 Create `App\Policies\SHDFPolicy` with `view(User $user, Student $student): bool` and `submit(User $user, Student $student): bool`
    - `clinic_staff` role → always `true`
    - `adviser` role → `true` only if `$student->current_adviser_id === $user->id`
    - `student` role → `true` only if `$student->user_id === $user->id`
    - All other cases → `false`
    - Register policy in `AuthServiceProvider`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 7. SHDFController and routes
  - [x] 7.1 Create `App\Http\Controllers\SHDFController` with `show`, `store`, and `showByYear` methods
    - `show(int $student_id)`: authorize view, call service to fetch composite SHDF record for current school year, return JSON
    - `store(SHDFFormRequest $request)`: call `SHDFService::upsert`, return 200 JSON on success, 500 JSON on caught exception
    - `showByYear(int $student_id, int $school_year_id)`: authorize view, fetch for specific school year, return JSON
    - _Requirements: 7.4, 8.5_

  - [x] 7.2 Register SHDF routes in `routes/api.php`
    - All three routes under `auth:sanctum` middleware
    - `GET /api/shdf/{student_id}`, `POST /api/shdf`, `GET /api/shdf/{student_id}/{school_year_id}`
    - _Requirements: 8.5_

- [x] 8. Checkpoint — backend wired
  - Ensure all migrations run cleanly, models resolve, routes are registered, and a basic Tinker smoke test can instantiate `SHDFService`. Ask the user if questions arise.

- [x] 9. Angular SHDF form component
  - [x] 9.1 Create `SHDFFormComponent` in `frontend/src/app/features/shdf/`
    - Reactive form with all SHDF sections: student info (pre-populated read-only fields), PhilHealth, immunizations, medical history, family history, parental consent
    - Conditional field visibility: menarche age (female only), MRTD consent (Grade 7 only), WIFA consent (female only)
    - File input for signature (accept `application/pdf,image/jpeg,image/png`)
    - _Requirements: 1.1–1.4, 2.1–2.4, 3.1–3.2, 4.1–4.7, 5.1–5.4, 6.1–6.8_

  - [x] 9.2 Add client-side cross-field validators to the Angular form
    - "None" exclusivity for medical conditions, medications, and family conditions
    - Emergency contact "Other" requires free-text
    - PWD congenital requires detail
    - Deworming refusal reason required when consent is "Hindi"
    - _Requirements: 1.6, 4.6, 4.8, 4.9, 5.5, 6.3_

  - [x] 9.3 Create `SHDFService` Angular service in `frontend/src/app/features/shdf/`
    - `getShdf(studentId: number): Observable<SHDFRecord>`
    - `submitShdf(payload: FormData): Observable<SHDFRecord>`
    - Wire to `SHDFFormComponent` for load-on-init and form submit
    - _Requirements: 7.1, 7.4_

  - [x] 9.4 Add route and navigation entry for SHDF form
    - Lazy-loaded route in the features routing module
    - _Requirements: 8.3_

- [x] 10. PHPUnit feature tests
  - [x] 10.1 Create `tests/Feature/SHDF/SHDFSubmissionTest.php`
    - Happy path: submit complete valid payload, assert 200, assert all five DB tables have correct data, assert `submitted_at` is set
    - Upsert: submit twice with different data, assert single `student_parental_consent` row with updated values
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 10.2 Write property test for submission round-trip (Property 16)
    - **Property 16: SHDF submission round-trip**
    - **Validates: Requirements 7.1, 7.4**
    - Generate random valid SHDF payloads, submit, re-fetch, assert equivalence

  - [x] 10.3 Write property test for upsert uniqueness (Property 18)
    - **Property 18: Upsert — no duplicate per student and school year**
    - **Validates: Requirements 7.3**
    - Submit same student/school_year twice with varied data, assert exactly one `student_parental_consent` row

  - [x] 10.4 Create `tests/Feature/SHDF/SHDFValidationTest.php`
    - One test per required field: assert 422 when field is missing
    - "None" exclusivity for conditions, medications, family conditions
    - Emergency contact "Other" without free-text
    - PWD congenital without detail
    - Deworming "hindi" without refusal reason
    - MRTD required for Grade 7, not required for other grades
    - WIFA required for female, not required for male
    - _Requirements: 1.5, 1.6, 3.3, 4.6, 4.8, 4.9, 5.5, 6.3, 6.4, 6.6, 6.9_

  - [x] 10.5 Write property test for required field rejection (Property 1)
    - **Property 1: Required field rejection**
    - **Validates: Requirements 1.3, 1.4, 1.5, 6.1, 6.10**
    - Generate payloads with random required fields omitted, assert 422 with correct error keys

  - [x] 10.6 Write property test for PhilHealth ID format (Property 3)
    - **Property 3: PhilHealth ID format**
    - **Validates: Requirements 2.5**
    - Generate random strings; assert only 12-char alphanumeric pass; all others rejected

  - [x] 10.7 Write property test for immunization enum (Property 4)
    - **Property 4: Immunization status required and enum-constrained**
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - Generate vaccine field sets with missing/invalid values; assert rejection

  - [x] 10.8 Write property test for condition exclusivity (Properties 7, 8, 9)
    - **Property 7: Medical condition "None" exclusivity**
    - **Property 8: Medication "None" exclusivity**
    - **Property 9: Family history "None" exclusivity**
    - **Validates: Requirements 4.8, 4.9, 5.5**
    - Generate random boolean combinations with `*_none=true` and other flags true; assert rejection

  - [x] 10.9 Create `tests/Feature/SHDF/SHDFFileUploadTest.php`
    - Valid PDF upload: assert 200 and `signature_file_path` stored
    - Valid PNG upload: assert 200
    - Oversized file (>100 MB): assert 422
    - Wrong MIME type: assert 422
    - Missing signature: assert 422
    - _Requirements: 6.8, 6.10, 6.11, 6.12, 6.13_

  - [x] 10.10 Write property test for signature file validation (Property 14)
    - **Property 14: Signature file validation**
    - **Validates: Requirements 6.8, 6.10, 6.11, 6.12**
    - Generate random file sizes and MIME types; assert acceptance/rejection boundary

  - [x] 10.11 Create `tests/Feature/SHDF/SHDFAccessControlTest.php`
    - Unauthenticated request → 401
    - `clinic_staff` can view any student's SHDF
    - `adviser` can view own-section student, gets 403 for other-section student
    - `student` can view and submit own SHDF, gets 403 for another student's SHDF
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 10.12 Write property test for clinic_staff access (Property 20)
    - **Property 20: Clinic staff can view any student's SHDF**
    - **Validates: Requirements 8.1**
    - Generate random clinic_staff users and student IDs; assert policy always returns true

  - [x] 10.13 Write property test for adviser access (Property 21)
    - **Property 21: Adviser access scoped to own section**
    - **Validates: Requirements 8.2, 8.4**
    - Generate random adviser/student pairs; assert policy result matches section ownership

  - [x] 10.14 Write property test for student access (Property 22)
    - **Property 22: Student access scoped to own record**
    - **Validates: Requirements 8.3, 8.4**
    - Generate random student users and student records; assert policy result matches `user_id`

  - [x] 10.15 Create `tests/Feature/SHDF/SHDFTransactionTest.php`
    - Mock a DB failure mid-save inside `SHDFService::upsert`
    - Assert 500 response and that no partial rows exist in any SHDF table
    - _Requirements: 7.5_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Run `php artisan test --filter=SHDF` and confirm all non-optional tests pass. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use Eris or a Pest-compatible generator and run a minimum of 100 iterations each
- All migrations are additive only — no existing columns are dropped or modified
- The `signatures` disk is `private`; files are never served directly via public URL
```
