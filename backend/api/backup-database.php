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

try {
    // Create backups directory if not exists
    $backupDir = dirname(__DIR__) . '/backups';
    if (!file_exists($backupDir)) {
        mkdir($backupDir, 0755, true);
    }
    
    // Generate backup filename with timestamp
    $timestamp = date('Y-m-d_His');
    $backupFile = $backupDir . '/db_backup_' . $timestamp . '.sql';
    
    // Get database connection info
    $database_obj = new Database();
    $config = $database_obj->getConfig();
    
    $host = $config['host'];
    $dbname = $config['dbname'];
    $username = $config['username'];
    $password = $config['password'];
    
    // Try to find mysqldump in common XAMPP locations
    $mysqldumpPaths = [
        'C:/xampp/mysql/bin/mysqldump.exe',
        'C:/xampp/mysql/bin/mysqldump',
        'mysqldump' // Try system PATH
    ];
    
    $mysqldumpCmd = null;
    foreach ($mysqldumpPaths as $path) {
        if (file_exists($path) || $path === 'mysqldump') {
            $mysqldumpCmd = $path;
            break;
        }
    }
    
    if (!$mysqldumpCmd) {
        throw new Exception('mysqldump not found. Please ensure XAMPP MySQL is installed.');
    }
    
    // Build mysqldump command for Windows
    $command = sprintf(
        '"%s" --host=%s --user=%s %s %s > "%s" 2>&1',
        $mysqldumpCmd,
        escapeshellarg($host),
        escapeshellarg($username),
        empty($password) ? '' : '--password=' . escapeshellarg($password),
        escapeshellarg($dbname),
        $backupFile
    );
    
    // Execute mysqldump
    exec($command, $output, $returnVar);
    
    // Check if backup file was created and has content
    if (!file_exists($backupFile) || filesize($backupFile) === 0) {
        $errorMsg = 'Backup file was not created or is empty.';
        if (!empty($output)) {
            $errorMsg .= ' Error: ' . implode("\n", $output);
        }
        throw new Exception($errorMsg);
    }
    
    // Get file size
    $fileSize = filesize($backupFile);
    $fileSizeMB = round($fileSize / 1024 / 1024, 2);
    
    // Log the backup
    $logQuery = "INSERT INTO activity_logs (user_id, action, details) 
                 VALUES (:user_id, 'Database Backup', :details)";
    $logStmt = $db->prepare($logQuery);
    $logStmt->bindParam(':user_id', $user_id);
    $details = "Created backup: " . basename($backupFile) . " ({$fileSizeMB} MB)";
    $logStmt->bindParam(':details', $details);
    $logStmt->execute();
    
    echo json_encode([
        'success' => true,
        'message' => 'Database backup created successfully',
        'data' => [
            'filename' => basename($backupFile),
            'size' => $fileSizeMB . ' MB',
            'timestamp' => $timestamp
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Backup failed: ' . $e->getMessage()
    ]);
}
?>
