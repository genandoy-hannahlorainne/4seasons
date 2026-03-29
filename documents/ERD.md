erDiagram
    roles {
        tinyint role_id PK
        varchar role_name
        varchar description
    }

    users {
        int user_id PK
        tinyint role_id FK
        varchar username
        varchar password_hash
        varchar email
        varchar full_name
        varchar phone
        boolean is_active
        boolean password_must_change
        timestamp created_at
        timestamp deleted_at
    }

    advisers {
        int adviser_id PK
        int user_id FK
        varchar employee_id
        varchar department
        varchar contact_phone
        date hire_date
        boolean is_active
    }

    clinic_staff {
        int clinic_staff_id PK
        int user_id FK
        varchar staff_id
        varchar position
        varchar department
        varchar license_number
        date hire_date
        boolean is_active
    }

    grade_levels {
        bigint id PK
        int level_number
        varchar level_name
        text description
        boolean is_active
    }

    school_years {
        bigint id PK
        varchar year_name
        date start_date
        date end_date
        boolean is_active
        boolean is_current
    }

    sections {
        bigint id PK
        varchar section_name
        int section_number
        bigint grade_level_id FK
        bigint school_year_id FK
        int adviser_id FK
        int capacity
        int current_enrollment
        boolean is_active
    }

    students {
        int student_id PK
        int user_id FK
        int current_grade_level_id FK
        int current_section_id FK
        int current_adviser_id FK
        int current_school_year_id FK
        varchar student_number
        varchar first_name
        varchar middle_name
        varchar last_name
        date birth_date
        enum gender
        varchar grade_level
        varchar section
        text address
        varchar blood_type
        varchar emergency_contact
        varchar emergency_contact_phone
        varchar emergency_contact_relation
        varchar parent_guardian_name
        varchar phone
        decimal height_cm
        decimal weight_kg
        decimal bmi
        varchar bmi_category
        enum enrollment_status
        boolean is_active
        timestamp deleted_at
    }

    medical_history {
        bigint history_id PK
        int student_id FK
        boolean condition_asthma
        boolean condition_diabetes
        boolean condition_heart_problem
        boolean condition_hypertension
        boolean condition_seizure_disorder
        boolean condition_bleeding_disorder
        boolean condition_kidney_disease
        boolean condition_mental_health
        text other_conditions
        text current_medications
        text family_medical_history
        text notes
    }

    allergies {
        int allergy_id PK
        int student_id FK
        varchar allergy_name
        enum severity
        text reaction_description
        text treatment_notes
    }

    medical_visits {
        bigint visit_id PK
        int student_id FK
        int clinic_staff_id FK
        timestamp visit_datetime
        text chief_complaint
        text diagnosis
        text treatment_given
        text notes
        enum visit_type
        enum status
        boolean notify_parent
        boolean is_emergency
        date follow_up_date
    }

    vitals {
        bigint vitals_id PK
        bigint visit_id FK
        decimal temperature
        varchar blood_pressure
        int pulse_rate
        int respiratory_rate
        decimal oxygen_saturation
        decimal height_cm
        decimal weight_kg
        decimal bmi
        text notes
        timestamp recorded_at
    }

    notifications {
        bigint notification_id PK
        int student_id FK
        bigint visit_id FK
        int user_id FK
        enum channel
        text message
        enum status
        enum priority
        timestamp sent_at
        timestamp created_at
    }

    student_philhealth {
        bigint id PK
        int student_id FK
        varchar learner_philhealth_id
        varchar parent_philhealth_id
        varchar parent_philhealth_name
        enum parent_relationship
    }

    student_immunizations {
        bigint id PK
        int student_id FK
        enum bcg
        enum diphtheria_pertussis
        enum oral_polio
        enum mmr
        enum chicken_pox
        enum hepatitis_b
        enum tetanus_toxoid
        enum flu
        enum pneumococcal
    }

    student_family_history {
        bigint id PK
        int student_id FK
        boolean condition_tuberculosis
        boolean condition_cancer
        boolean condition_stroke
        boolean condition_hypertension
        boolean condition_diabetes
        boolean condition_pneumonia
        boolean condition_anxiety_depression
        boolean condition_none
        text condition_other_text
        boolean smoke_exposure
        boolean is_4ps_beneficiary
        boolean is_sbfp_beneficiary
    }

    student_parental_consent {
        bigint id PK
        int student_id FK
        bigint school_year_id FK
        boolean information_certified
        enum deworming_consent
        enum mrtd_consent
        enum wifa_consent
        varchar signature_file_path
        timestamp submitted_at
    }

    student_shdf_status {
        bigint id PK
        int student_id FK
        bigint school_year_id FK
        boolean basic_completed
        timestamp basic_completed_at
        boolean comprehensive_completed
        timestamp comprehensive_completed_at
        timestamp comprehensive_deadline
    }

    qr_codes {
        bigint id PK
        int student_id FK
        varchar qr_token
        timestamp qr_generated_at
        timestamp qr_expires_at
    }

    emergency_drills {
        bigint id PK
        int created_by FK
        varchar drill_name
        enum drill_type
        enum status
        text description
        timestamp scheduled_at
        timestamp started_at
        timestamp ended_at
        int duration_seconds
        json settings
        json statistics
    }

    drill_participants {
        bigint id PK
        bigint drill_id FK
        int student_id FK
        int rescuer_id FK
        enum role
        enum status
        text injury_simulation
        enum severity
        timestamp first_scan_at
        timestamp rescued_at
        int response_time_seconds
    }

    drill_scans {
        bigint id PK
        bigint drill_id FK
        bigint participant_id FK
        int scanned_by FK
        varchar scan_type
        timestamp scanned_at
        int seconds_from_start
        text notes
        json metadata
    }

    activity_logs {
        bigint log_id PK
        int user_id FK
        varchar action
        text details
        varchar ip_address
        timestamp created_at
    }

    audit_logs {
        bigint id PK
        bigint user_id FK
        varchar action
        varchar resource_type
        bigint resource_id
        text description
        json changes
        varchar ip_address
        timestamp created_at
    }

    system_settings {
        bigint id PK
        varchar section
        varchar key
        text value
        varchar type
    }

    roles ||--o{ users : "has"
    users ||--o| advisers : "has profile"
    users ||--o| clinic_staff : "has profile"
    users ||--o{ students : "has account"
    grade_levels ||--o{ sections : "has"
    school_years ||--o{ sections : "has"
    users ||--o{ sections : "advises"
    students }o--o| grade_levels : "current grade"
    students }o--o| sections : "current section"
    students }o--o| users : "current adviser"
    students }o--o| school_years : "current year"
    students ||--o| medical_history : "has"
    students ||--o{ allergies : "has"
    students ||--o{ medical_visits : "has"
    clinic_staff ||--o{ medical_visits : "handles"
    medical_visits ||--o{ vitals : "has"
    medical_visits ||--o{ notifications : "triggers"
    students ||--o| student_philhealth : "has"
    students ||--o| student_immunizations : "has"
    students ||--o| student_family_history : "has"
    students ||--o{ student_parental_consent : "has"
    students ||--o{ student_shdf_status : "has"
    school_years ||--o{ student_parental_consent : "for"
    school_years ||--o{ student_shdf_status : "for"
    students ||--o{ qr_codes : "has"
    users ||--o{ emergency_drills : "creates"
    emergency_drills ||--o{ drill_participants : "has"
    students ||--o{ drill_participants : "participates"
    users ||--o{ drill_participants : "rescues"
    emergency_drills ||--o{ drill_scans : "has"
    drill_participants ||--o{ drill_scans : "scanned in"
    users ||--o{ drill_scans : "scans"
    users ||--o{ activity_logs : "generates"
    users ||--o{ audit_logs : "generates"
    students ||--o{ notifications : "receives"
    users ||--o{ notifications : "receives"
