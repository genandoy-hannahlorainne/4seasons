<?php
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$headers = [];
foreach (headers_list() as $header) {
    $headers[] = $header;
}

echo json_encode([
    'success' => true,
    'message' => 'CORS test',
    'headers_sent' => $headers,
    'request_method' => $_SERVER['REQUEST_METHOD']
]);
?>
