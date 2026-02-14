<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get user_id from request
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->user_id)) {
        echo json_encode([
            'success' => false,
            'message' => 'User ID is required'
        ]);
        exit();
    }
    
    $user_id = $data->user_id;
    
    // Get adviser info
    $query = "SELECT a.adviser_id, a.first_name, a.last_name, a.employee_number, 
                     a.contact_phone, u.username, u.email,
                     CONCAT(a.first_name, ' ', a.last_name) as full_name
              FROM advisers a
              JOIN users u ON a.user_id = u.user_id
              WHERE a.user_id = :user_id AND a.is_active = 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    
    $adviser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$adviser) {
        echo json_encode([
            'success' => false,
            'message' => 'Adviser not found'
        ]);
        exit();
    }
    
    $adviser_id = $adviser['adviser_id'];
    
    // Get advised students
    $query = "SELECT 
                s.student_id,
                CONCAT(s.first_name, ' ', s.last_name) as name,
                s.student_number,
                s.grade_level,
                s.section,
                s.gender,
                s.blood_type,
                CASE WHEN s.is_active = 1 THEN 'Active' ELSE 'Inactive' END as status,
                (SELECT MAX(mv.visit_datetime) 
                 FROM medical_visits mv 
                 WHERE mv.student_id = s.student_id) as last_visit,
                (SELECT COUNT(*) 
                 FROM allergies a 
                 WHERE a.student_id = s.student_id) as allergy_count
              FROM students s
              JOIN student_adviser sa ON s.student_id = sa.student_id
              WHERE sa.adviser_id = :adviser_id
              AND s.is_active = 1
              ORDER BY s.last_name, s.first_name";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':adviser_id', $adviser_id);
    $stmt->execute();
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format dates
    foreach ($students as &$student) {
        if ($student['last_visit']) {
            $date = new DateTime($student['last_visit']);
            $student['last_visit'] = $date->format('M d, Y');
        } else {
            $student['last_visit'] = 'No visits';
        }
    }
    
    // Get recent medical visits for advised students
    $query = "SELECT 
                mv.visit_id,
                mv.visit_datetime,
                mv.visit_type,
                mv.notes as diagnosis,
                mv.status,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                s.student_number,
                s.grade_level,
                s.section
              FROM medical_visits mv
              JOIN students s ON mv.student_id = s.student_id
              JOIN student_adviser sa ON s.student_id = sa.student_id
              WHERE sa.adviser_id = :adviser_id
              AND mv.visit_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
              ORDER BY mv.visit_datetime DESC
              LIMIT 20";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':adviser_id', $adviser_id);
    $stmt->execute();
    $recent_visits = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format visit dates
    foreach ($recent_visits as &$visit) {
        $date = new DateTime($visit['visit_datetime']);
        $visit['visit_date'] = $date->format('M d, Y');
        $visit['visit_time'] = $date->format('h:i A');
    }
    
    // Get statistics
    $total_students = count($students);
    
    // Students with recent visits (last 30 days)
    $query = "SELECT COUNT(DISTINCT s.student_id) as count
              FROM students s
              JOIN student_adviser sa ON s.student_id = sa.student_id
              JOIN medical_visits mv ON s.student_id = mv.student_id
              WHERE sa.adviser_id = :adviser_id
              AND mv.visit_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':adviser_id', $adviser_id);
    $stmt->execute();
    $students_with_visits = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Students with allergies
    $query = "SELECT COUNT(DISTINCT s.student_id) as count
              FROM students s
              JOIN student_adviser sa ON s.student_id = sa.student_id
              JOIN allergies a ON s.student_id = a.student_id
              WHERE sa.adviser_id = :adviser_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':adviser_id', $adviser_id);
    $stmt->execute();
    $students_with_allergies = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Open/pending visits
    $query = "SELECT COUNT(*) as count
              FROM medical_visits mv
              JOIN students s ON mv.student_id = s.student_id
              JOIN student_adviser sa ON s.student_id = sa.student_id
              WHERE sa.adviser_id = :adviser_id
              AND mv.status = 'Open'";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':adviser_id', $adviser_id);
    $stmt->execute();
    $pending_visits = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    echo json_encode([
        'success' => true,
        'data' => [
            'adviser' => $adviser,
            'statistics' => [
                'total_students' => $total_students,
                'students_with_visits' => $students_with_visits,
                'students_with_allergies' => $students_with_allergies,
                'pending_visits' => $pending_visits
            ],
            'students' => $students,
            'recent_visits' => $recent_visits
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>
