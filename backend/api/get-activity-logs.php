<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 20;
    $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
    
    // Fetch activity logs with user information
    $query = "SELECT 
                al.log_id,
                al.user_id,
                al.action,
                al.details,
                al.ip_address,
                al.created_at,
                u.username,
                u.full_name,
                r.role_name
              FROM activity_logs al
              LEFT JOIN users u ON al.user_id = u.user_id
              LEFT JOIN roles r ON u.role_id = r.role_id
              ORDER BY al.created_at DESC
              LIMIT :limit OFFSET :offset";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    
    $activities = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        // Determine activity type based on action
        $type = 'system';
        if (strpos(strtolower($row['action']), 'login') !== false) {
            $type = 'user';
        } elseif (strpos(strtolower($row['action']), 'medical') !== false || 
                  strpos(strtolower($row['action']), 'visit') !== false) {
            $type = 'record';
        } elseif (strpos(strtolower($row['action']), 'report') !== false) {
            $type = 'report';
        }
        
        $activities[] = [
            'log_id' => intval($row['log_id']),
            'user_id' => $row['user_id'] ? intval($row['user_id']) : null,
            'action' => $row['action'],
            'details' => $row['details'],
            'ip_address' => $row['ip_address'],
            'timestamp' => $row['created_at'],
            'user' => $row['full_name'] ?: $row['username'] ?: 'System',
            'role' => $row['role_name'] ?: 'System',
            'type' => $type
        ];
    }
    
    // Get total count
    $countQuery = "SELECT COUNT(*) as total FROM activity_logs";
    $countStmt = $db->prepare($countQuery);
    $countStmt->execute();
    $countResult = $countStmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'activities' => $activities,
        'total' => intval($countResult['total']),
        'limit' => $limit,
        'offset' => $offset
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
