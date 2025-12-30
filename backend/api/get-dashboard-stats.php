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
    // Get total students count
    $studentsQuery = "SELECT COUNT(*) as total FROM students WHERE is_active = 1";
    $studentsStmt = $db->prepare($studentsQuery);
    $studentsStmt->execute();
    $studentsResult = $studentsStmt->fetch(PDO::FETCH_ASSOC);
    $totalStudents = $studentsResult['total'];

    // Get total visits count
    $visitsQuery = "SELECT COUNT(*) as total FROM medical_visits";
    $visitsStmt = $db->prepare($visitsQuery);
    $visitsStmt->execute();
    $visitsResult = $visitsStmt->fetch(PDO::FETCH_ASSOC);
    $totalVisits = $visitsResult['total'];

    // Get today's visits count
    $todayQuery = "SELECT COUNT(*) as total FROM medical_visits WHERE DATE(visit_datetime) = CURDATE()";
    $todayStmt = $db->prepare($todayQuery);
    $todayStmt->execute();
    $todayResult = $todayStmt->fetch(PDO::FETCH_ASSOC);
    $todayVisits = $todayResult['total'];

    // Get pending visits count (Open status)
    $pendingQuery = "SELECT COUNT(*) as total FROM medical_visits WHERE status = 'Open'";
    $pendingStmt = $db->prepare($pendingQuery);
    $pendingStmt->execute();
    $pendingResult = $pendingStmt->fetch(PDO::FETCH_ASSOC);
    $pendingVisits = $pendingResult['total'];

    echo json_encode([
        'success' => true,
        'totalStudents' => intval($totalStudents),
        'totalVisits' => intval($totalVisits),
        'todayVisits' => intval($todayVisits),
        'pendingVisits' => intval($pendingVisits)
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
