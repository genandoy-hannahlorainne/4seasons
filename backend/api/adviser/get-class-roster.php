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

    // Get adviser_id from user_id
    $adviserQuery = "SELECT adviser_id FROM advisers WHERE user_id = :user_id AND is_active = 1";
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

    // Get adviser's current section (sections.adviser_id references users.user_id)
    $sectionQuery = "SELECT sec.id, sec.section_name, gl.level_name, gl.level_number
                    FROM sections sec
                    LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
                    WHERE sec.adviser_id = ? AND sec.school_year_id = ?";
    
    $sectionStmt = $db->prepare($sectionQuery);
    $sectionStmt->execute([$user_id, $school_year_id]);
    
    if ($sectionStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'No section assigned for this school year'
        ]);
        exit;
    }

    $section = $sectionStmt->fetch(PDO::FETCH_ASSOC);

    // Get students in this section
    $studentQuery = "SELECT 
                    s.student_id,
                    s.first_name,
                    s.last_name,
                    s.student_number,
                    COUNT(mv.visit_id) as total_medical_visits,
                    MAX(mv.visit_datetime) as last_visit_date,
                    s.enrollment_status
                    FROM students s
                    LEFT JOIN medical_visits mv ON s.student_id = mv.student_id
                    WHERE s.current_section_id = ? 
                    AND s.current_school_year_id = ?
                    AND s.enrollment_status = 'active'
                    GROUP BY s.student_id, s.first_name, s.last_name, s.student_number, s.enrollment_status
                    ORDER BY s.last_name, s.first_name";

    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->execute([$section['id'], $school_year_id]);
    $students = $studentStmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'section' => $section,
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
