# Requirements Document

## Introduction

The Student Health Data Form (SHDF) is a structured digital health intake form for the school health management system. It collects comprehensive health information from students (or their guardians) at enrollment or annually. The form covers student identification, PhilHealth data, immunization records, medical history, family history, and parental consent — including consent for deworming, MRTD vaccination, and WIFA supplementation.

The system already stores basic student identity fields (name, LRN via `student_number`, grade level, section, date of birth, address, emergency contact name/relation/phone). The SHDF extends the system with the missing health-specific data that is not yet captured.

## Glossary

- **SHDF**: Student Health Data Form — the official school health intake form.
- **SHDF_Form**: The digital representation of a completed SHDF submission.
- **Student**: A learner enrolled in the school, identified by `student_id`.
- **Guardian**: The parent or legal guardian who provides consent on behalf of the student.
- **LRN**: Learner Reference Number — the unique national identifier for a student.
- **PhilHealth**: Philippine Health Insurance Corporation — national health insurance program.
- **Immunization_Record**: The set of vaccine statuses recorded for a student.
- **Medical_History**: The student's personal medical conditions, medications, and surgical history.
- **Family_History**: Medical conditions present in the student's immediate family.
- **Parental_Consent**: The guardian's signed agreement for health interventions.
- **MRTD**: Measles-Rubella-Tetanus-Diphtheria vaccine administered to Grade 7 students.
- **WIFA**: Weekly Iron-Folic Acid supplementation program for female students.
- **SBFP**: School-Based Feeding Program — a government nutrition program.
- **4Ps**: Pantawid Pamilyang Pilipino Program — a conditional cash transfer program.
- **PWD**: Person with Disability.
- **NKA**: No Known Allergy.
- **G6PD**: Glucose-6-Phosphate Dehydrogenase deficiency — a hereditary enzyme disorder.
- **Clinic_Staff**: School health personnel authorized to view and manage SHDF records.
- **Adviser**: A teacher assigned to a section who can view their students' SHDF submissions.
- **Form_Validator**: The backend component responsible for validating SHDF submissions.
- **File_Store**: The storage component responsible for persisting uploaded signature files.

---

## Requirements

### Requirement 1: Student Information Completion

**User Story:** As a guardian, I want to provide complete student identification details in the SHDF, so that the school can accurately identify my child and contact me in an emergency.

#### Acceptance Criteria

1. THE SHDF_Form SHALL capture the student's surname, first name, and middle name (accepting "N/A" when no middle name exists), linked to the existing student record by `student_id`.
2. THE SHDF_Form SHALL display the student's LRN, grade level, section, date of birth, and complete home address pre-populated from the existing student record.
3. THE SHDF_Form SHALL capture the name of the parent or guardian.
4. THE SHDF_Form SHALL capture the name, relationship, and cellphone number of the emergency contact person, where relationship options include: Mother, Father, Uncle, Tita, Lolo, Lola, and Other (with free-text specification).
5. WHEN a guardian submits the SHDF_Form with a missing required student information field, THE Form_Validator SHALL reject the submission and return a descriptive error identifying each missing field.
6. IF the emergency contact relationship is "Other", THEN THE SHDF_Form SHALL require a free-text specification of the relationship before submission is accepted.

---

### Requirement 2: PhilHealth Data Capture

**User Story:** As a clinic staff member, I want to record PhilHealth membership details for each student, so that the school can facilitate health insurance claims and program enrollment.

#### Acceptance Criteria

1. THE SHDF_Form SHALL capture the student's PhilHealth ID number (optional field).
2. THE SHDF_Form SHALL capture the parent's PhilHealth ID number (optional field).
3. THE SHDF_Form SHALL capture the complete name of the PhilHealth member-parent.
4. THE SHDF_Form SHALL capture the relationship of the PhilHealth member to the student, with options: Mother, Father, Other.
5. WHEN a PhilHealth ID is provided, THE Form_Validator SHALL accept only alphanumeric values of 12 characters.

---

### Requirement 3: Immunization Record

**User Story:** As a clinic staff member, I want to record each student's immunization history, so that I can identify students who need catch-up vaccinations.

#### Acceptance Criteria

1. THE SHDF_Form SHALL capture the vaccination status for each of the following vaccines: BCG, Diphtheria Pertussis, Oral Polio Vaccine, Measles-Mumps-Rubella, Chicken Pox, Hepatitis B, Tetanus Toxoid, Flu Vaccine, and Pneumococcal Vaccine.
2. THE SHDF_Form SHALL accept exactly one of three statuses per vaccine: Yes (vaccinated), No (not vaccinated), or N/A (not applicable).
3. WHEN a guardian submits the SHDF_Form without providing a status for every vaccine, THE Form_Validator SHALL reject the submission and identify which vaccine entries are missing.

