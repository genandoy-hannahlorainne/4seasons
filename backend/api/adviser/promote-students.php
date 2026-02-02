<?php
/**
 * Promote Students to Next Grade Level
 * POST /api/adviser/promote-students.php
 */

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, X-Requested-With");
header("Access-Control-Max-Age: 3600");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

// Authenticate user
$auth = new Auth($database);

// Allow both Adviser and Admin roles
if (!$auth->hasRole('Adviser') && !$auth->hasRole('Admin')) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Access denied. Adviser or Admin role required.'
    ]);
    exit();
}

// Get JSON input
$input = json_decode(file_get_contents("php://input"), true);

error_log("=== PROMOTE STUDENTS ===");
error_log("Input: " . json_encode($input));

if (!$input || !isset($input['student_ids']) || !isset($input['action'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Missing required fields: student_ids, action'
    ]);
    exit();
}

$studentIds = $input['student_ids'];
$action = $input['action']; // 'promote' or 'graduate'
$toSchoolYearId = $input['to_school_year_id'] ?? null;
$toGradeLevel = $input['to_grade_level'] ?? null;
$toSectionId = $input['to_section_id'] ?? null;

if (empty($studentIds) || !is_array($studentIds)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'student_ids must be a non-empty array'
    ]);
    exit();
}

try {
    $db->beginTransaction();
    
    $promotedCount = 0;
    $graduatedCount = 0;
    $errors = [];
    
    foreach ($studentIds as $studentId) {
        try {
            // Get current student info
            $studentQuery = "SELECT student_id, student_number, first_name, last_name, grade_level, 
                            current_school_year_id, enrollment_status
                            FROM students 
                            WHERE student_id = :student_id AND is_active = 1";
            $studentStmt = $db->prepare($studentQuery);
            $studentStmt->bindParam(':student_id', $studentId);
            $studentStmt->execute();
            
            if ($studentStmt->rowCount() === 0) {
                $errors[] = "Student ID $studentId not found";
                continue;
            }
            
            $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($action === 'graduate') {
                // Mark as graduated
                $updateQuery = "UPDATE students SET 
                               enrollment_status = 'graduated',
                               promotion_date = NOW(),
                               last_promotion_date = NOW()
                               WHERE student_id = :student_id";
                
                $updateStmt = $db->prepare($updateQuery);
                $updateStmt->bindParam(':student_id', $studentId);
                $updateStmt->execute();
                
                $graduatedCount++;
                
                error_log("✓ Graduated: {$student['first_name']} {$student['last_name']} ({$student['student_number']})");
                
            } else if ($action === 'promote') {
                // Validate required fields for promotion
                if (!$toSchoolYearId || !$toGradeLevel) {
                    $errors[] = "Student ID $studentId: Missing to_school_year_id or to_grade_level";
                    continue;
                }
                
                // Update student record
                $updateQuery = "UPDATE students SET 
                               enrollment_status = 'promoted',
                               grade_level = :new_grade_level,
                               current_school_year_id = :new_school_year_id,
                               current_section_id = :new_section_id,
                               promotion_date = NOW(),
                               last_promotion_date = NOW()
                               WHERE student_id = :student_id";
                
                $updateStmt = $db->prepare($updateQuery);
                $updateStmt->bindParam(':new_grade_level', $toGradeLevel);
                $updateStmt->bindParam(':new_school_year_id', $toSchoolYearId);
                $updateStmt->bindParam(':new_section_id', $toSectionId);
                $updateStmt->bindParam(':student_id', $studentId);
                $updateStmt->execute();
                
                $promotedCount++;
                
                error_log("✓ Promoted: {$student['first_name']} {$student['last_name']} to Grade $toGradeLevel");
            }
            
        } catch (Exception $e) {
            $errors[] = "Student ID $studentId: " . $e->getMessage();
            error_log("Error processing student $studentId: " . $e->getMessage());
        }
    }
    
    // Log activity
    $totalProcessed = $promotedCount + $graduatedCount;
    $activityDetails = $action === 'graduate' 
        ? "Graduated $graduatedCount student(s)"
        : "Promoted $promotedCount student(s) to Grade $toGradeLevel";
    
    $auth->logActivity('Student Promotion', $activityDetails);
    
    $db->commit();
    
    $message = [];
    if ($promotedCount > 0) {
        $message[] = "$promotedCount student(s) promoted successfully";
    }
    if ($graduatedCount > 0) {
        $message[] = "$graduatedCount student(s) graduated successfully";
    }
    if (count($errors) > 0) {
        $message[] = count($errors) . " error(s) occurred";
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'promoted_count' => $promotedCount,
        'graduated_count' => $graduatedCount,
        'total_processed' => $totalProcessed,
        'errors' => $errors,
        'message' => implode('. ', $message)
    ]);
    
} catch (Exception $e) {
    $db->rollBack();
    error_log("Error in promote-students: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error promoting students: ' . $e->getMessage()
    ]);
}
?>
