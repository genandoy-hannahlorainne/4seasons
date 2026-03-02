<?php
/**
 * Get reports data - Legacy API endpoint for all reports
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, user_id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/database.php';

// Create database connection
$database = new Database();
$pdo = $database->getConnection();

if (!$pdo) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ]);
    exit;
}

/**
 * Get medical report data
 */
function getMedicalReport($pdo, $startDate, $endDate) {
    $sql = "
        SELECT 
            DATE(visit_datetime) as date,
            COUNT(*) as total_visits,
            COUNT(DISTINCT student_id) as unique_students,
            COUNT(DISTINCT clinic_staff_id) as staff_involved
        FROM medical_visits 
        WHERE DATE(visit_datetime) BETWEEN ? AND ?
        GROUP BY DATE(visit_datetime)
        ORDER BY date DESC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$startDate, $endDate]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return array_map(function($row) {
        return [
            'date' => $row['date'],
            'total_visits' => (int)$row['total_visits'],
            'unique_students' => (int)$row['unique_students'],
            'staff_involved' => (int)$row['staff_involved']
        ];
    }, $results);
}

/**
 * Get summary report data
 */
function getSummaryReport($pdo) {
    // Get total students
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM users u 
        JOIN roles r ON u.role_id = r.role_id 
        WHERE r.role_name = 'Student'
    ");
    $stmt->execute();
    $totalStudents = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Get total advisers
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM users u 
        JOIN roles r ON u.role_id = r.role_id 
        WHERE r.role_name = 'Adviser'
    ");
    $stmt->execute();
    $totalAdvisers = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Get total staff (clinic staff only)
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM users u 
        JOIN roles r ON u.role_id = r.role_id 
        WHERE r.role_name = 'Clinic Staff'
    ");
    $stmt->execute();
    $totalStaff = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Get active users
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE is_active = 1");
    $stmt->execute();
    $activeUsers = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Get inactive users
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE is_active = 0");
    $stmt->execute();
    $inactiveUsers = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Get total medical visits
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM medical_visits");
    $stmt->execute();
    $totalVisits = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Get total allergies
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM allergies");
    $stmt->execute();
    $totalAllergies = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    return [
        'total_students' => (int)$totalStudents,
        'total_advisers' => (int)$totalAdvisers,
        'total_staff' => (int)$totalStaff,
        'active_users' => (int)$activeUsers,
        'inactive_users' => (int)$inactiveUsers,
        'total_visits' => (int)$totalVisits,
        'total_allergies' => (int)$totalAllergies
    ];
}

/**
 * Get users report data
 */
function getUsersReport($pdo) {
    $sql = "
        SELECT 
            r.role_name as role,
            COUNT(u.user_id) as total,
            SUM(CASE WHEN u.is_active = 1 THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN u.is_active = 0 THEN 1 ELSE 0 END) as inactive
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE r.role_name IN ('Student', 'Adviser', 'Clinic Staff', 'Admin')
        GROUP BY r.role_name
        ORDER BY r.role_name
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return array_map(function($row) {
        return [
            'role' => $row['role'],
            'total' => (int)$row['total'],
            'active' => (int)$row['active'],
            'inactive' => (int)$row['inactive']
        ];
    }, $results);
}

/**
 * Get registration report data
 */
function getRegistrationReport($pdo, $startDate, $endDate) {
    $sql = "
        SELECT 
            DATE(u.created_at) as date,
            r.role_name as role,
            COUNT(u.user_id) as count
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE DATE(u.created_at) BETWEEN ? AND ?
        GROUP BY DATE(u.created_at), r.role_name
        ORDER BY date DESC, r.role_name
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$startDate, $endDate]);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return array_map(function($row) {
        return [
            'date' => $row['date'],
            'role' => $row['role'],
            'count' => (int)$row['count']
        ];
    }, $results);
}

/**
 * Get allergies report data
 */
function getAllergiesReport($pdo) {
    $sql = "
        SELECT 
            allergy_text as allergy,
            severity,
            COUNT(*) as count
        FROM allergies
        GROUP BY allergy_text, severity
        ORDER BY count DESC
        LIMIT 20
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return array_map(function($row) {
        return [
            'allergy' => $row['allergy'],
            'severity' => $row['severity'],
            'count' => (int)$row['count']
        ];
    }, $results);
}

try {
    $reportType = $_GET['type'] ?? 'summary';
    $startDate = $_GET['start_date'] ?? date('Y-m-01');
    $endDate = $_GET['end_date'] ?? date('Y-m-d');
    
    switch ($reportType) {
        case 'medical':
            $medicalStats = getMedicalReport($pdo, $startDate, $endDate);
            echo json_encode([
                'success' => true,
                'data' => $medicalStats,
                'message' => 'Medical report retrieved successfully'
            ]);
            break;
            
        case 'summary':
            $summary = getSummaryReport($pdo);
            echo json_encode([
                'success' => true,
                'data' => $summary,
                'message' => 'Summary report retrieved successfully'
            ]);
            break;
            
        case 'users':
            $users = getUsersReport($pdo);
            echo json_encode([
                'success' => true,
                'data' => $users,
                'message' => 'Users report retrieved successfully'
            ]);
            break;
            
        case 'registration':
            $registration = getRegistrationReport($pdo, $startDate, $endDate);
            echo json_encode([
                'success' => true,
                'data' => $registration,
                'message' => 'Registration report retrieved successfully'
            ]);
            break;
            
        case 'allergies':
            $allergies = getAllergiesReport($pdo);
            echo json_encode([
                'success' => true,
                'data' => $allergies,
                'message' => 'Allergies report retrieved successfully'
            ]);
            break;
            
        default:
            echo json_encode([
                'success' => false,
                'message' => 'Invalid report type'
            ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to generate report: ' . $e->getMessage()
    ]);
}
?>