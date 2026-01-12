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
$filename = $data['filename'] ?? '';

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

$backupDir = dirname(__DIR__) . '/backups';
$backupFile = $backupDir . '/' . $filename;

if (!file_exists($backupFile)) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'Backup file not found'
    ]);
    exit;
}

try {
    // Get database connection info
    $database_obj = new Database();
    $config = $database_obj->getConfig();
    
    $host = $config['host'];
    $dbname = $config['dbname'];
    $username = $config['username'];
    $password = $config['password'];
    
    // Try to find mysql in common XAMPP locations
    $mysqlPaths = [
        'C:/xampp/mysql/bin/mysql.exe',
        'C:/xampp/mysql/bin/mysql',
        'mysql' // Try system PATH
    ];
    
    $mysqlCmd = null;
    foreach ($mysqlPaths as $path) {
        if (file_exists($path) || $path === 'mysql') {
            $mysqlCmd = $path;
            break;
        }
    }
    
    if (!$mysqlCmd) {
        throw new Exception('mysql not found. Please ensure XAMPP MySQL is installed.');
    }
    
    // Build mysql command for Windows - use PowerShell style
    $command = sprintf(
        'Get-Content "%s" | "%s" --host=%s --user=%s %s %s 2>&1',
        $backupFile,
        $mysqlCmd,
        escapeshellarg($host),
        escapeshellarg($username),
        empty($password) ? '' : '--password=' . escapeshellarg($password),
        escapeshellarg($dbname)
    );
    
    // Execute mysql restore using PowerShell
    $fullCommand = 'powershell.exe -Command "' . addslashes($command) . '"';
    exec($fullCommand, $output, $returnVar);
    
    if ($returnVar !== 0) {
        $errorMsg = 'Restore failed.';
        if (!empty($output)) {
            $errorMsg .= ' Error: ' . implode("\n", $output);
        }
        throw new Exception($errorMsg);
    }
    
    // Log the restore
    $logQuery = "INSERT INTO activity_logs (user_id, action, details) 
                 VALUES (:user_id, 'Database Restore', :details)";
    $logStmt = $db->prepare($logQuery);
    $logStmt->bindParam(':user_id', $user_id);
    $details = "Restored database from backup: " . $filename;
    $logStmt->bindParam(':details', $details);
    $logStmt->execute();
    
    echo json_encode([
        'success' => true,
        'message' => 'Database restored successfully from ' . $filename
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Restore failed: ' . $e->getMessage()
    ]);
}
?>
