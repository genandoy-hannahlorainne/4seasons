<?php
// Handle CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: http://localhost:4200");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Max-Age: 3600");
    http_response_code(200);
    exit();
}

header("Access-Control-Allow-Origin: http://localhost:4200");
header("Content-Type: application/json; charset=UTF-8");

// Get raw input
$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput);

// Debug output
echo json_encode([
    'debug' => true,
    'raw_input' => $rawInput,
    'decoded_data' => $data,
    'has_role' => !empty($data->role),
    'has_password' => !empty($data->password),
    'all_fields' => get_object_vars($data ?? new stdClass())
]);
?>
