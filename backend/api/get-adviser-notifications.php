<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, User-Id, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

// Authenticate user
$auth = new Auth($database);

// Only Adviser can view their notifications
$auth->requireRole('Adviser');

try {
    error_log("=== GET ADVISER NOTIFICATIONS ===");
    
    $adviser_id = $auth->userId();
    error_log("Fetching notifications for adviser: " . $adviser_id);
    
    // Get adviser's students
    $query = "SELECT DISTINCT s.student_id, s.user_id
              FROM students s
              INNER JOIN advisers a ON s.grade_level = a.grade_level AND s.section = a.section
              WHERE a.user_id = :adviser_id
              AND s.deleted_at IS NULL";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':adviser_id', $adviser_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $student_ids = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $student_ids[] = $row['student_id'];
    }
    
    error_log("Found " . count($student_ids) . " students for adviser");
    
    if (empty($student_ids)) {
        echo json_encode([
            'success' => true,
            'notifications' => [],
            'total' => 0
        ]);
        exit();
    }
    
    // Get health visit notifications from clinic staff AND system notifications
    $placeholders = implode(',', array_fill(0, count($student_ids), '?'));
    
    // Check if notifications table has user_id column (enhanced structure)
    $checkColumns = "SHOW COLUMNS FROM notifications LIKE 'user_id'";
    $checkStmt = $db->prepare($checkColumns);
    $checkStmt->execute();
    $hasUserIdColumn = $checkStmt->rowCount() > 0;
    
    $notifications = [];
    
    // Get system notifications if enhanced structure exists
    if ($hasUserIdColumn) {
        $systemNotifQuery = "SELECT n.*, 
                                   s.first_name, s.last_name, s.student_number, s.grade_level, s.section,
                                   mv.visit_type, mv.chief_complaint, mv.status as visit_status,
                                   cs.position as staff_position,
                                   u.full_name as staff_name
                            FROM notifications n
                            LEFT JOIN students s ON n.student_id = s.student_id
                            LEFT JOIN medical_visits mv ON n.visit_id = mv.visit_id
                            LEFT JOIN clinic_staff cs ON mv.clinic_staff_id = cs.clinic_staff_id
                            LEFT JOIN users u ON cs.user_id = u.user_id
                            WHERE n.user_id = :adviser_id 
                              AND n.channel = 'System'
                              AND n.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                            ORDER BY n.created_at DESC";
        
        $systemStmt = $db->prepare($systemNotifQuery);
        $systemStmt->bindParam(':adviser_id', $adviser_id, PDO::PARAM_INT);
        $systemStmt->execute();
        
        while ($row = $systemStmt->fetch(PDO::FETCH_ASSOC)) {
            $created_at = new DateTime($row['created_at']);
            $now = new DateTime();
            $interval = $now->diff($created_at);
            
            // Format time ago
            if ($interval->days > 0) {
                $time_ago = $interval->days . 'd ago';
            } elseif ($interval->h > 0) {
                $time_ago = $interval->h . 'h ago';
            } elseif ($interval->i > 0) {
                $time_ago = $interval->i . 'm ago';
            } else {
                $time_ago = 'Just now';
            }
            
            $notifications[] = [
                'id' => 'sys_' . intval($row['notification_id']),
                'senderName' => 'Clinic System',
                'senderRole' => 'System',
                'studentName' => trim($row['first_name'] . ' ' . $row['last_name']),
                'studentNumber' => $row['student_number'],
                'subject' => ucfirst($row['visit_type']) . ' Visit Notification',
                'previewText' => substr($row['message'], 0, 100) . (strlen($row['message']) > 100 ? '...' : ''),
                'fullMessage' => $row['message'],
                'timeAgo' => $time_ago,
                'fullDate' => $created_at->format('M d, Y \a\t h:i A'),
                'visitType' => ucfirst($row['visit_type']),
                'priority' => $row['priority'] ?? 'normal',
                'isRead' => false,
                'isExpanded' => false,
                'visitDate' => $row['created_at'],
                'staffUserId' => null,
                'type' => 'system'
            ];
        }
    }
    
    // Get traditional medical visit notifications
    $query = "SELECT 
                mv.visit_id,
                mv.student_id,
                mv.visit_datetime as visit_date,
                mv.visit_type,
                mv.notes,
                mv.chief_complaint,
                mv.created_at,
                u_student.full_name as student_name,
                s.student_number,
                u_staff.full_name as staff_name,
                cs.position as staff_position,
                u_staff.user_id as staff_user_id
              FROM medical_visits mv
              INNER JOIN students s ON mv.student_id = s.student_id
              INNER JOIN users u_student ON s.user_id = u_student.user_id
              INNER JOIN clinic_staff cs ON mv.clinic_staff_id = cs.clinic_staff_id
              INNER JOIN users u_staff ON cs.user_id = u_staff.user_id
              WHERE mv.student_id IN ($placeholders)
              AND mv.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
              ORDER BY mv.created_at DESC
              LIMIT 50";
    
    $stmt = $db->prepare($query);
    
    // Bind parameters
    foreach ($student_ids as $index => $student_id) {
        $stmt->bindValue($index + 1, $student_id, PDO::PARAM_INT);
    }
    
    $stmt->execute();
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $created_at = new DateTime($row['created_at']);
        $now = new DateTime();
        $interval = $now->diff($created_at);
        
        // Format time ago
        if ($interval->days > 0) {
            $time_ago = $interval->days . 'd ago';
        } elseif ($interval->h > 0) {
            $time_ago = $interval->h . 'h ago';
        } elseif ($interval->i > 0) {
            $time_ago = $interval->i . 'm ago';
        } else {
            $time_ago = 'Just now';
        }
        
        $notifications[] = [
            'id' => intval($row['visit_id']),
            'senderName' => $row['staff_name'],
            'senderRole' => $row['staff_position'],
            'studentName' => $row['student_name'],
            'studentNumber' => $row['student_number'],
            'subject' => ucfirst($row['visit_type']) . ' Visit',
            'previewText' => substr($row['chief_complaint'] ?? $row['notes'] ?? '', 0, 100) . (strlen($row['chief_complaint'] ?? $row['notes'] ?? '') > 100 ? '...' : ''),
            'fullMessage' => $row['notes'] ?? $row['chief_complaint'] ?? '',
            'timeAgo' => $time_ago,
            'fullDate' => $created_at->format('M d, Y \a\t h:i A'),
            'visitType' => ucfirst($row['visit_type']),
            'priority' => (strpos(strtolower($row['notes'] ?? ''), 'urgent') !== false || 
                          strpos(strtolower($row['notes'] ?? ''), 'critical') !== false) ? 'urgent' : 'normal',
            'isRead' => false,
            'isExpanded' => false,
            'visitDate' => $row['visit_date'],
            'staffUserId' => intval($row['staff_user_id']),
            'type' => 'visit'
        ];
    }
    
    // Sort all notifications by creation date (newest first)
    usort($notifications, function($a, $b) {
        return strtotime($b['fullDate']) - strtotime($a['fullDate']);
    });
    
    error_log("Found " . count($notifications) . " notifications");
    
    $auth->logActivity('View Notifications', 'Viewed adviser notifications - ' . count($notifications) . ' notifications');
    
    echo json_encode([
        'success' => true,
        'notifications' => $notifications,
        'total' => count($notifications)
    ]);

} catch (PDOException $e) {
    error_log("❌ PDOException: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("❌ Exception: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
