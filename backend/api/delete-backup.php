<?php
// Include CORS handler first
require_once '../cors.php';

header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

// Get user_id from header
$headers = getallheaders();
$user_id = isset($headers['user_id']) ? intval($headers['user_id']) : null;

if (!$user_id) {
    http_response_code(403);
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
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized access - Invalid user'
    ]);
    exit;
}

$user = $stmt->fetch(PDO::FETCH_ASSOC);
if ($user['role_name'] !== 'Admin') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Unauthorized access - Admin role required'
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$filename = $data['filename'] ?? $_GET['filename'] ?? '';

if (empty($filename)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Filename is required'
    ]);
    exit;
}

// Sanitize filename to prevent directory traversal
$filename = basename($filename);

$backupDir = '../backups';
$filePath = $backupDir . '/' . $filename;

if (!file_exists($filePath)) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'Backup file not found'
    ]);
    exit;
}

try {
    if (unlink($filePath)) {
        // Log the deletion
        $logQuery = "INSERT INTO activity_logs (user_id, action, details) 
                     VALUES (:user_id, 'Backup Deleted', :details)";
        $logStmt = $db->prepare($logQuery);
        $logStmt->bindParam(':user_id', $user_id);
        $details = "Deleted backup: " . $filename;
        $logStmt->bindParam(':details', $details);
        $logStmt->execute();
        
        echo json_encode([
            'success' => true,
            'message' => 'Backup deleted successfully'
        ]);
    } else {
        throw new Exception('Failed to delete file');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to delete backup: ' . $e->getMessage()
    ]);
}
?>
