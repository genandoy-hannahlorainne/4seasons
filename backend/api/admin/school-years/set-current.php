<?php
/**
 * Set Current School Year
 * POST /api/admin/school-years/set-current.php
 * Body: { school_year_id }
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

require_once '../../../config/database.php';
require_once '../../../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

// Authenticate user
$auth = new Auth($database);

// Require Admin role
if (!$auth->hasRole('Admin')) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Access denied. Admin role required.'
    ]);
    exit();
}

try {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['school_year_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing school_year_id'
        ]);
        exit;
    }
    
    $school_year_id = (int)$data['school_year_id'];
    
    // Verify school year exists
    $checkQuery = "SELECT id, year_name FROM school_years WHERE id = ?";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->execute([$school_year_id]);
    
    if ($checkStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'School year not found'
        ]);
        exit;
    }
    
    $schoolYear = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    $db->beginTransaction();
    
    try {
        // Set all school years to not current
        $updateAllQuery = "UPDATE school_years SET is_current = 0";
        $db->exec($updateAllQuery);
        
        // Set the selected school year as current
        $updateQuery = "UPDATE school_years SET is_current = 1 WHERE id = ?";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->execute([$school_year_id]);
        
        // Log the activity
        $auth->logActivity(
            'School Year Change',
            "Set current school year to: {$schoolYear['year_name']}"
        );
        
        $db->commit();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => "Current school year set to {$schoolYear['year_name']}",
            'school_year' => $schoolYear
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Error in set-current.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
