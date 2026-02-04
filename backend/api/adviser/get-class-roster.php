<?php
/**
 * Get Adviser's Class Roster
 * GET /api/adviser/get-class-roster?school_year_id=X
 */

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
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

// Require Adviser role
if (!$auth->hasRole('Adviser')) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Access denied. Adviser role required.'
    ]);
    exit();
}

try {
    $school_year_id = $_GET['school_year_id'] ?? null;
    $user_id = $auth->userId();

    if (!$school_year_id) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing school_year_id parameter'
        ]);
        exit;
    }

    // Get adviser's grade level and section
    $adviserQuery = "SELECT a.adviser_id, a.grade_level, a.section 
                     FROM advisers a
                     WHERE a.user_id = :user_id AND a.is_active = 1";
    $adviserStmt = $db->prepare($adviserQuery);
    $adviserStmt->bindParam(':user_id', $user_id);
    $adviserStmt->execute();
    
    if ($adviserStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Adviser record not found'
        ]);
        exit;
    }
    
    $adviser = $adviserStmt->fetch(PDO::FETCH_ASSOC);
    $adviser_id = $adviser['adviser_id'];
    $grade_level = $adviser['grade_level'];
    $section = $adviser['section'];

    // Get students in this adviser's grade level and section
    $studentQuery = "SELECT 
                    s.student_id,
                    s.first_name,
                    s.last_name,
                    s.student_number,
                    s.grade_level,
                    s.section,
                    COUNT(mv.visit_id) as total_medical_visits,
                    MAX(mv.visit_datetime) as last_visit_date,
                    s.is_active
                    FROM students s
                    LEFT JOIN medical_visits mv ON s.student_id = mv.student_id
                    WHERE s.grade_level = :grade_level
                    AND s.section = :section
                    AND s.is_active = 1
                    GROUP BY s.student_id, s.first_name, s.last_name, s.student_number, s.grade_level, s.section, s.is_active
                    ORDER BY s.last_name, s.first_name";

    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(':grade_level', $grade_level);
    $studentStmt->bindParam(':section', $section);
    $studentStmt->execute();
    $students = $studentStmt->fetchAll(PDO::FETCH_ASSOC);

    // Build section info
    $sectionInfo = [
        'id' => null,
        'section_name' => $section,
        'level_name' => "Grade $grade_level",
        'level_number' => intval($grade_level)
    ];

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'section' => $sectionInfo,
        'students' => $students,
        'total_students' => count($students)
    ]);

} catch (Exception $e) {
    error_log("Error getting class roster: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
