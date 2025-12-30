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

$searchTerm = isset($_GET['q']) ? trim($_GET['q']) : '';

if (strlen($searchTerm) < 2) {
    echo json_encode(['success' => true, 'students' => []]);
    exit();
}

try {
    $searchPattern = '%' . $searchTerm . '%';
    
    $query = "SELECT s.student_id, s.student_number, s.first_name, s.middle_name, s.last_name,
                     s.gender, s.grade_level, s.section, s.emergency_contact,
                     (SELECT p.phone FROM parents p 
                      JOIN student_parent sp ON p.parent_id = sp.parent_id 
                      WHERE sp.student_id = s.student_id LIMIT 1) as parent_phone
              FROM students s
              WHERE s.is_active = 1 
              AND (s.student_number LIKE :search1 
                   OR s.first_name LIKE :search2 
                   OR s.last_name LIKE :search3
                   OR CONCAT(s.first_name, ' ', s.last_name) LIKE :search4)
              ORDER BY s.last_name, s.first_name
              LIMIT 10";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':search1', $searchPattern);
    $stmt->bindParam(':search2', $searchPattern);
    $stmt->bindParam(':search3', $searchPattern);
    $stmt->bindParam(':search4', $searchPattern);
    $stmt->execute();
    
    $students = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $fullName = trim($row['first_name'] . ' ' . ($row['middle_name'] ? $row['middle_name'] . ' ' : '') . $row['last_name']);
        $gradeSection = 'Grade ' . $row['grade_level'] . ' - ' . $row['section'];
        
        // Use parent_phone if available, otherwise use emergency_contact
        $parentPhone = $row['parent_phone'] ?: $row['emergency_contact'];
        
        $students[] = [
            'student_id' => $row['student_id'],
            'student_number' => $row['student_number'],
            'full_name' => $fullName,
            'grade_section' => $gradeSection,
            'avatar' => $row['gender'] === 'F' ? 'assets/user-female.png' : 'assets/user-male.png',
            'parentPhone' => $parentPhone
        ];
    }
    
    echo json_encode(['success' => true, 'students' => $students]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
