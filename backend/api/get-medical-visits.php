<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, X-Requested-With");
header("Access-Control-Max-Age: 3600");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$studentId = isset($_GET['student_id']) ? $_GET['student_id'] : null;
$userId = isset($_GET['user_id']) ? $_GET['user_id'] : null;
$status = isset($_GET['status']) ? $_GET['status'] : null;
$date = isset($_GET['date']) ? $_GET['date'] : null;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;

if (!$studentId && $userId) {
    $userStudentQuery = "SELECT student_id FROM students WHERE user_id = :user_id AND is_active = 1 LIMIT 1";
    $userStudentStmt = $db->prepare($userStudentQuery);
    $userStudentStmt->bindParam(':user_id', $userId);
    $userStudentStmt->execute();
    
    if ($userStudentStmt->rowCount() > 0) {
        $row = $userStudentStmt->fetch(PDO::FETCH_ASSOC);
        $studentId = intval($row['student_id']);
    }
}

try {
    // Optimized query using LEFT JOINs to fetch all data in one query
    $query = "SELECT DISTINCT
                     mv.visit_id, mv.student_id, mv.visit_datetime, mv.visit_type,
                     mv.notes as diagnosis, mv.status,
                     s.student_number, s.first_name, s.last_name, s.gender,
                     s.grade_level, s.section,
                     v.temperature_c, v.bp_systolic, v.bp_diastolic, v.pulse_rate, v.respiration_rate
              FROM medical_visits mv
              INNER JOIN students s ON mv.student_id = s.student_id
              LEFT JOIN vitals v ON mv.visit_id = v.visit_id
              WHERE s.is_active = 1";
    
    $params = [];
    
    if ($studentId) {
        $query .= " AND mv.student_id = :student_id";
        $params[':student_id'] = $studentId;
    }
    
    if ($status) {
        $statusMap = ['pending' => 'Open', 'completed' => 'Closed', 'referred' => 'Referred'];
        $dbStatus = isset($statusMap[$status]) ? $statusMap[$status] : $status;
        $query .= " AND mv.status = :status";
        $params[':status'] = $dbStatus;
    }
    
    if ($date) {
        $query .= " AND DATE(mv.visit_datetime) = :date";
        $params[':date'] = $date;
    }
    
    $query .= " ORDER BY mv.visit_datetime DESC LIMIT :limit";
    
    error_log("Query: " . $query);
    error_log("Params: " . json_encode($params));
    
    $stmt = $db->prepare($query);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    
    error_log("Rows returned: " . $stmt->rowCount());
    
    $visits = [];
    $processedVisits = [];
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { 
        $visitId = $row['visit_id'];
        
        // Skip if we've already processed this visit (due to multiple rows from JOINs)
        if (isset($processedVisits[$visitId])) {
            continue;
        }
        $processedVisits[$visitId] = true;
        
        $fullName = trim($row['first_name'] . ' ' . $row['last_name']);
        $gradeSection = 'Grade ' . $row['grade_level'] . ' - ' . $row['section'];
        
        $bloodPressure = null;
        if ($row['bp_systolic'] && $row['bp_diastolic']) {
            $bloodPressure = $row['bp_systolic'] . '/' . $row['bp_diastolic'];
        }
        
        $statusMap = ['Open' => 'pending', 'Closed' => 'completed', 'Referred' => 'referred'];
        $frontendStatus = isset($statusMap[$row['status']]) ? $statusMap[$row['status']] : strtolower($row['status']);
        
        // Keep visit type as-is from database (Routine, Emergency only)
        $visitType = $row['visit_type'] ?: 'Routine';
        
        $visits[] = [
            'id' => $visitId,
            'visit_id' => $visitId,
            'student_id' => $row['student_id'],
            'studentName' => $fullName,
            'studentNumber' => $row['student_number'],
            'gradeSection' => $gradeSection,
            'avatar' => $row['gender'] === 'F' ? 'assets/user-female.png' : 'assets/user-male.png',
            'dateTime' => date('M d, Y h:i A', strtotime($row['visit_datetime'])),
            'visit_datetime' => $row['visit_datetime'],
            'rawDateTime' => $row['visit_datetime'],
            'visit_type' => $visitType,
            'visitType' => $visitType,
            'diagnosis' => $row['diagnosis'] ?: 'No diagnosis recorded',
            'status' => $frontendStatus,
            'vitals' => [
                'temperature' => $row['temperature_c'] ?: null,
                'bloodPressure' => $bloodPressure,
                'pulseRate' => $row['pulse_rate'] ?: null,
                'respiratoryRate' => $row['respiration_rate'] ?: null
            ]
        ];
    }
    
    error_log("Visits processed: " . count($visits));
    
    http_response_code(200);
    echo json_encode(['success' => true, 'data' => $visits, 'visits' => $visits, 'total' => count($visits)]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