---

### Requirement 4: Medical History — SHDF1 A

**User Story:** As a clinic staff member, I want to record a student's personal medical history, so that I can provide appropriate care and avoid contraindicated treatments.

#### Acceptance Criteria

1. WHERE the student's gender is female, THE SHDF_Form SHALL capture the age of menarche with options: 9, 10, 11, 12, 13, 14 years old, Not Applicable, and Other (with free-text).
2. THE SHDF_Form SHALL capture allergy status as either: Yes (has allergy — with detail captured in the existing allergies table) or NKA (No Known Allergy).
3. THE SHDF_Form SHALL capture ongoing medical conditions as a multi-select from: Error of Refraction, Asthma, Seizure (Epilepsy), Heart Problem, Anemia, Bleeding Disorder, Diabetes Mellitus, Gastric Ulcer, Anxiety/Depression, G6PD, None, and Other (with free-text specification).
4. THE SHDF_Form SHALL capture commonly administered medications as a multi-select from: Paracetamol, Mefenamic, Anti-allergy, Anti-asthma, Loperamide, Antacids, OR Solution/Hydrite, Don't give any, and Other (with free-text specification).
5. THE SHDF_Form SHALL capture PWD/Deformity status with options: Acquired, Congenital, or No/Wala.
6. IF the PWD/Deformity status is "Congenital", THEN THE SHDF_Form SHALL require a free-text field specifying the congenital condition before submission is accepted.
7. THE SHDF_Form SHALL capture whether the student has a history of surgery or hospitalization, with a Yes or No response.
8. WHEN a guardian submits the SHDF_Form with "None" selected alongside other medical conditions, THE Form_Validator SHALL reject the submission and return an error indicating that "None" cannot be combined with other condition selections.
9. WHEN a guardian submits the SHDF_Form with "Don't give any" selected alongside other medication options, THE Form_Validator SHALL reject the submission and return an error indicating that "Don't give any" cannot be combined with other medication selections.

---

### Requirement 5: Family History

**User Story:** As a clinic staff member, I want to record a student's family medical history, so that I can assess hereditary health risks.

#### Acceptance Criteria

1. THE SHDF_Form SHALL capture family medical conditions as a multi-select from: Tuberculosis, Cancer, Stroke, Hypertension/High Blood Pressure, Diabetes Mellitus, Pneumonia, Gastric Ulcer, Anxiety/Depression, None, and Other (with free-text specification).
2. THE SHDF_Form SHALL capture whether the student is exposed to cigarette or vape smoke at home, with a Yes or No response.
3. THE SHDF_Form SHALL capture whether the student's family is a 4Ps beneficiary, with a Yes or No response.
4. THE SHDF_Form SHALL capture whether the student is an SBFP beneficiary, with a Yes or No response.
5. WHEN a guardian submits the SHDF_Form with "None" selected alongside other family medical conditions, THE Form_Validator SHALL reject the submission and return an error indicating that "None" cannot be combined with other condition selections.

---

### Requirement 6: Parental Consent

**User Story:** As a guardian, I want to provide informed consent for health interventions, so that the school has my authorization before administering treatments to my child.

#### Acceptance Criteria

1. THE SHDF_Form SHALL require the guardian to certify that all provided information is correct before the form can be submitted.
2. THE SHDF_Form SHALL capture deworming consent with options: Oo (Yes) or Hindi (No).
3. IF deworming consent is "Hindi", THEN THE SHDF_Form SHALL require the guardian to select a reason from: Takot, Regular sa Pribadong Institusyon, Nabigyan na sa Barangay Health Center, May Allergy o Reaksiyon, or Other (with free-text specification).
4. WHERE the student's grade level is Grade 7, THE SHDF_Form SHALL capture MRTD vaccine consent with options: Oo or Hindi.
5. WHERE the student's grade level is Grade 8, Grade 9, or Grade 10, THE SHDF_Form SHALL display the MRTD consent field as "Not Applicable" and SHALL NOT require a consent selection.
6. WHERE the student's gender is female, THE SHDF_Form SHALL capture WIFA (Folic Acid) consent with options: Oo or Hindi.
7. WHERE the student's gender is male, THE SHDF_Form SHALL display the WIFA consent field as "Not Applicable (Lalake)" and SHALL NOT require a consent selection.
8. THE SHDF_Form SHALL accept a guardian signature upload in PDF or image format (JPEG, PNG) with a maximum file size of 100 MB.
9. WHEN a guardian submits the SHDF_Form without the information certification checkbox checked, THE Form_Validator SHALL reject the submission.
10. WHEN a guardian submits the SHDF_Form without a signature file, THE Form_Validator SHALL reject the submission.
11. WHEN a guardian uploads a signature file exceeding 100 MB, THE Form_Validator SHALL reject the file and return an error stating the maximum allowed size.
12. WHEN a guardian uploads a signature file in an unsupported format, THE Form_Validator SHALL reject the file and return an error listing the accepted formats.
13. WHEN a valid signature file is uploaded, THE File_Store SHALL persist the file and associate it with the SHDF_Form record.

