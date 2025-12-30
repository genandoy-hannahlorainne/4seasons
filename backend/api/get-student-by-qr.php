<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get student_id or student_number from request
$student_id = isset($_GET['student_id']) ? $_GET['student_id'] : null;
$student_number = isset($_GET['student_number']) ? $_GET['student_number'] : null;

if (!$student_id && !$student_number) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'student_id or student_number is required']);
    exit();
}

try {
    // Build query based on provided parameter
    if ($student_id) {
        $query = "SELECT s.student_id, s.student_number, s.first_name, s.middle_name, s.last_name,
                         s.gender, s.birth_date, s.grade_level, s.section, s.blood_type,
                         s.emergency_contact, s.contact_number, s.address
                  FROM students s
                  WHERE s.student_id = :student_id AND s.is_active = 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
    } else {
        $query = "SELECT s.student_id, s.student_number, s.first_name, s.middle_name, s.last_name,
                         s.gender, s.birth_date, s.grade_level, s.section, s.blood_type,
                         s.emergency_contact, s.contact_number, s.address
                  FROM students s
                  WHERE s.student_number = :student_number AND s.is_active = 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':student_number', $student_number);
    }
    
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get full name
        $fullName = trim($student['first_name'] . ' ' . ($student['middle_name'] ? $student['middle_name'] . ' ' : '') . $student['last_name']);
        
        // Get allergies
        $allergyQuery = "SELECT allergy_text FROM allergies WHERE student_id = :student_id";
        $allergyStmt = $db->prepare($allergyQuery);
        $allergyStmt->bindParam(':student_id', $student['student_id']);
        $allergyStmt->execute();
        $allergies = $allergyStmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Get last visit
        $visitQuery = "SELECT visit_datetime, chief_complaint, diagnosis, status 
                       FROM medical_visits 
                       WHERE student_id = :student_id 
                       ORDER BY visit_datetime DESC LIMIT 1";
        $visitStmt = $db->prepare($visitQuery);
        $visitStmt->bindParam(':student_id', $student['student_id']);
        $visitStmt->execute();
        $lastVisit = $visitStmt->fetch(PDO::FETCH_ASSOC);
        
        // Format grade and section
        $gradeSection = 'Grade ' . $student['grade_level'] . ' - ' . $student['section'];
        
        echo json_encode([
            'success' => true,
            'student' => [
                'student_id' => $student['student_id'],
                'student_number' => $student['student_number'],
                'full_name' => $fullName,
                'first_name' => $student['first_name'],
                'middle_name' => $student['middle_name'],
                'last_name' => $student['last_name'],
                'gender' => $student['gender'],
                'birth_date' => $student['birth_date'],
                'grade_level' => $student['grade_level'],
                'section' => $student['section'],
                'grade_section' => $gradeSection,
                'blood_type' => $student['blood_type'],
                'emergency_contact' => $student['emergency_contact'],
                'contact_number' => $student['contact_number'],
                'address' => $student['address'],
                'allergies' => $allergies,
                'last_visit' => $lastVisit,
                'avatar' => $student['gender'] === 'F' ? 'assets/user-female.png' : 'assets/user-male.png'
            ]
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Student not found']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
