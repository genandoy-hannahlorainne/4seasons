<?php
/**
 * List Sections
 * GET /api/admin/sections/list.php
 * Query params: school_year_id (optional), grade_level (optional)
 */

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, X-Requested-With");
header("Access-Control-Max-Age: 3600");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../../config/database.php';
require_once '../../../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

// Authenticate user
$auth = new Auth($database);

// Allow Adviser and Admin roles
if (!$auth->hasRole('Adviser') && !$auth->hasRole('Admin')) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Access denied. Adviser or Admin role required.'
    ]);
    exit();
}

try {
    $schoolYearId = $_GET['school_year_id'] ?? null;
    $gradeLevel = $_GET['grade_level'] ?? null;
    
    $query = "SELECT 
                sec.id,
                sec.section_name,
                sec.grade_level_id,
                sec.school_year_id,
                sec.adviser_id,
                sec.capacity,
                sec.current_enrollment,
                sec.is_active,
                gl.level_name,
                gl.level_number,
                sy.year_name,
                CONCAT(adv.first_name, ' ', adv.last_name) as adviser_name
              FROM sections sec
              INNER JOIN grade_levels gl ON sec.grade_level_id = gl.id
              INNER JOIN school_years sy ON sec.school_year_id = sy.id
              LEFT JOIN advisers adv ON sec.adviser_id = adv.user_id
              WHERE sec.is_active = 1";
    
    $params = [];
    
    if ($schoolYearId) {
        $query .= " AND sec.school_year_id = :school_year_id";
        $params[':school_year_id'] = $schoolYearId;
    }
    
    if ($gradeLevel) {
        $query .= " AND gl.level_number = :grade_level";
        $params[':grade_level'] = $gradeLevel;
    }
    
    $query .= " ORDER BY gl.level_number, sec.section_name";
    
    $stmt = $db->prepare($query);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    
    $stmt->execute();
    $sections = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $sections,
        'count' => count($sections)
    ]);
    
} catch (Exception $e) {
    error_log("Error in sections/list.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error loading sections: ' . $e->getMessage()
    ]);
}
?>
