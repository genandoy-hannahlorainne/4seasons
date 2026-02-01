<?php
/**
 * List School Years
 * GET /api/admin/school-years/list.php
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

require_once '../../../config/database.php';
require_once '../../../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

// Authenticate user
$auth = new Auth($database);

// Allow both Admin and Adviser roles to view school years
if (!$auth->hasRole('Admin') && !$auth->hasRole('Adviser')) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Access denied. Admin or Adviser role required.'
    ]);
    exit();
}

try {
    $query = "SELECT id, year_name, start_date, end_date, is_active, created_at 
              FROM school_years 
              ORDER BY start_date DESC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $schoolYears = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $schoolYears
    ]);

} catch (Exception $e) {
    error_log("Error loading school years: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
