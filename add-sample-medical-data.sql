-- Add sample medical data for testing the medical records feature

-- First, let's add users for clinic staff
INSERT INTO users (role_id, username, password_hash, email, phone, full_name, created_at, updated_at, is_active) VALUES
(4, 'nurse.santos', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'nurse.santos@school.edu', '09123456789', 'Maria Santos', NOW(), NOW(), 1),
(4, 'dr.reyes', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'dr.reyes@school.edu', '09987654321', 'Dr. Juan Reyes', NOW(), NOW(), 1);

-- Get the user IDs we just created
SET @nurse_user_id = (SELECT id FROM users WHERE username = 'nurse.santos');
SET @doctor_user_id = (SELECT id FROM users WHERE username = 'dr.reyes');

-- Add clinic staff records linked to users
INSERT INTO clinic_staff (user_id, staff_code, position, created_at, is_active) VALUES
(@nurse_user_id, 'NURSE001', 'School Nurse', NOW(), 1),
(@doctor_user_id, 'DOC001', 'School Doctor', NOW(), 1);

-- Add some allergies for existing students
INSERT INTO allergies (student_id, allergy_text, severity, recorded_at) VALUES
(1, 'Peanuts', 'Severe', '2024-01-15'),
(1, 'Shellfish', 'Moderate', '2024-01-15'),
(2, 'Dust mites', 'Mild', '2024-02-01'),
(3, 'Pollen', 'Moderate', '2024-01-20');

-- Add some immunization records
INSERT INTO immunizations (student_id, vaccine_name, date_administered, administered_by, notes) VALUES
(1, 'Hepatitis B', '2023-06-15', 'Dr. Smith', 'First dose'),
(1, 'MMR', '2023-07-20', 'Nurse Johnson', 'Complete'),
(2, 'Tetanus', '2023-08-10', 'Dr. Brown', 'Booster shot'),
(3, 'Flu Vaccine', '2023-10-15', 'Nurse Wilson', 'Annual vaccination');

-- Add some medical visits
INSERT INTO medical_visits (student_id, clinic_staff_id, visit_datetime, visit_type, chief_complaint, notes, status, created_at) VALUES
(1, 1, '2024-03-15 10:30:00', 'Routine', 'Headache and fever', 'Temperature 38.5°C. Advised rest and hydration. Paracetamol given.', 'Closed', NOW()),
(1, 2, '2024-03-10 14:15:00', 'Emergency', 'Allergic reaction', 'Mild allergic reaction to unknown allergen. Antihistamine administered. Symptoms resolved.', 'Closed', NOW()),
(2, 1, '2024-03-12 09:45:00', 'Follow-up', 'Asthma check-up', 'Regular asthma monitoring. Inhaler technique reviewed. No acute symptoms.', 'Closed', NOW()),
(3, 1, '2024-03-14 11:20:00', 'Routine', 'Stomach ache', 'Mild abdominal pain. No fever. Advised to avoid spicy foods and return if symptoms persist.', 'Closed', NOW()),
(1, 1, '2024-03-20 13:00:00', 'Routine', 'Minor cut on hand', 'Small laceration on left hand. Cleaned and bandaged. Tetanus status up to date.', 'Closed', NOW());

-- Update some students with additional medical information
UPDATE students SET 
    blood_type = 'O+',
    emergency_contact = 'Mother: Maria Santos - 09123456789, Father: Juan Santos - 09987654321',
    address = '123 Main Street, Barangay San Jose, Quezon City'
WHERE student_id = 1;

UPDATE students SET 
    blood_type = 'A+',
    emergency_contact = 'Guardian: Lola Rosa - 09111222333',
    address = '456 Oak Avenue, Barangay Maligaya, Manila'
WHERE student_id = 2;

UPDATE students SET 
    blood_type = 'B-',
    emergency_contact = 'Mother: Ana Cruz - 09444555666',
    address = '789 Pine Road, Barangay Bagong Silang, Caloocan'
WHERE student_id = 3;