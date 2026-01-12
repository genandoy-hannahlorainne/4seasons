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

// Helper function
function getTimeAgo($timestamp) {
    $diff = time() - $timestamp;
    
    if ($diff < 60) {
        return $diff . ' seconds ago';
    } elseif ($diff < 3600) {
        return floor($diff / 60) . ' minutes ago';
    } elseif ($diff < 86400) {
        return floor($diff / 3600) . ' hours ago';
    } else {
        return floor($diff / 86400) . ' days ago';
    }
}

try {
    $backupDir = dirname(__DIR__) . '/backups';
    
    if (!file_exists($backupDir)) {
        echo json_encode([
            'success' => true,
            'backups' => []
        ]);
        exit;
    }
    
    // Get all backup files
    $files = glob($backupDir . '/db_backup_*.sql*');
    
    if ($files === false) {
        $files = [];
    }
    
    $backups = [];
    foreach ($files as $file) {
        $filename = basename($file);
        $fileSize = filesize($file);
        $fileSizeMB = round($fileSize / 1024 / 1024, 2);
        $fileTime = filemtime($file);
        
        // Extract timestamp from filename
        preg_match('/db_backup_(\d{4}-\d{2}-\d{2}_\d{6})/', $filename, $matches);
        $timestamp = isset($matches[1]) ? $matches[1] : '';
        
        // Format date nicely
        $createdDate = date('M d, Y h:i A', $fileTime);
        
        $backups[] = [
            'filename' => $filename,
            'size' => $fileSizeMB . ' MB',
            'created' => $createdDate,
            'timestamp' => $timestamp,
            'age' => getTimeAgo($fileTime)
        ];
    }
    
    // Sort by timestamp descending (newest first)
    usort($backups, function($a, $b) {
        return strcmp($b['timestamp'], $a['timestamp']);
    });
    
    echo json_encode([
        'success' => true,
        'backups' => $backups,
        'totalBackups' => count($backups)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to get backup history: ' . $e->getMessage()
    ]);
}
?>
