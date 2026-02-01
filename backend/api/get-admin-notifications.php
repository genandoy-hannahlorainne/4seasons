<?php
// Include CORS handler first
require_once '../cors.php';

header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';
require_once '../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

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
                         mv.visit_type, mv.chief_complaint, mv.status as visit_status,
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
        $stmt->bindParam(':user_id', $auth->userId());
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
                    'full_name' => trim($row['first_name'] . ' ' . $row['last_name']),
                    'student_number' => $row['student_number'],
                    'grade_section' => $row['grade_level'] . '-' . $row['section']
                ],
                'visit' => [
                    'visit_id' => $row['visit_id'],
                    'visit_type' => $row['visit_type'],
                    'chief_complaint' => $row['chief_complaint'],
                    'status' => $row['visit_status']
                ],
                'staff' => [
                    'name' => $row['staff_name'],
                    'position' => $row['staff_position']
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
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>