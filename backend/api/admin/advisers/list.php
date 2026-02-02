<?php
/**
 * List All Advisers
 * GET /api/admin/advisers/list.php
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, X-Requested-With");
header("Access-Control-Max-Age: 3600");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../../config/database.php';
require_once '../../../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

$auth = new Auth($database);

if (!$auth->hasRole('Admin')) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Access denied. Admin role required.'
    ]);
    exit();
}

try {
    $query = "SELECT 
                a.adviser_id,
                a.user_id,
                a.first_name,
                a.last_name,
                a.employee_number,
                a.contact_phone,
                a.is_active,
                CONCAT(a.first_name, ' ', a.last_name) as full_name,
                u.username,
                u.email
              FROM advisers a
              INNER JOIN users u ON a.user_id = u.user_id
              WHERE a.is_active = 1
              ORDER BY a.last_name, a.first_name";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $advisers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $advisers,
        'count' => count($advisers)
    ]);
    
} catch (Exception $e) {
    error_log("Error in advisers/list.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error loading advisers: ' . $e->getMessage()
    ]);
}
?>
