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

    // Get adviser's assigned section(s) for the school year
    $sectionQuery = "SELECT 
                        s.id as section_id,
                        s.section_name,
                        s.grade_level_id,
                        s.school_year_id,
                        gl.level_name,
                        gl.level_number
                     FROM sections s
                     INNER JOIN grade_levels gl ON s.grade_level_id = gl.id
                     WHERE s.adviser_id = :user_id 
                       AND s.school_year_id = :school_year_id
                       AND s.is_active = 1
                     LIMIT 1";
    
    $sectionStmt = $db->prepare($sectionQuery);
    $sectionStmt->bindParam(':user_id', $user_id);
    $sectionStmt->bindParam(':school_year_id', $school_year_id);
    $sectionStmt->execute();
    
    if ($sectionStmt->rowCount() === 0) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'section' => null,
            'students' => [],
            'total_students' => 0,
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
                        s.grade_level,
                        s.section,
                        s.current_school_year_id,
                        COUNT(mv.visit_id) as total_medical_visits,
                        MAX(mv.visit_datetime) as last_visit_date,
                        s.is_active
                     FROM students s
                     LEFT JOIN medical_visits mv ON s.student_id = mv.student_id
                     WHERE s.current_section_id = :section_id
                       AND s.current_school_year_id = :school_year_id
                       AND s.is_active = 1
                       AND s.enrollment_status = 'active'
                     GROUP BY s.student_id, s.first_name, s.last_name, s.student_number, 
                              s.grade_level, s.section, s.current_school_year_id, s.is_active
                     ORDER BY s.last_name, s.first_name";

    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(':section_id', $section['section_id']);
    $studentStmt->bindParam(':school_year_id', $school_year_id);
    $studentStmt->execute();
    $students = $studentStmt->fetchAll(PDO::FETCH_ASSOC);

    // Build section info
    $sectionInfo = [
        'id' => $section['section_id'],
        'section_name' => $section['section_name'],
        'level_name' => $section['level_name'],
        'level_number' => intval($section['level_number'])
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
