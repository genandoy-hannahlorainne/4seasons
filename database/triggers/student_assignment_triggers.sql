-- Student Assignment Maintenance Triggers
-- These triggers help maintain data integrity for student-adviser assignments

-- Trigger 1: Auto-assign student when section is updated
DELIMITER $$

CREATE TRIGGER after_student_section_update
AFTER UPDATE ON students
FOR EACH ROW
BEGIN
    -- If section was updated but adviser is not set, try to auto-assign
    IF NEW.current_section_id != OLD.current_section_id 
       AND NEW.current_section_id IS NOT NULL 
       AND (NEW.current_adviser_id IS NULL OR NEW.current_adviser_id = 0) THEN
        
        -- Get the adviser for the new section
        SET @section_adviser_id = (
            SELECT adviser_id 
            FROM sections 
            WHERE id = NEW.current_section_id 
            AND is_active = 1 
            AND adviser_id IS NOT NULL
        );
        
        -- Update student's adviser if section has one
        IF @section_adviser_id IS NOT NULL THEN
            UPDATE students 
            SET current_adviser_id = @section_adviser_id 
            WHERE student_id = NEW.student_id;
        END IF;
    END IF;
END$$

-- Trigger 2: Update section enrollment when student is assigned/unassigned
CREATE TRIGGER after_student_section_assign
AFTER UPDATE ON students
FOR EACH ROW
BEGIN
    -- If student was moved from one section to another
    IF OLD.current_section_id != NEW.current_section_id THEN
        
        -- Decrease enrollment in old section
        IF OLD.current_section_id IS NOT NULL AND OLD.current_section_id > 0 THEN
            UPDATE sections 
            SET current_enrollment = GREATEST(0, current_enrollment - 1)
            WHERE id = OLD.current_section_id;
        END IF;
        
        -- Increase enrollment in new section
        IF NEW.current_section_id IS NOT NULL AND NEW.current_section_id > 0 THEN
            UPDATE sections 
            SET current_enrollment = current_enrollment + 1
            WHERE id = NEW.current_section_id;
        END IF;
    END IF;
END$$

-- Trigger 3: Clean up assignments when student is deactivated
CREATE TRIGGER after_student_deactivate
AFTER UPDATE ON students
FOR EACH ROW
BEGIN
    -- If student was deactivated, decrease section enrollment
    IF OLD.is_active = 1 AND NEW.is_active = 0 THEN
        IF NEW.current_section_id IS NOT NULL AND NEW.current_section_id > 0 THEN
            UPDATE sections 
            SET current_enrollment = GREATEST(0, current_enrollment - 1)
            WHERE id = NEW.current_section_id;
        END IF;
    END IF;
    
    -- If student was reactivated, increase section enrollment
    IF OLD.is_active = 0 AND NEW.is_active = 1 THEN
        IF NEW.current_section_id IS NOT NULL AND NEW.current_section_id > 0 THEN
            UPDATE sections 
            SET current_enrollment = current_enrollment + 1
            WHERE id = NEW.current_section_id;
        END IF;
    END IF;
END$$

-- Trigger 4: Handle adviser changes in sections
CREATE TRIGGER after_section_adviser_update
AFTER UPDATE ON sections
FOR EACH ROW
BEGIN
    -- If section's adviser changed, update all students in that section
    IF OLD.adviser_id != NEW.adviser_id THEN
        UPDATE students 
        SET current_adviser_id = NEW.adviser_id
        WHERE current_section_id = NEW.id 
        AND is_active = 1;
    END IF;
END$$

-- Trigger 5: Handle adviser deactivation
CREATE TRIGGER after_adviser_deactivate
AFTER UPDATE ON advisers
FOR EACH ROW
BEGIN
    -- If adviser was deactivated, clear their assignments
    IF OLD.is_active = 1 AND NEW.is_active = 0 THEN
        -- Clear students assigned to this adviser
        UPDATE students 
        SET current_adviser_id = NULL
        WHERE current_adviser_id = NEW.user_id 
        AND is_active = 1;
        
        -- Clear sections assigned to this adviser
        UPDATE sections 
        SET adviser_id = NULL
        WHERE adviser_id = NEW.user_id 
        AND is_active = 1;
    END IF;
END$$

DELIMITER ;

-- Create a stored procedure to fix all assignments
DELIMITER $$

CREATE PROCEDURE FixAllStudentAssignments()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE student_id INT;
    DECLARE student_grade INT;
    DECLARE section_id INT;
    DECLARE adviser_id INT;
    
    -- Cursor for unassigned students
    DECLARE student_cursor CURSOR FOR
        SELECT s.student_id, s.grade_level
        FROM students s
        WHERE s.is_active = 1 
        AND (s.current_adviser_id IS NULL OR s.current_adviser_id = 0);
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    START TRANSACTION;
    
    OPEN student_cursor;
    
    student_loop: LOOP
        FETCH student_cursor INTO student_id, student_grade;
        IF done THEN
            LEAVE student_loop;
        END IF;
        
        -- Convert grade level if needed (1-6 to 7-12)
        IF student_grade >= 1 AND student_grade <= 6 THEN
            SET student_grade = student_grade + 6;
        END IF;
        
        -- Find best available section for this grade
        SELECT s.id, s.adviser_id INTO section_id, adviser_id
        FROM sections s
        INNER JOIN grade_levels gl ON s.grade_level_id = gl.id
        WHERE gl.level_number = student_grade
        AND s.is_active = 1
        AND s.adviser_id IS NOT NULL
        AND s.current_enrollment < s.capacity
        ORDER BY s.current_enrollment ASC
        LIMIT 1;
        
        -- If suitable section found, assign student
        IF section_id IS NOT NULL AND adviser_id IS NOT NULL THEN
            UPDATE students 
            SET current_section_id = section_id,
                current_adviser_id = adviser_id,
                grade_level = student_grade,
                section = (SELECT section_name FROM sections WHERE id = section_id)
            WHERE students.student_id = student_id;
            
            -- Update section enrollment
            UPDATE sections 
            SET current_enrollment = current_enrollment + 1
            WHERE id = section_id;
        END IF;
        
        -- Reset variables
        SET section_id = NULL;
        SET adviser_id = NULL;
    END LOOP;
    
    CLOSE student_cursor;
    COMMIT;
END$$

DELIMITER ;

-- Create a function to check assignment health
DELIMITER $$

CREATE FUNCTION GetAssignmentHealthScore() RETURNS DECIMAL(5,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE total_students INT DEFAULT 0;
    DECLARE assigned_students INT DEFAULT 0;
    DECLARE health_score DECIMAL(5,2) DEFAULT 0.00;
    
    SELECT COUNT(*) INTO total_students
    FROM students 
    WHERE is_active = 1;
    
    SELECT COUNT(*) INTO assigned_students
    FROM students 
    WHERE is_active = 1 
    AND current_adviser_id IS NOT NULL 
    AND current_adviser_id > 0;
    
    IF total_students > 0 THEN
        SET health_score = (assigned_students / total_students) * 100;
    END IF;
    
    RETURN health_score;
END$$

DELIMITER ;