<?php
/**
 * List Grade Levels
 * GET /api/admin/grade-levels/list.php
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

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

// Authenticate user
$auth = new Auth($database);

// Allow Admin and Adviser roles
if (!$auth->hasAnyRole(['Admin', 'Adviser'])) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Access denied. Admin or Adviser role required.'
    ]);
    exit();
}

try {
    $query = "SELECT id, level_name, level_number 
              FROM grade_levels 
              ORDER BY level_number ASC";
    
    $stmt = $db->query($query);
    $gradeLevels = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $gradeLevels
    ]);

} catch (Exception $e) {
    error_log("Error fetching grade levels: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
