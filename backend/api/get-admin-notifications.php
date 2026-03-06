<?php
// Include CORS handler first
require_once '../cors.php';

header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';
require_once '../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection error'
    ]);
    exit();
}

// Authenticate user
$auth = new Auth($database);
$auth->requireRole('Admin');

try {
    // Check if notifications table has user_id column (enhanced structure)
    $checkColumns = "SHOW COLUMNS FROM notifications LIKE 'user_id'";
    $checkStmt = $db->prepare($checkColumns);
    $checkStmt->execute();
    $hasUserIdColumn = $checkStmt->rowCount() > 0;
    
    if ($hasUserIdColumn) {
        // Use enhanced notification structure
        $query = "SELECT n.*, 
                         s.first_name, s.last_name, s.student_number, s.grade_level, s.section,
                         mv.visit_type, mv.notes as diagnosis, mv.status as visit_status,
                         cs.position as staff_position,
                         u.full_name as staff_name
                  FROM notifications n
                  LEFT JOIN students s ON n.student_id = s.student_id
                  LEFT JOIN medical_visits mv ON n.visit_id = mv.visit_id
                  LEFT JOIN clinic_staff cs ON mv.clinic_staff_id = cs.clinic_staff_id
                  LEFT JOIN users u ON cs.user_id = u.user_id
                  WHERE n.user_id = :user_id 
                    AND n.channel = 'System'
                  ORDER BY n.created_at DESC
                  LIMIT 50";
        
        $stmt = $db->prepare($query);
        $currentUserId = $auth->userId();
        $stmt->bindParam(':user_id', $currentUserId, PDO::PARAM_INT);
        $stmt->execute();
        
        $notifications = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $notifications[] = [
                'notification_id' => $row['notification_id'],
                'message' => $row['message'],
                'priority' => $row['priority'] ?? 'normal',
                'status' => $row['status'],
                'created_at' => $row['created_at'],
                'student' => [
                    'student_id' => $row['student_id'],
                    'full_name' => $row['first_name'] && $row['last_name'] 
                        ? trim($row['first_name'] . ' ' . $row['last_name']) 
                        : 'Unknown Student',
                    'student_number' => $row['student_number'] ?? 'N/A',
                    'grade_section' => ($row['grade_level'] && $row['section']) 
                        ? $row['grade_level'] . '-' . $row['section'] 
                        : 'N/A'
                ],
                'visit' => [
                    'visit_id' => $row['visit_id'] ?? null,
                    'visit_type' => $row['visit_type'] ?? 'N/A',
                    'diagnosis' => $row['diagnosis'] ?? 'N/A',
                    'status' => $row['visit_status'] ?? 'N/A'
                ],
                'staff' => [
                    'name' => $row['staff_name'] ?? 'N/A',
                    'position' => $row['staff_position'] ?? 'N/A'
                ]
            ];
        }
        
        echo json_encode([
            'success' => true,
            'notifications' => $notifications,
            'total' => count($notifications)
        ]);
        
    } else {
        // Fallback - return empty notifications with message
        echo json_encode([
            'success' => true,
            'notifications' => [],
            'total' => 0,
            'message' => 'Notification system not fully configured. Please run database migration.'
        ]);
    }
    
} catch (Throwable $e) {
    error_log("Admin Notifications Error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>