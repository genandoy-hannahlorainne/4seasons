<?php
// Include CORS handler first
require_once '../cors.php';

header('Content-Type: application/json');

require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get staff_id from request
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->user_id)) {
        echo json_encode([
            'success' => false,
            'message' => 'User ID is required'
        ]);
        exit();
    }
    
    $user_id = $data->user_id;
    
    // Get clinic staff info
    $query = "SELECT cs.clinic_staff_id, cs.staff_code, cs.position, 
                     u.username, u.email, u.phone, u.full_name
              FROM clinic_staff cs
              JOIN users u ON cs.user_id = u.user_id
              WHERE cs.user_id = :user_id AND cs.is_active = 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    
    $staff = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$staff) {
        echo json_encode([
            'success' => false,
            'message' => 'Staff not found'
        ]);
        exit();
    }
    
    // Get statistics
    // Total students
    $query = "SELECT COUNT(*) as total FROM students WHERE is_active = 1";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $totalStudents = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Students fit for activities (no recent restrictions)
    $query = "SELECT COUNT(DISTINCT s.student_id) as count
              FROM students s
              WHERE s.is_active = 1
              AND s.student_id NOT IN (
                  SELECT DISTINCT mv.student_id 
                  FROM medical_visits mv
                  WHERE mv.status = 'Open'
                  AND mv.visit_type = 'Emergency'
                  AND mv.visit_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
              )";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $fitForActivities = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Pending assessments (open visits)
    $query = "SELECT COUNT(*) as count
              FROM medical_visits
              WHERE status = 'Open'";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $pendingAssessment = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Restricted activities (students with recent emergency visits)
    $query = "SELECT COUNT(DISTINCT student_id) as count
              FROM medical_visits
              WHERE status = 'Open'
              AND visit_type = 'Emergency'
              AND visit_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $restrictedActivities = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Special medical needs (students with allergies or chronic conditions)
    $query = "SELECT COUNT(DISTINCT student_id) as count
              FROM allergies
              WHERE severity IN ('Moderate', 'Severe')";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $specialMedicalNeeds = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Get student health records with latest visit info
    $query = "SELECT 
                s.student_id,
                CONCAT(s.first_name, ' ', s.last_name) as name,
                s.student_number as lrn,
                s.grade_level,
                s.section,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM medical_visits mv 
                        WHERE mv.student_id = s.student_id 
                        AND mv.status = 'Open'
                        AND mv.visit_type = 'Emergency'
                        AND mv.visit_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                    ) THEN 'Restricted'
                    ELSE 'Fit'
                END as status,
                (SELECT MAX(mv.visit_datetime) 
                 FROM medical_visits mv 
                 WHERE mv.student_id = s.student_id) as last_checkup,
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM allergies a 
                        WHERE a.student_id = s.student_id
                    ) THEN 'Has allergies'
                    ELSE 'No restrictions'
                END as notes
              FROM students s
              WHERE s.is_active = 1
              ORDER BY s.last_name, s.first_name
              LIMIT 100";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format dates
    foreach ($students as &$student) {
        if ($student['last_checkup']) {
            $date = new DateTime($student['last_checkup']);
            $student['last_checkup'] = $date->format('M d, Y');
        } else {
            $student['last_checkup'] = 'No visits';
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'staff' => $staff,
            'statistics' => [
                'total_students' => $totalStudents,
                'fit_for_activities' => $fitForActivities,
                'pending_assessment' => $pendingAssessment,
                'restricted_activities' => $restrictedActivities,
                'special_medical_needs' => $specialMedicalNeeds
            ],
            'students' => $students
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>
