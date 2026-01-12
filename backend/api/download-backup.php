<?php
// Include CORS handler first
require_once '../cors.php';

require_once '../config/database.php';

// Get user_id from header
$headers = getallheaders();
$user_id = isset($headers['user_id']) ? intval($headers['user_id']) : null;

if (!$user_id) {
    http_response_code(403);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized access - No user ID provided'
    ]);
    exit;
}

// Verify user is admin
$database = new Database();
$db = $database->getConnection();

$query = "SELECT u.user_id, r.role_name 
          FROM users u 
          INNER JOIN roles r ON u.role_id = r.role_id 
          WHERE u.user_id = :user_id AND u.is_active = 1";
$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $user_id);
$stmt->execute();

if ($stmt->rowCount() === 0) {
    http_response_code(403);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized access - Invalid user'
    ]);
    exit;
}

$user = $stmt->fetch(PDO::FETCH_ASSOC);
if ($user['role_name'] !== 'Admin') {
    http_response_code(403);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized access - Admin role required'
    ]);
    exit;
}

$filename = $_GET['filename'] ?? '';

if (empty($filename)) {
    http_response_code(400);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        'success' => false,
        'message' => 'Filename is required'
    ]);
    exit;
}

// Sanitize filename to prevent directory traversal
$filename = basename($filename);

$backupDir = dirname(__DIR__) . '/backups';
$filePath = $backupDir . '/' . $filename;

if (!file_exists($filePath)) {
    http_response_code(404);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        'success' => false,
        'message' => 'Backup file not found: ' . $filePath
    ]);
    exit;
}

// Set headers for file download
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Content-Length: ' . filesize($filePath));
header('Cache-Control: no-cache, must-revalidate');
header('Pragma: public');

// Log the download before sending file
$logQuery = "INSERT INTO activity_logs (user_id, action, details) 
             VALUES (:user_id, 'Backup Download', :details)";
$logStmt = $db->prepare($logQuery);
$logStmt->bindParam(':user_id', $user_id);
$details = "Downloaded backup: " . $filename;
$logStmt->bindParam(':details', $details);
$logStmt->execute();

// Output file
readfile($filePath);
exit;
?>
