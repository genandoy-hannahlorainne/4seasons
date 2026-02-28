-- Clean up sections table to match proper school structure
-- Remove all existing sections first
DELETE FROM sections;

-- Reset auto increment
ALTER TABLE sections AUTO_INCREMENT = 1;

-- Get the current active school year ID
SET @current_school_year = (SELECT id FROM school_years WHERE is_current = 1 LIMIT 1);

-- Insert clean sections data for current school year
-- Grade 7 (grade_level_id = 1) - 3 sections
INSERT INTO sections (section_name, grade_level_id, school_year_id, capacity, current_enrollment, is_active, created_at) VALUES
('Mapagmahal', 1, @current_school_year, 50, 0, 1, NOW()),
('Matatag', 1, @current_school_year, 50, 0, 1, NOW()),
('Masigasig', 1, @current_school_year, 50, 0, 1, NOW());

-- Grade 8 (grade_level_id = 2) - 3 sections  
INSERT INTO sections (section_name, grade_level_id, school_year_id, capacity, current_enrollment, is_active, created_at) VALUES
('Mapagmahal', 2, @current_school_year, 50, 0, 1, NOW()),
('Matatag', 2, @current_school_year, 50, 0, 1, NOW()),
('Masigasig', 2, @current_school_year, 50, 0, 1, NOW());

-- Grade 9 (grade_level_id = 3) - 3 sections
INSERT INTO sections (section_name, grade_level_id, school_year_id, capacity, current_enrollment, is_active, created_at) VALUES
('Mapagmahal', 3, @current_school_year, 50, 0, 1, NOW()),
('Matatag', 3, @current_school_year, 50, 0, 1, NOW()),
('Masigasig', 3, @current_school_year, 50, 0, 1, NOW());

-- Grade 10 (grade_level_id = 4) - 3 sections
INSERT INTO sections (section_name, grade_level_id, school_year_id, capacity, current_enrollment, is_active, created_at) VALUES
('Mapagmahal', 4, @current_school_year, 50, 0, 1, NOW()),
('Matatag', 4, @current_school_year, 50, 0, 1, NOW()),
('Masigasig', 4, @current_school_year, 50, 0, 1, NOW());

-- Grade 11 (grade_level_id = 5) - 2 sections per strand
INSERT INTO sections (section_name, grade_level_id, school_year_id, capacity, current_enrollment, is_active, created_at) VALUES
('STEM 1', 5, @current_school_year, 50, 0, 1, NOW()),
('STEM 2', 5, @current_school_year, 50, 0, 1, NOW()),
('ABM 1', 5, @current_school_year, 50, 0, 1, NOW()),
('ABM 2', 5, @current_school_year, 50, 0, 1, NOW()),
('HUMSS 1', 5, @current_school_year, 50, 0, 1, NOW()),
('HUMSS 2', 5, @current_school_year, 50, 0, 1, NOW()),
('TVL-HE 1', 5, @current_school_year, 50, 0, 1, NOW()),
('TVL-HE 2', 5, @current_school_year, 50, 0, 1, NOW()),
('TVL-EIM 1', 5, @current_school_year, 50, 0, 1, NOW()),
('TVL-EIM 2', 5, @current_school_year, 50, 0, 1, NOW());

-- Grade 12 (grade_level_id = 6) - 2 sections per strand
INSERT INTO sections (section_name, grade_level_id, school_year_id, capacity, current_enrollment, is_active, created_at) VALUES
('STEM 1', 6, @current_school_year, 50, 0, 1, NOW()),
('STEM 2', 6, @current_school_year, 50, 0, 1, NOW()),
('ABM 1', 6, @current_school_year, 50, 0, 1, NOW()),
('ABM 2', 6, @current_school_year, 50, 0, 1, NOW()),
('HUMSS 1', 6, @current_school_year, 50, 0, 1, NOW()),
('HUMSS 2', 6, @current_school_year, 50, 0, 1, NOW()),
('TVL-HE 1', 6, @current_school_year, 50, 0, 1, NOW()),
('TVL-HE 2', 6, @current_school_year, 50, 0, 1, NOW()),
('TVL-EIM 1', 6, @current_school_year, 50, 0, 1, NOW()),
('TVL-EIM 2', 6, @current_school_year, 50, 0, 1, NOW());

-- Update existing students to use the new section IDs if needed
-- This will need to be done carefully to maintain data integrity

-- Show the cleaned sections
SELECT 
    s.id,
    s.section_name,
    gl.level_name as grade_level,
    sy.year_name as school_year,
    s.capacity,
    s.current_enrollment,
    s.is_active
FROM sections s
JOIN grade_levels gl ON s.grade_level_id = gl.id
JOIN school_years sy ON s.school_year_id = sy.id
ORDER BY gl.level_number, s.section_name;