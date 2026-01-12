<?php
// Include CORS handler first
require_once '../cors.php';

header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get user_id from header or query param
$user_id = $_GET['user_id'] ?? $_SERVER['HTTP_USER_ID'] ?? null;

if (empty($user_id)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'User ID is required'
    ]);
    exit;
}

try {
    // First get the adviser info
    $adviserQuery = "SELECT a.adviser_id, a.first_name, a.last_name, a.employee_number, a.grade_level, a.section
                     FROM advisers a 
                     WHERE a.user_id = :user_id AND a.is_active = 1";
    $adviserStmt = $db->prepare($adviserQuery);
    $adviserStmt->bindParam(":user_id", $user_id);
    $adviserStmt->execute();
    $adviser = $adviserStmt->fetch(PDO::FETCH_ASSOC);

    if (!$adviser) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Adviser not found'
        ]);
        exit;
    }

    // Get students assigned to this adviser through student_adviser junction table
    // Also filter by grade_level and section if adviser has them set
    $studentsQuery = "SELECT 
                        s.student_id,
                        s.student_number,
                        s.first_name,
                        s.middle_name,
                        s.last_name,
                        s.birth_date,
                        s.gender,
                        s.grade_level,
                        s.section,
                        s.blood_type,
                        s.emergency_contact,
                        s.created_at,
                        u.email,
                        u.phone
                      FROM students s
                      LEFT JOIN users u ON s.user_id = u.user_id
                      INNER JOIN student_adviser sa ON s.student_id = sa.student_id
                      WHERE sa.adviser_id = :adviser_id 
                        AND s.is_active = 1";
    
    // Add grade and section filters if adviser has them set
    if (!empty($adviser['grade_level'])) {
        $studentsQuery .= " AND s.grade_level = :grade_level";
    }
    if (!empty($adviser['section'])) {
        $studentsQuery .= " AND s.section = :section";
    }
    
    $studentsQuery .= " ORDER BY s.last_name, s.first_name";
    
    $studentsStmt = $db->prepare($studentsQuery);
    $studentsStmt->bindParam(":adviser_id", $adviser['adviser_id']);
    
    // Bind grade and section if they exist
    if (!empty($adviser['grade_level'])) {
        $studentsStmt->bindParam(":grade_level", $adviser['grade_level']);
    }
    if (!empty($adviser['section'])) {
        $studentsStmt->bindParam(":section", $adviser['section']);
    }
    
    $studentsStmt->execute();
    $students = $studentsStmt->fetchAll(PDO::FETCH_ASSOC);

    // Get additional data for each student (allergies, last visit)
    foreach ($students as &$student) {
        // Get allergies
        $allergyQuery = "SELECT allergy_text FROM allergies WHERE student_id = :student_id";
        $allergyStmt = $db->prepare($allergyQuery);
        $allergyStmt->bindParam(":student_id", $student['student_id']);
        $allergyStmt->execute();
        $allergies = $allergyStmt->fetchAll(PDO::FETCH_COLUMN);
        $student['allergies'] = $allergies;

        // Get last clinic visit
        $visitQuery = "SELECT visit_id, visit_datetime as visit_date, chief_complaint as reason, notes as diagnosis, status 
                       FROM medical_visits 
                       WHERE student_id = :student_id 
                       ORDER BY visit_datetime DESC 
                       LIMIT 1";
        $visitStmt = $db->prepare($visitQuery);
        $visitStmt->bindParam(":student_id", $student['student_id']);
        $visitStmt->execute();
        $lastVisit = $visitStmt->fetch(PDO::FETCH_ASSOC);
        $student['last_visit'] = $lastVisit ?: null;

        // Format full name
        $student['full_name'] = trim($student['first_name'] . ' ' . ($student['middle_name'] ? $student['middle_name'] . ' ' : '') . $student['last_name']);
        
        // Format grade section display
        $gradeLabel = 'Grade ' . $student['grade_level'];
        $sectionLabel = $student['section'];
        if (in_array($student['grade_level'], ['11', '12'])) {
            $student['grade_section'] = $gradeLabel . ' - ' . $sectionLabel;
        } else {
            $student['grade_section'] = $gradeLabel . ' - Section ' . $sectionLabel;
        }
    }

    // Get clinic visit count for this month for all students under this adviser
    $visitCountQuery = "SELECT COUNT(*) as count 
                        FROM medical_visits mv
                        INNER JOIN student_adviser sa ON mv.student_id = sa.student_id
                        WHERE sa.adviser_id = :adviser_id
                          AND MONTH(mv.visit_datetime) = MONTH(CURRENT_DATE())
                          AND YEAR(mv.visit_datetime) = YEAR(CURRENT_DATE())";
    $visitCountStmt = $db->prepare($visitCountQuery);
    $visitCountStmt->bindParam(":adviser_id", $adviser['adviser_id']);
    $visitCountStmt->execute();
    $visitCount = $visitCountStmt->fetch(PDO::FETCH_ASSOC)['count'];

    echo json_encode([
        'success' => true,
        'adviser' => [
            'adviser_id' => $adviser['adviser_id'],
            'name' => $adviser['first_name'] . ' ' . $adviser['last_name'],
            'grade_level' => $adviser['grade_level'] ?? '',
            'section' => $adviser['section'] ?? '',
            'advisory_class' => 'Grade ' . ($adviser['grade_level'] ?? 'N/A') . ' - ' . ($adviser['section'] ?? 'N/A')
        ],
        'students' => $students,
        'stats' => [
            'total_students' => count($students),
            'clinic_visits_this_month' => (int)$visitCount,
            'students_with_allergies' => count(array_filter($students, fn($s) => !empty($s['allergies'])))
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
