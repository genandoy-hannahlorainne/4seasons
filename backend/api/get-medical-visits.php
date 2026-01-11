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

// Optional filters
$studentId = isset($_GET['student_id']) ? $_GET['student_id'] : null;
$status = isset($_GET['status']) ? $_GET['status'] : null;
$date = isset($_GET['date']) ? $_GET['date'] : null;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;

try {
    // Main query - get visits with student info
    $query = "SELECT mv.visit_id, mv.student_id, mv.visit_datetime, mv.visit_type,
                     mv.chief_complaint, mv.notes, mv.status,
                     s.student_number, s.first_name, s.last_name, s.gender,
                     s.grade_level, s.section
              FROM medical_visits mv
              JOIN students s ON mv.student_id = s.student_id
              WHERE 1=1";
    
    $params = [];
    
    if ($studentId) {
        $query .= " AND mv.student_id = :student_id";
        $params[':student_id'] = $studentId;
    }
    
    if ($status) {
        // Map frontend status to database enum
        $statusMap = [
            'pending' => 'Open',
            'completed' => 'Closed',
            'referred' => 'Referred'
        ];
        $dbStatus = isset($statusMap[$status]) ? $statusMap[$status] : $status;
        $query .= " AND mv.status = :status";
        $params[':status'] = $dbStatus;
    }
    
    if ($date) {
        $query .= " AND DATE(mv.visit_datetime) = :date";
        $params[':date'] = $date;
    }
    
    $query .= " ORDER BY mv.visit_datetime DESC LIMIT :limit";
    
    $stmt = $db->prepare($query);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    
    $stmt->execute();
    
    $visits = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { 
        $visitId = $row['visit_id'];
        $fullName = trim($row['first_name'] . ' ' . $row['last_name']);
        $gradeSection = 'Grade ' . $row['grade_level'] . ' - ' . $row['section'];
        
        // Get vitals for this visit
        $vitalsQuery = "SELECT temperature_c, bp_systolic, bp_diastolic, pulse_rate, respiration_rate 
                        FROM vitals WHERE visit_id = :visit_id ORDER BY recorded_at DESC LIMIT 1";
        $vitalsStmt = $db->prepare($vitalsQuery);
        $vitalsStmt->bindParam(':visit_id', $visitId);
        $vitalsStmt->execute();
        $vitals = $vitalsStmt->fetch(PDO::FETCH_ASSOC);
        
        // Get diagnosis for this visit
        $diagQuery = "SELECT diagnosis_text FROM diagnoses WHERE visit_id = :visit_id LIMIT 1";
        $diagStmt = $db->prepare($diagQuery);
        $diagStmt->bindParam(':visit_id', $visitId);
        $diagStmt->execute();
        $diagnosis = $diagStmt->fetch(PDO::FETCH_ASSOC);
        
        // Get treatment for this visit
        $treatQuery = "SELECT treatment_text FROM treatments WHERE visit_id = :visit_id LIMIT 1";
        $treatStmt = $db->prepare($treatQuery);
        $treatStmt->bindParam(':visit_id', $visitId);
        $treatStmt->execute();
        $treatment = $treatStmt->fetch(PDO::FETCH_ASSOC);
        
        // Get medications for this visit
        $medQuery = "SELECT medication_name, notes FROM medications WHERE visit_id = :visit_id LIMIT 1";
        $medStmt = $db->prepare($medQuery);
        $medStmt->bindParam(':visit_id', $visitId);
        $medStmt->execute();
        $medication = $medStmt->fetch(PDO::FETCH_ASSOC);
        
        // Format blood pressure
        $bloodPressure = null;
        if ($vitals && $vitals['bp_systolic'] && $vitals['bp_diastolic']) {
            $bloodPressure = $vitals['bp_systolic'] . '/' . $vitals['bp_diastolic'];
        }
        
        // Map database status to frontend status
        $statusMap = [
            'Open' => 'pending',
            'Closed' => 'completed',
            'Referred' => 'referred'
        ];
        $frontendStatus = isset($statusMap[$row['status']]) ? $statusMap[$row['status']] : strtolower($row['status']);
        
        // Map database visit_type to frontend format
        $visitTypeMap = [
            'Routine' => 'walk-in',
            'Emergency' => 'emergency',
            'Follow-up' => 'follow-up',
            'Referral' => 'referred'
        ];
        $frontendVisitType = isset($visitTypeMap[$row['visit_type']]) ? $visitTypeMap[$row['visit_type']] : strtolower($row['visit_type']);
        
        $visits[] = [
            'id' => $visitId,
            'student_id' => $row['student_id'],
            'studentName' => $fullName,
            'studentNumber' => $row['student_number'],
            'gradeSection' => $gradeSection,
            'avatar' => $row['gender'] === 'F' ? 'assets/user-female.png' : 'assets/user-male.png',
            'dateTime' => date('M d, Y h:i A', strtotime($row['visit_datetime'])),
            'rawDateTime' => $row['visit_datetime'],
            'visitType' => $frontendVisitType,
            'chiefComplaint' => $row['chief_complaint'],
            'notes' => $row['notes'],
            'diagnosis' => $diagnosis ? $diagnosis['diagnosis_text'] : null,
            'treatment' => $treatment ? $treatment['treatment_text'] : null,
            'status' => $frontendStatus,
            'vitals' => [
                'temperature' => $vitals ? $vitals['temperature_c'] : null,
                'bloodPressure' => $bloodPressure,
                'pulseRate' => $vitals ? $vitals['pulse_rate'] : null,
                'respiratoryRate' => $vitals ? $vitals['respiration_rate'] : null
            ],
            'medications' => $medication ? $medication['medication_name'] : null,
            'recommendations' => $medication ? $medication['notes'] : null
        ];
    }
    
    echo json_encode([
        'success' => true,
        'visits' => $visits,
        'total' => count($visits)
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
