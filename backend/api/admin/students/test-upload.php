<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

echo json_encode([
    'success' => true,
    'message' => 'Test endpoint working',
    'files_received' => isset($_FILES) ? count($_FILES) : 0,
    'files_data' => $_FILES,
    'post_data' => $_POST,
    'method' => $_SERVER['REQUEST_METHOD']
]);
?>
