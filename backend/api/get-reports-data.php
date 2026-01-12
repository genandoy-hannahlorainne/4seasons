<?php
// Include CORS handler first
require_once '../cors.php';

header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get parameters
$startDate = $_GET['start_date'] ?? null;
$endDate = $_GET['end_date'] ?? null;
$gradeLevel = $_GET['grade_level'] ?? null;

// Validate dates
if (!$startDate || !$endDate) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Start date and end date are required'
    ]);
    exit;
}

try {
    // Build base query conditions
    $dateCondition = "AND mv.visit_datetime BETWEEN :start_date AND DATE_ADD(:end_date, INTERVAL 1 DAY)";
    $gradeCondition = "";
    
    if (!empty($gradeLevel)) {
        $gradeCondition = "AND s.grade_level = :grade_level";
    }

    // 1. Total visits count
    $totalVisitsQuery = "SELECT COUNT(*) as count 
                         FROM medical_visits mv
                         INNER JOIN students s ON mv.student_id = s.student_id
                         WHERE 1=1 $dateCondition $gradeCondition";
    
    $totalVisitsStmt = $db->prepare($totalVisitsQuery);
    $totalVisitsStmt->bindParam(':start_date', $startDate);
    $totalVisitsStmt->bindParam(':end_date', $endDate);
    if (!empty($gradeLevel)) {
        $totalVisitsStmt->bindParam(':grade_level', $gradeLevel);
    }
    $totalVisitsStmt->execute();
    $totalVisits = (int)$totalVisitsStmt->fetch(PDO::FETCH_ASSOC)['count'];

    // 2. Unique students count
    $uniqueStudentsQuery = "SELECT COUNT(DISTINCT mv.student_id) as count 
                            FROM medical_visits mv
                            INNER JOIN students s ON mv.student_id = s.student_id
                            WHERE 1=1 $dateCondition $gradeCondition";
    
    $uniqueStudentsStmt = $db->prepare($uniqueStudentsQuery);
    $uniqueStudentsStmt->bindParam(':start_date', $startDate);
    $uniqueStudentsStmt->bindParam(':end_date', $endDate);
    if (!empty($gradeLevel)) {
        $uniqueStudentsStmt->bindParam(':grade_level', $gradeLevel);
    }
    $uniqueStudentsStmt->execute();
    $uniqueStudents = (int)$uniqueStudentsStmt->fetch(PDO::FETCH_ASSOC)['count'];

    // 3. Emergency cases count
    $emergencyCasesQuery = "SELECT COUNT(*) as count 
                            FROM medical_visits mv
                            INNER JOIN students s ON mv.student_id = s.student_id
                            WHERE mv.visit_type = 'Emergency' $dateCondition $gradeCondition";
    
    $emergencyCasesStmt = $db->prepare($emergencyCasesQuery);
    $emergencyCasesStmt->bindParam(':start_date', $startDate);
    $emergencyCasesStmt->bindParam(':end_date', $endDate);
    if (!empty($gradeLevel)) {
        $emergencyCasesStmt->bindParam(':grade_level', $gradeLevel);
    }
    $emergencyCasesStmt->execute();
    $emergencyCases = (int)$emergencyCasesStmt->fetch(PDO::FETCH_ASSOC)['count'];

    // 4. Hospital referrals count
    $referralsQuery = "SELECT COUNT(*) as count 
                       FROM medical_visits mv
                       INNER JOIN students s ON mv.student_id = s.student_id
                       WHERE mv.status = 'Referred' $dateCondition $gradeCondition";
    
    $referralsStmt = $db->prepare($referralsQuery);
    $referralsStmt->bindParam(':start_date', $startDate);
    $referralsStmt->bindParam(':end_date', $endDate);
    if (!empty($gradeLevel)) {
        $referralsStmt->bindParam(':grade_level', $gradeLevel);
    }
    $referralsStmt->execute();
    $referrals = (int)$referralsStmt->fetch(PDO::FETCH_ASSOC)['count'];

    // 5. Cases by illness/diagnosis
    $casesByIllnessQuery = "SELECT d.diagnosis_text as illness, COUNT(*) as count
                            FROM diagnoses d
                            INNER JOIN medical_visits mv ON d.visit_id = mv.visit_id
                            INNER JOIN students s ON mv.student_id = s.student_id
                            WHERE d.diagnosis_text IS NOT NULL AND d.diagnosis_text != '' $dateCondition $gradeCondition
                            GROUP BY d.diagnosis_text
                            ORDER BY count DESC
                            LIMIT 10";
    
    $casesByIllnessStmt = $db->prepare($casesByIllnessQuery);
    $casesByIllnessStmt->bindParam(':start_date', $startDate);
    $casesByIllnessStmt->bindParam(':end_date', $endDate);
    if (!empty($gradeLevel)) {
        $casesByIllnessStmt->bindParam(':grade_level', $gradeLevel);
    }
    $casesByIllnessStmt->execute();
    $casesByIllness = $casesByIllnessStmt->fetchAll(PDO::FETCH_ASSOC);

    // 6. Cases by grade level
    $casesByGradeQuery = "SELECT s.grade_level as grade, COUNT(*) as count
                          FROM medical_visits mv
                          INNER JOIN students s ON mv.student_id = s.student_id
                          WHERE 1=1 $dateCondition";
    
    if (!empty($gradeLevel)) {
        $casesByGradeQuery .= " AND s.grade_level = :grade_level";
    }
    
    $casesByGradeQuery .= " GROUP BY s.grade_level
                           ORDER BY s.grade_level ASC";
    
    $casesByGradeStmt = $db->prepare($casesByGradeQuery);
    $casesByGradeStmt->bindParam(':start_date', $startDate);
    $casesByGradeStmt->bindParam(':end_date', $endDate);
    if (!empty($gradeLevel)) {
        $casesByGradeStmt->bindParam(':grade_level', $gradeLevel);
    }
    $casesByGradeStmt->execute();
    $casesByGrade = $casesByGradeStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => [
            'totalVisits' => $totalVisits,
            'uniqueStudents' => $uniqueStudents,
            'emergencyCases' => $emergencyCases,
            'referrals' => $referrals,
            'casesByIllness' => $casesByIllness,
            'casesByGrade' => $casesByGrade
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
