<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $action = isset($_GET['action']) ? $_GET['action'] : null;
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get-all') {
        // Get all system settings
        $settings = [
            'system' => [
                'app_name' => 'Medical Records System',
                'app_version' => '1.0.0',
                'timezone' => 'Asia/Manila',
                'date_format' => 'Y-m-d',
                'time_format' => 'H:i:s'
            ],
            'email' => [
                'smtp_host' => 'smtp.gmail.com',
                'smtp_port' => 587,
                'smtp_username' => 'noreply@4seasons.edu.ph',
                'smtp_from_name' => '4Seasons Medical System',
                'smtp_enabled' => true
            ],
            'notifications' => [
                'email_on_registration' => true,
                'email_on_password_reset' => true,
                'email_on_medical_visit' => true,
                'sms_enabled' => false,
                'notification_retention_days' => 30
            ],
            'security' => [
                'password_min_length' => 6,
                'password_require_uppercase' => false,
                'password_require_numbers' => false,
                'session_timeout_minutes' => 30,
                'max_login_attempts' => 5,
                'lockout_duration_minutes' => 15
            ],
            'backup' => [
                'auto_backup_enabled' => true,
                'backup_frequency' => 'daily',
                'backup_time' => '02:00',
                'backup_retention_days' => 30
            ]
        ];
        
        echo json_encode(['success' => true, 'settings' => $settings]);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT' && $action === 'update') {
        // Update system settings
        $data = json_decode(file_get_contents("php://input"), true);
        
        // In a real application, these would be saved to database or config file
        // For now, we'll just validate and return success
        
        if (isset($data['section']) && isset($data['settings'])) {
            // Validate settings based on section
            $validSections = ['system', 'email', 'notifications', 'security', 'backup'];
            
            if (!in_array($data['section'], $validSections)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid settings section']);
                exit;
            }
            
            // Here you would save to database/config
            echo json_encode([
                'success' => true,
                'message' => 'Settings updated successfully',
                'section' => $data['section']
            ]);
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        }
        
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid request']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
