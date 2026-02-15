<?php
// Handle CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Get total users count
    $usersQuery = "SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL";
    $usersStmt = $db->prepare($usersQuery);
    $usersStmt->execute();
    $totalUsers = $usersStmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Get total students count
    $studentsQuery = "SELECT COUNT(*) as total FROM students WHERE is_active = 1";
    $studentsStmt = $db->prepare($studentsQuery);
    $studentsStmt->execute();
    $totalStudents = $studentsStmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Get total advisers count
    $advisersQuery = "SELECT COUNT(*) as total FROM advisers WHERE is_active = 1";
    $advisersStmt = $db->prepare($advisersQuery);
    $advisersStmt->execute();
    $totalAdvisers = $advisersStmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Get total clinic staff count
    $staffQuery = "SELECT COUNT(*) as total FROM clinic_staff WHERE is_active = 1";
    $staffStmt = $db->prepare($staffQuery);
    $staffStmt->execute();
    $totalStaff = $staffStmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Get recent medical visits
    $visitsQuery = "SELECT 
                        mv.visit_id,
                        s.first_name,
                        s.last_name,
                        s.student_number,
                        mv.visit_datetime,
                        mv.notes as diagnosis,
                        cs.position
                    FROM medical_visits mv
                    JOIN students s ON mv.student_id = s.student_id
                    JOIN clinic_staff cs ON mv.clinic_staff_id = cs.clinic_staff_id
                    ORDER BY mv.visit_datetime DESC
                    LIMIT 10";
    $visitsStmt = $db->prepare($visitsQuery);
    $visitsStmt->execute();
    $recentVisits = $visitsStmt->fetchAll(PDO::FETCH_ASSOC);

    // Get recent users
    $recentUsersQuery = "SELECT 
                            u.user_id,
                            u.username,
                            u.full_name,
                            r.role_name,
                            u.created_at,
                            u.is_active
                        FROM users u
                        JOIN roles r ON u.role_id = r.role_id
                        WHERE u.deleted_at IS NULL
                        ORDER BY u.created_at DESC
                        LIMIT 5";
    $recentUsersStmt = $db->prepare($recentUsersQuery);
    $recentUsersStmt->execute();
    $recentUsers = $recentUsersStmt->fetchAll(PDO::FETCH_ASSOC);

    // Get students with allergies
    $allergiesQuery = "SELECT COUNT(DISTINCT s.student_id) as total 
                       FROM students s
                       JOIN allergies a ON s.student_id = a.student_id
                       WHERE s.is_active = 1";
    $allergiesStmt = $db->prepare($allergiesQuery);
    $allergiesStmt->execute();
    $studentsWithAllergies = $allergiesStmt->fetch(PDO::FETCH_ASSOC)['total'];

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'stats' => [
            'totalUsers' => (int)$totalUsers,
            'totalStudents' => (int)$totalStudents,
            'totalAdvisers' => (int)$totalAdvisers,
            'totalStaff' => (int)$totalStaff,
            'studentsWithAllergies' => (int)$studentsWithAllergies
        ],
        'recentVisits' => $recentVisits,
        'recentUsers' => $recentUsers
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching dashboard stats: ' . $e->getMessage()
    ]);
}
?>
