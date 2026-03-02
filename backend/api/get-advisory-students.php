<?php
// Include CORS handler first
require_once '../cors.php';

header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

function hasColumn(PDO $db, string $table, string $column): bool {
    $stmt = $db->prepare("SHOW COLUMNS FROM `{$table}` LIKE :column");
    $stmt->bindValue(':column', $column);
    $stmt->execute();
    return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
}

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
    $adviserQuery = "SELECT a.adviser_id, a.employee_id, u.full_name
                     FROM advisers a 
                     LEFT JOIN users u ON a.user_id = u.user_id
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

    // Get students assigned to this adviser through proper section relationships
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
                        u.phone,
                        sec.section_name,
                        gl.level_name,
                        gl.level_number,
                        sy.year_name as school_year
                      FROM students s
                      LEFT JOIN users u ON s.user_id = u.user_id
                      LEFT JOIN sections sec ON s.current_section_id = sec.id
                      LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
                      LEFT JOIN school_years sy ON s.current_school_year_id = sy.id
                      WHERE s.current_adviser_id = :adviser_user_id 
                        AND s.is_active = 1
                        AND s.enrollment_status = 'active'
                      ORDER BY s.last_name, s.first_name";
    
    $studentsStmt = $db->prepare($studentsQuery);
    $studentsStmt->bindParam(":adviser_user_id", $user_id);
    
    $studentsStmt->execute();
    $students = $studentsStmt->fetchAll(PDO::FETCH_ASSOC);

    $allergyColumn = hasColumn($db, 'allergies', 'allergy_name') ? 'allergy_name' : 'allergy_text';

    // Get additional data for each student (allergies, last visit)
    foreach ($students as &$student) {
        // Get allergies
        $allergyQuery = "SELECT {$allergyColumn} FROM allergies WHERE student_id = :student_id";
        $allergyStmt = $db->prepare($allergyQuery);
        $allergyStmt->bindParam(":student_id", $student['student_id']);
        $allergyStmt->execute();
        $allergies = $allergyStmt->fetchAll(PDO::FETCH_COLUMN);
        $student['allergies'] = $allergies;

        // Get last clinic visit
        $visitQuery = "SELECT visit_id, visit_datetime as visit_date, notes as reason, notes as diagnosis, status 
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
        
        // Format grade section display using proper relationships
        if ($student['level_name'] && $student['section_name']) {
            $student['grade_section'] = $student['level_name'] . ' - ' . $student['section_name'];
        } else {
            // Fallback to legacy fields
            $gradeLabel = 'Grade ' . $student['grade_level'];
            $sectionLabel = $student['section'];
            if (in_array($student['grade_level'], ['11', '12'])) {
                $student['grade_section'] = $gradeLabel . ' - ' . $sectionLabel;
            } else {
                $student['grade_section'] = $gradeLabel . ' - Section ' . $sectionLabel;
            }
        }
    }

    // Get clinic visit count for this month for all students under this adviser
    $visitCountQuery = "SELECT COUNT(*) as count 
                        FROM medical_visits mv
                        INNER JOIN students s ON mv.student_id = s.student_id
                        WHERE s.current_adviser_id = :adviser_user_id
                          AND MONTH(mv.visit_datetime) = MONTH(CURRENT_DATE())
                          AND YEAR(mv.visit_datetime) = YEAR(CURRENT_DATE())";
    $visitCountStmt = $db->prepare($visitCountQuery);
    $visitCountStmt->bindParam(":adviser_user_id", $user_id);
    $visitCountStmt->execute();
    $visitCount = $visitCountStmt->fetch(PDO::FETCH_ASSOC)['count'];

    echo json_encode([
        'success' => true,
        'adviser' => [
            'adviser_id' => $adviser['adviser_id'],
            'name' => $adviser['full_name'] ?? 'Adviser',
            'grade_level' => '',
            'section' => '',
            'advisory_class' => 'Assigned Sections'
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
