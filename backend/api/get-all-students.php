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
    // Get all active students with their last visit and allergy info
    $query = "SELECT s.student_id, s.student_number, s.first_name, s.middle_name, s.last_name,
                     s.gender, s.grade_level, s.section, s.birth_date, s.blood_type,
                     (SELECT MAX(visit_datetime) FROM medical_visits mv WHERE mv.student_id = s.student_id) as last_visit,
                     (SELECT COUNT(*) FROM allergies a WHERE a.student_id = s.student_id) as allergy_count
              FROM students s
              WHERE s.is_active = 1
              ORDER BY s.last_name, s.first_name";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $students = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $fullName = trim($row['first_name'] . ' ' . ($row['middle_name'] ? $row['middle_name'] . ' ' : '') . $row['last_name']);
        $gradeSection = 'Grade ' . $row['grade_level'] . ' - ' . $row['section'];
        
        // Format last visit date
        $lastVisit = null;
        if ($row['last_visit']) {
            $lastVisit = date('M d, Y', strtotime($row['last_visit']));
        }
        
        $students[] = [
            'id' => intval($row['student_id']),
            'studentNumber' => $row['student_number'],
            'name' => $fullName,
            'gradeSection' => $gradeSection,
            'gender' => $row['gender'],
            'birthDate' => $row['birth_date'],
            'bloodType' => $row['blood_type'],
            'lastVisit' => $lastVisit,
            'hasAllergies' => intval($row['allergy_count']) > 0,
            'avatar' => $row['gender'] === 'F' ? 'assets/user-female.png' : 'assets/user-male.png'
        ];
    }
    
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
