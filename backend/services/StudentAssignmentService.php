<?php
/**
 * Student Assignment Service
 * Handles all student-adviser assignment logic
 * Used by various parts of the system to ensure consistent assignments
 */

class StudentAssignmentService {
    private $db;
    
    public function __construct($database) {
        $this->db = $database->getConnection();
    }
    
    /**
     * Auto-assign a student to the best available adviser
     * Called when creating new students or when assignments need fixing
     */
    public function autoAssignStudent($studentId, $gradeLevel = null, $preferredSectionId = null) {
        try {
            // Get student details
            $studentQuery = "
                SELECT student_id, user_id, student_number, 
                       CONCAT(first_name, ' ', last_name) as student_name,
                       grade_level, section, current_adviser_id, current_section_id
                FROM students 
                WHERE student_id = :student_id AND is_active = 1
            ";
            $stmt = $this->db->prepare($studentQuery);
            $stmt->execute([':student_id' => $studentId]);
            $student = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$student) {
                throw new Exception("Student not found");
            }
            
            // Use provided grade level or student's current grade level
            $targetGradeLevel = $gradeLevel ?: $student['grade_level'];
            
            // Convert grade level if needed (1-6 to 7-12)
            if ($targetGradeLevel >= 1 && $targetGradeLevel <= 6) {
                $targetGradeLevel = $targetGradeLevel + 6;
            }
            
            // Find the best section
            $section = $this->findBestSection($targetGradeLevel, $preferredSectionId);
            
            if (!$section) {
                throw new Exception("No suitable section found for grade level {$targetGradeLevel}");
            }
            
            // Update student assignment
            $this->assignStudentToSection($studentId, $section['id'], $section['adviser_id'], $targetGradeLevel);
            
            return [
                'success' => true,
                'student' => $student,
                'section' => $section,
                'message' => "Student {$student['student_name']} assigned to {$section['level_name']} - {$section['section_name']} with adviser {$section['adviser_name']}"
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Find the best section for a student based on grade level and capacity
     */
    private function findBestSection($gradeLevel, $preferredSectionId = null) {
        // If preferred section is specified and valid, use it
        if ($preferredSectionId) {
            $preferredQuery = "
                SELECT s.id, s.section_name, s.adviser_id, s.current_enrollment, s.capacity,
                       gl.level_name, gl.level_number,
                       COALESCE(u.full_name, 'Unknown Adviser') as adviser_name
                FROM sections s
                INNER JOIN grade_levels gl ON s.grade_level_id = gl.id
                LEFT JOIN advisers a ON s.adviser_id = a.user_id AND a.is_active = 1
                LEFT JOIN users u ON a.user_id = u.user_id
                WHERE s.id = :section_id
                AND s.is_active = 1 
                AND s.adviser_id IS NOT NULL 
                AND a.user_id IS NOT NULL
                AND s.current_enrollment < s.capacity
            ";
            $stmt = $this->db->prepare($preferredQuery);
            $stmt->execute([':section_id' => $preferredSectionId]);
            $preferred = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($preferred && $preferred['level_number'] == $gradeLevel) {
                return $preferred;
            }
        }
        
        // Find best available section for the grade level
        $sectionQuery = "
            SELECT s.id, s.section_name, s.adviser_id, s.current_enrollment, s.capacity,
                   gl.level_name, gl.level_number,
                   COALESCE(u.full_name, 'Unknown Adviser') as adviser_name
            FROM sections s
            INNER JOIN grade_levels gl ON s.grade_level_id = gl.id
            LEFT JOIN advisers a ON s.adviser_id = a.user_id AND a.is_active = 1
            LEFT JOIN users u ON a.user_id = u.user_id
            WHERE gl.level_number = :grade_level 
            AND s.is_active = 1 
            AND s.adviser_id IS NOT NULL 
            AND a.user_id IS NOT NULL
            AND s.current_enrollment < s.capacity
            ORDER BY s.current_enrollment ASC, s.id ASC
            LIMIT 1
        ";
        
        $stmt = $this->db->prepare($sectionQuery);
        $stmt->execute([':grade_level' => $gradeLevel]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Assign a student to a specific section and adviser
     */
    private function assignStudentToSection($studentId, $sectionId, $adviserId, $gradeLevel) {
        $startedTransaction = false;
        if (!$this->db->inTransaction()) {
            $this->db->beginTransaction();
            $startedTransaction = true;
        }
        
        try {
            // Get section details
            $sectionQuery = "SELECT section_name FROM sections WHERE id = :section_id";
            $stmt = $this->db->prepare($sectionQuery);
            $stmt->execute([':section_id' => $sectionId]);
            $sectionData = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Update student record
            $updateStudentQuery = "
                UPDATE students 
                SET current_section_id = :section_id,
                    current_adviser_id = :adviser_id,
                    section = :section_name,
                    grade_level = :grade_level
                WHERE student_id = :student_id
            ";
            
            $stmt = $this->db->prepare($updateStudentQuery);
            $stmt->execute([
                ':section_id' => $sectionId,
                ':adviser_id' => $adviserId,
                ':section_name' => $sectionData['section_name'],
                ':grade_level' => $gradeLevel,
                ':student_id' => $studentId
            ]);

            // Add assignment history entry when student_adviser table is available
            try {
                $adviserIdStmt = $this->db->prepare("SELECT adviser_id FROM advisers WHERE user_id = :user_id LIMIT 1");
                $adviserIdStmt->execute([':user_id' => $adviserId]);
                $adviserData = $adviserIdStmt->fetch(PDO::FETCH_ASSOC);

                if ($adviserData && !empty($adviserData['adviser_id'])) {
                    $historyStmt = $this->db->prepare("INSERT INTO student_adviser (student_id, adviser_id, assigned_date)
                                                      SELECT :student_id, :adviser_id, CURDATE()
                                                      WHERE NOT EXISTS (
                                                          SELECT 1 FROM student_adviser
                                                          WHERE student_id = :student_id_check AND adviser_id = :adviser_id_check
                                                      )");
                    $historyStmt->execute([
                        ':student_id' => $studentId,
                        ':adviser_id' => $adviserData['adviser_id'],
                        ':student_id_check' => $studentId,
                        ':adviser_id_check' => $adviserData['adviser_id']
                    ]);
                }
            } catch (Exception $e) {
                error_log("StudentAssignmentService history insert skipped: " . $e->getMessage());
            }
            
            // Update section enrollment count
            $updateEnrollmentQuery = "
                UPDATE sections 
                SET current_enrollment = current_enrollment + 1 
                WHERE id = :section_id
            ";
            $stmt = $this->db->prepare($updateEnrollmentQuery);
            $stmt->execute([':section_id' => $sectionId]);
            
            if ($startedTransaction && $this->db->inTransaction()) {
                $this->db->commit();
            }
            
        } catch (Exception $e) {
            if ($startedTransaction && $this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }
    
    /**
     * Validate all student assignments and return issues
     */
    public function validateAllAssignments() {
        $issues = [];
        
        // Check for unassigned students
        $unassignedQuery = "
            SELECT COUNT(*) as count
            FROM students 
            WHERE is_active = 1 
            AND (current_adviser_id IS NULL OR current_adviser_id = 0)
        ";
        $stmt = $this->db->prepare($unassignedQuery);
        $stmt->execute();
        $unassigned = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($unassigned['count'] > 0) {
            $issues[] = [
                'type' => 'unassigned_students',
                'count' => $unassigned['count'],
                'severity' => 'high'
            ];
        }
        
        // Check for students with invalid adviser references
        $invalidAdviserQuery = "
            SELECT COUNT(*) as count
            FROM students s
            LEFT JOIN advisers a ON s.current_adviser_id = a.user_id
            WHERE s.is_active = 1 
            AND s.current_adviser_id IS NOT NULL 
            AND s.current_adviser_id > 0
            AND (a.user_id IS NULL OR a.is_active = 0)
        ";
        $stmt = $this->db->prepare($invalidAdviserQuery);
        $stmt->execute();
        $invalidAdviser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($invalidAdviser['count'] > 0) {
            $issues[] = [
                'type' => 'invalid_adviser_references',
                'count' => $invalidAdviser['count'],
                'severity' => 'critical'
            ];
        }
        
        return $issues;
    }
    
    /**
     * Fix all assignment issues automatically
     */
    public function fixAllAssignments() {
        $fixedCount = 0;
        $errors = [];
        
        // Get all students that need fixing
        $studentsQuery = "
            SELECT student_id, grade_level
            FROM students 
            WHERE is_active = 1 
            AND (current_adviser_id IS NULL OR current_adviser_id = 0 
                 OR current_section_id IS NULL OR current_section_id = 0)
        ";
        
        $stmt = $this->db->prepare($studentsQuery);
        $stmt->execute();
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($students as $student) {
            $result = $this->autoAssignStudent($student['student_id'], $student['grade_level']);
            
            if ($result['success']) {
                $fixedCount++;
            } else {
                $errors[] = $result['message'];
            }
        }
        
        return [
            'fixed_count' => $fixedCount,
            'errors' => $errors
        ];
    }
}
?>