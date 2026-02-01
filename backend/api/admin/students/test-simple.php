<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Test if we can load dependencies
try {
    require_once '../../../config/database.php';
    require_once '../../../middleware/auth.php';
    require_once '../../../services/EmailService.php';
    
    echo json_encode([
        'success' => true,
        'message' => 'All dependencies loaded successfully',
        'files_received' => isset($_FILES['csv_file']) ? 'yes' : 'no',
        'file_count' => isset($_FILES) ? count($_FILES) : 0
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error loading dependencies: ' . $e->getMessage()
    ]);
}
?>
