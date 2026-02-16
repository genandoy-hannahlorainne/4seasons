<?php
/**
 * Get Students by Section
 * GET /api/admin/sections/get-students.php?section_id=X
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, X-Requested-With");
header("Access-Control-Max-Age: 3600");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../../config/database.php';
require_once '../../../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

$auth = new Auth($database);

if (!$auth->hasRole('Admin') && !$auth->hasRole('Adviser')) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Access denied. Admin or Adviser role required.'
    ]);
    exit();
}

try {
    $sectionId = $_GET['section_id'] ?? null;
    
    if (!$sectionId) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'section_id is required'
        ]);
        exit;
    }
    
    // Get section info
    $sectionQuery = "SELECT 
                        s.id,
                        s.section_name,
                        s.capacity,
                        s.current_enrollment,
                        gl.level_name,
                        gl.level_number,
                        sy.year_name,
                        CONCAT(adv.first_name, ' ', adv.last_name) as adviser_name
                     FROM sections s
                     INNER JOIN grade_levels gl ON s.grade_level_id = gl.id
                     INNER JOIN school_years sy ON s.school_year_id = sy.id
                     LEFT JOIN advisers adv ON s.adviser_id = adv.user_id
                     WHERE s.id = :section_id";
    
    $sectionStmt = $db->prepare($sectionQuery);
    $sectionStmt->bindParam(':section_id', $sectionId);
    $sectionStmt->execute();
    $section = $sectionStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$section) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Section not found'
        ]);
        exit;
    }
    
    // Get students in this section
    $studentsQuery = "SELECT 
                        s.student_id,
                        s.student_number,
                        s.first_name,
                        s.middle_name,
                        s.last_name,
                        s.birth_date,
                        s.gender,
                        s.blood_type,
                        s.emergency_contact,
                        s.emergency_contact_phone,
                        s.enrollment_status,
                        s.created_at,
                        u.email,
                        u.phone as user_phone,
                        u.is_active as user_active
                      FROM students s
                      LEFT JOIN users u ON s.user_id = u.user_id
                      WHERE s.current_section_id = :section_id 
                        AND s.is_active = 1
                      ORDER BY s.last_name, s.first_name";
    
    $studentsStmt = $db->prepare($studentsQuery);
    $studentsStmt->bindParam(':section_id', $sectionId);
    $studentsStmt->execute();
    $students = $studentsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get additional data for each student
    foreach ($students as &$student) {
        // Format full name
        $student['full_name'] = trim($student['first_name'] . ' ' . 
                                   ($student['middle_name'] ? $student['middle_name'] . ' ' : '') . 
                                   $student['last_name']);
        
        // Get allergies
        $allergyQuery = "SELECT allergy_text FROM allergies WHERE student_id = :student_id";
        $allergyStmt = $db->prepare($allergyQuery);
        $allergyStmt->bindParam(':student_id', $student['student_id']);
        $allergyStmt->execute();
        $allergies = $allergyStmt->fetchAll(PDO::FETCH_COLUMN);
        $student['allergies'] = $allergies;
        
        // Get last clinic visit
        $visitQuery = "SELECT visit_id, visit_datetime, notes as diagnosis, status 
                       FROM medical_visits 
                       WHERE student_id = :student_id 
                       ORDER BY visit_datetime DESC 
                       LIMIT 1";
        $visitStmt = $db->prepare($visitQuery);
        $visitStmt->bindParam(':student_id', $student['student_id']);
        $visitStmt->execute();
        $lastVisit = $visitStmt->fetch(PDO::FETCH_ASSOC);
        $student['last_visit'] = $lastVisit ?: null;
        
        // Format dates
        if ($student['birth_date']) {
            $student['age'] = date_diff(date_create($student['birth_date']), date_create('today'))->y;
        }
        
        $student['created_date'] = date('M j, Y', strtotime($student['created_at']));
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'section' => [
            'id' => $section['id'],
            'section_name' => $section['section_name'],
            'grade_level' => $section['level_name'],
            'grade_number' => $section['level_number'],
            'school_year' => $section['year_name'],
            'adviser_name' => $section['adviser_name'],
            'capacity' => $section['capacity'],
            'current_enrollment' => $section['current_enrollment'],
            'display_name' => $section['level_name'] . ' - ' . $section['section_name']
        ],
        'students' => $students,
        'stats' => [
            'total_students' => count($students),
            'students_with_allergies' => count(array_filter($students, fn($s) => !empty($s['allergies']))),
            'students_with_visits' => count(array_filter($students, fn($s) => !empty($s['last_visit'])))
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Error in get-students.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error loading students: ' . $e->getMessage()
    ]);
}
?>