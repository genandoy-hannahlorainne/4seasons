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

$studentId = isset($_GET['student_id']) ? $_GET['student_id'] : null;
$userId = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if (!$studentId && $userId) {
    $userStudentQuery = "SELECT student_id FROM students WHERE user_id = :user_id AND is_active = 1 LIMIT 1";
    $userStudentStmt = $db->prepare($userStudentQuery);
    $userStudentStmt->bindParam(':user_id', $userId);
    $userStudentStmt->execute();
    
    if ($userStudentStmt->rowCount() > 0) {
        $row = $userStudentStmt->fetch(PDO::FETCH_ASSOC);
        $studentId = intval($row['student_id']);
    }
}

try {
    $query = "SELECT mv.visit_id, mv.student_id, mv.visit_datetime, mv.visit_type, mv.chief_complaint, mv.notes, mv.status, s.student_number, s.first_name, s.last_name, s.gender, s.grade_level, s.section FROM medical_visits mv JOIN students s ON mv.student_id = s.student_id WHERE 1=1";
    
    $params = [];
    
    if ($studentId) {
        $query .= " AND mv.student_id = :student_id";
        $params[':student_id'] = $studentId;
    }
    
    $query .= " ORDER BY mv.visit_datetime DESC LIMIT 50";
    
    $stmt = $db->prepare($query);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->execute();
    
    $visits = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { 
        $visits[] = $row;
    }
    
    http_response_code(200);
    echo json_encode(['success' => true, 'data' => $visits, 'total' => count($visits)]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