---

### Requirement 7: Form Submission and Persistence

**User Story:** As a guardian, I want to submit the SHDF once and have it saved, so that the school retains my child's health information for the school year.

#### Acceptance Criteria

1. WHEN a guardian submits a valid SHDF_Form, THE SHDF_Form SHALL be persisted to the database and associated with the student's `student_id` and the current school year.
2. THE SHDF_Form SHALL record the submission timestamp at the time of successful save.
3. WHEN a student already has a submitted SHDF_Form for the current school year, THE SHDF_Form SHALL allow the guardian to update the existing record rather than creating a duplicate.
4. WHEN a guardian submits a valid SHDF_Form, THE SHDF_Form SHALL return a success response confirming the submission.
5. IF a database error occurs during SHDF_Form persistence, THEN THE SHDF_Form SHALL return an error response and SHALL NOT partially save the record (atomic operation).

---

### Requirement 8: Access Control

**User Story:** As a clinic staff member or adviser, I want to view submitted SHDF records for students under my care, so that I can provide informed health support.

#### Acceptance Criteria

1. WHILE a user has the Clinic_Staff role, THE System SHALL allow the user to view any student's submitted SHDF_Form.
2. WHILE a user has the Adviser role, THE System SHALL allow the user to view SHDF_Form records only for students assigned to their section.
3. WHILE a user has the Student role, THE System SHALL allow the user to view and submit only their own SHDF_Form.
4. IF a user attempts to access an SHDF_Form record they are not authorized to view, THEN THE System SHALL return a 403 Forbidden response.
5. THE System SHALL require authentication for all SHDF_Form endpoints.

---

### Requirement 9: New Database Fields

**User Story:** As a developer, I want the database to store all SHDF-specific fields not already captured in existing tables, so that no data is lost and no existing schema is duplicated.

#### Acceptance Criteria

1. THE System SHALL add the following new fields to the `students` table (fields not already present): `parent_guardian_name`.
2. THE System SHALL create a new `student_philhealth` table with fields: `student_id`, `learner_philhealth_id`, `parent_philhealth_id`, `parent_philhealth_name`, `parent_relationship`.
3. THE System SHALL create a new `student_immunizations` table with one nullable enum column per vaccine (BCG, Diphtheria_Pertussis, Oral_Polio, MMR, Chicken_Pox, Hepatitis_B, Tetanus_Toxoid, Flu, Pneumococcal), each accepting values: `yes`, `no`, `na`.
4. THE System SHALL extend the `medical_history` table with the following new fields not already present: `menarche_age`, `allergy_status` (yes/nka), `condition_error_of_refraction`, `condition_anemia`, `condition_gastric_ulcer`, `condition_g6pd`, `condition_anxiety_depression`, `condition_none`, `condition_other_text`, `medications_paracetamol`, `medications_mefenamic`, `medications_anti_allergy`, `medications_anti_asthma`, `medications_loperamide`, `medications_antacids`, `medications_or_solution`, `medications_none`, `medications_other_text`, `pwd_status` (acquired/congenital/none), `pwd_congenital_detail`, `surgery_history`.
5. THE System SHALL create a new `student_family_history` table with fields: `student_id`, `condition_tuberculosis`, `condition_cancer`, `condition_stroke`, `condition_hypertension`, `condition_diabetes`, `condition_pneumonia`, `condition_gastric_ulcer`, `condition_anxiety_depression`, `condition_none`, `condition_other_text`, `smoke_exposure`, `is_4ps_beneficiary`, `is_sbfp_beneficiary`.
6. THE System SHALL create a new `student_parental_consent` table with fields: `student_id`, `school_year_id`, `information_certified`, `deworming_consent`, `deworming_refusal_reason`, `deworming_refusal_other`, `mrtd_consent`, `wifa_consent`, `signature_file_path`, `signature_file_type`, `submitted_at`.
7. WHEN a migration is run, THE System SHALL apply all new schema changes without modifying or dropping existing columns in the `students`, `medical_history`, or `allergies` tables.
