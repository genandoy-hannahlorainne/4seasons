-- Enhancement for students table to support physical information
-- Add height, weight, and BMI fields

ALTER TABLE `students` 
ADD COLUMN `height_cm` DECIMAL(5,2) DEFAULT NULL COMMENT 'Height in centimeters',
ADD COLUMN `weight_kg` DECIMAL(5,2) DEFAULT NULL COMMENT 'Weight in kilograms',
ADD COLUMN `bmi` DECIMAL(4,2) DEFAULT NULL COMMENT 'Body Mass Index',
ADD COLUMN `bmi_category` VARCHAR(20) DEFAULT NULL COMMENT 'BMI Category (Underweight, Normal, Overweight, Obese)',
ADD COLUMN `last_physical_update` TIMESTAMP NULL DEFAULT NULL COMMENT 'Last time physical info was updated';

-- Add index for better performance
ALTER TABLE `students`
ADD KEY `idx_students_physical` (`height_cm`, `weight_kg`, `bmi`);

-- Update existing records with sample data (optional - for testing)
-- UPDATE students SET height_cm = 165.0, weight_kg = 55.0, bmi = 20.2, bmi_category = 'Normal weight' WHERE student_id = 1;