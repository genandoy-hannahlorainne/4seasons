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
    // Get students with allergies
    $query = "SELECT s.student_id, s.first_name, s.last_name, s.student_number,
                     a.allergy_text, a.severity
              FROM students s
              JOIN allergies a ON s.student_id = a.student_id
              WHERE s.is_active = 1
              ORDER BY s.last_name, s.first_name";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    // Group allergies by student
    $studentsMap = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $studentId = $row['student_id'];
        $fullName = trim($row['first_name'] . ' ' . $row['last_name']);
        
        if (!isset($studentsMap[$studentId])) {
            $studentsMap[$studentId] = [
                'student_id' => $studentId,
                'name' => $fullName,
                'student_number' => $row['student_number'],
                'allergies' => []
            ];
        }
        
        $allergyText = $row['allergy_text'];
        if ($row['severity'] && $row['severity'] !== 'Moderate') {
            $allergyText .= ' (' . $row['severity'] . ')';
        }
        $studentsMap[$studentId]['allergies'][] = $allergyText;
    }
    
    $students = array_values($studentsMap);
    
    echo json_encode([
        'success' => true,
        'students' => $students,
        'total' => count($students)
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
