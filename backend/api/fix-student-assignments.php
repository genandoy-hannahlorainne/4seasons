<?php
/**
 * Fix Student-Adviser Assignments
 * This API ensures all students are properly assigned to advisers
 * Can be called manually or automatically
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

// Authenticate admin
$auth = new Auth($database);
$auth->requireRole('Admin');

try {
    $db->beginTransaction();
    
    $fixedCount = 0;
    $errors = [];
    
    // Find all students without proper adviser assignments
    $unassignedQuery = "
        SELECT s.student_id, s.user_id, s.student_number, 
               CONCAT(s.first_name, ' ', s.last_name) as student_name,
               s.grade_level, s.section, s.current_adviser_id, s.current_section_id
        FROM students s 
        WHERE s.is_active = 1 
        AND (s.current_adviser_id IS NULL OR s.current_adviser_id = 0 
             OR s.current_section_id IS NULL OR s.current_section_id = 0
             OR s.section IS NULL OR s.section = '')
        ORDER BY s.grade_level, s.student_number
    ";
    
    $stmt = $db->prepare($unassignedQuery);
    $stmt->execute();
    $unassignedStudents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($unassignedStudents as $student) {
        try {
            // Determine the correct grade level (convert 1-6 to 7-12 if needed)
            $actualGradeLevel = $student['grade_level'];
            if ($actualGradeLevel >= 1 && $actualGradeLevel <= 6) {
                $actualGradeLevel = $actualGradeLevel + 6; // Convert 1->7, 2->8, etc.
            }
            
            // Find the best section for this student
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
                AND s.current_enrollment < s.capacity
                ORDER BY s.current_enrollment ASC, s.id ASC
                LIMIT 1
            ";
            
            $sectionStmt = $db->prepare($sectionQuery);
            $sectionStmt->execute([':grade_level' => $actualGradeLevel]);
            $targetSection = $sectionStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($targetSection) {
                // Update student record
                $updateStudentQuery = "
                    UPDATE students 
                    SET current_section_id = :section_id,
                        current_adviser_id = :adviser_id,
                        section = :section_name,
                        grade_level = :grade_level
                    WHERE student_id = :student_id
                ";
                
                $updateStmt = $db->prepare($updateStudentQuery);
                $updateStmt->execute([
                    ':section_id' => $targetSection['id'],
                    ':adviser_id' => $targetSection['adviser_id'],
                    ':section_name' => $targetSection['section_name'],
                    ':grade_level' => $actualGradeLevel,
                    ':student_id' => $student['student_id']
                ]);
                
                // Update section enrollment
                $enrollmentQuery = "
                    UPDATE sections 
                    SET current_enrollment = current_enrollment + 1 
                    WHERE id = :section_id
                ";
                $enrollmentStmt = $db->prepare($enrollmentQuery);
                $enrollmentStmt->execute([':section_id' => $targetSection['id']]);
                
                $fixedCount++;
                
                error_log("✅ Fixed assignment for {$student['student_name']}: {$targetSection['level_name']} - {$targetSection['section_name']} → {$targetSection['adviser_name']}");
                
            } else {
                $error = "No suitable section found for {$student['student_name']} (Grade {$actualGradeLevel})";
                $errors[] = $error;
                error_log("⚠️ " . $error);
            }
            
        } catch (Exception $e) {
            $error = "Error fixing {$student['student_name']}: " . $e->getMessage();
            $errors[] = $error;
            error_log("❌ " . $error);
        }
    }
    
    $db->commit();
    
    // Get final statistics
    $statsQuery = "
        SELECT 
            COUNT(*) as total_students,
            COUNT(CASE WHEN current_adviser_id IS NOT NULL AND current_adviser_id > 0 THEN 1 END) as assigned_students,
            COUNT(CASE WHEN current_adviser_id IS NULL OR current_adviser_id = 0 THEN 1 END) as unassigned_students
        FROM students 
        WHERE is_active = 1
    ";
    $statsStmt = $db->prepare($statsQuery);
    $statsStmt->execute();
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => "Student-adviser assignments fixed successfully",
        'data' => [
            'fixed_count' => $fixedCount,
            'total_students' => (int)$stats['total_students'],
            'assigned_students' => (int)$stats['assigned_students'],
            'unassigned_students' => (int)$stats['unassigned_students'],
            'errors' => $errors
        ]
    ]);
    
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    
    error_log("Error in fix-student-assignments: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fixing student assignments: ' . $e->getMessage()
    ]);
}
?>