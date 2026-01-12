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
    $reportType = isset($_GET['type']) ? $_GET['type'] : 'summary';
    $startDate = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-01');
    $endDate = isset($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-d');
    
    if ($reportType === 'summary') {
        // Get summary statistics
        $query = "SELECT 
                    (SELECT COUNT(*) FROM users WHERE role_id = (SELECT role_id FROM roles WHERE LOWER(role_name) = 'student')) as total_students,
                    (SELECT COUNT(*) FROM users WHERE role_id = (SELECT role_id FROM roles WHERE LOWER(role_name) = 'adviser')) as total_advisers,
                    (SELECT COUNT(*) FROM users WHERE role_id = (SELECT role_id FROM roles WHERE LOWER(role_name) = 'clinic_staff')) as total_staff,
                    (SELECT COUNT(*) FROM users WHERE is_active = 1) as active_users,
                    (SELECT COUNT(*) FROM users WHERE is_active = 0) as inactive_users,
                    (SELECT COUNT(*) FROM medical_visits) as total_visits,
                    (SELECT COUNT(*) FROM allergies) as total_allergies";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        $summary = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'type' => 'summary', 'data' => $summary]);
        
    } elseif ($reportType === 'users') {
        // Get user statistics by role
        $query = "SELECT 
                    r.role_name,
                    COUNT(u.user_id) as count,
                    SUM(CASE WHEN u.is_active = 1 THEN 1 ELSE 0 END) as active,
                    SUM(CASE WHEN u.is_active = 0 THEN 1 ELSE 0 END) as inactive
                  FROM users u
                  JOIN roles r ON u.role_id = r.role_id
                  WHERE r.role_name IN ('student', 'adviser', 'clinic_staff')
                  GROUP BY r.role_name";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $userStats = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $userStats[] = [
                'role' => $row['role_name'],
                'total' => intval($row['count']),
                'active' => intval($row['active']),
                'inactive' => intval($row['inactive'])
            ];
        }
        
        echo json_encode(['success' => true, 'type' => 'users', 'data' => $userStats]);
        
    } elseif ($reportType === 'medical') {
        // Get medical records statistics
        $query = "SELECT 
                    COUNT(*) as total_visits,
                    COUNT(DISTINCT student_id) as unique_students,
                    COUNT(DISTINCT clinic_staff_id) as staff_involved,
                    DATE(visit_datetime) as visit_date
                  FROM medical_visits
                  WHERE DATE(visit_datetime) BETWEEN ? AND ?
                  GROUP BY DATE(visit_datetime)
                  ORDER BY visit_date DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute([$startDate, $endDate]);
        
        $medicalStats = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $medicalStats[] = [
                'date' => $row['visit_date'],
                'total_visits' => intval($row['total_visits']),
                'unique_students' => intval($row['unique_students']),
                'staff_involved' => intval($row['staff_involved'])
            ];
        }
        
        echo json_encode(['success' => true, 'type' => 'medical', 'data' => $medicalStats]);
        
    } elseif ($reportType === 'registration') {
        // Get user registration statistics
        $query = "SELECT 
                    DATE(created_at) as registration_date,
                    r.role_name,
                    COUNT(u.user_id) as count
                  FROM users u
                  JOIN roles r ON u.role_id = r.role_id
                  WHERE DATE(u.created_at) BETWEEN ? AND ?
                  GROUP BY DATE(u.created_at), r.role_name
                  ORDER BY registration_date DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute([$startDate, $endDate]);
        
        $registrationStats = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $registrationStats[] = [
                'date' => $row['registration_date'],
                'role' => $row['role_name'],
                'count' => intval($row['count'])
            ];
        }
        
        echo json_encode(['success' => true, 'type' => 'registration', 'data' => $registrationStats]);
        
    } elseif ($reportType === 'allergies') {
        // Get allergy statistics
        $query = "SELECT 
                    allergy_text,
                    severity,
                    COUNT(*) as count
                  FROM allergies
                  GROUP BY allergy_text, severity
                  ORDER BY count DESC
                  LIMIT 20";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $allergyStats = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $allergyStats[] = [
                'allergy' => $row['allergy_text'],
                'severity' => $row['severity'],
                'count' => intval($row['count'])
            ];
        }
        
        echo json_encode(['success' => true, 'type' => 'allergies', 'data' => $allergyStats]);
        
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid report type']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
