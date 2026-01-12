<?php
// Include CORS handler first
require_once '../cors.php';

header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get parameters
$studentId = $_GET['student_id'] ?? null;

if (!$studentId) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Student ID is required'
    ]);
    exit;
}

try {
    // Get student basic info
    $studentQuery = "SELECT 
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
                        u.email,
                        u.phone
                     FROM students s
                     LEFT JOIN users u ON s.user_id = u.user_id
                     WHERE s.student_id = :student_id AND s.is_active = 1";
    
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(':student_id', $studentId);
    $studentStmt->execute();
    
    if ($studentStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Student not found'
        ]);
        exit;
    }
    
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get allergies
    $allergyQuery = "SELECT allergy_text, severity FROM allergies WHERE student_id = :student_id";
    $allergyStmt = $db->prepare($allergyQuery);
    $allergyStmt->bindParam(':student_id', $studentId);
    $allergyStmt->execute();
    $allergies = $allergyStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get latest vitals
    $vitalsQuery = "SELECT 
                        v.temperature_c,
                        v.bp_systolic,
                        v.bp_diastolic,
                        v.pulse_rate,
                        v.respiration_rate,
                        v.height_cm,
                        v.weight_kg,
                        v.recorded_at
                     FROM vitals v
                     INNER JOIN medical_visits mv ON v.visit_id = mv.visit_id
                     WHERE mv.student_id = :student_id
                     ORDER BY v.recorded_at DESC
                     LIMIT 1";
    
    $vitalsStmt = $db->prepare($vitalsQuery);
    $vitalsStmt->bindParam(':student_id', $studentId);
    $vitalsStmt->execute();
    $latestVitals = $vitalsStmt->fetch(PDO::FETCH_ASSOC);
    
    // Calculate BMI if we have height and weight
    $bmi = null;
    if ($latestVitals && $latestVitals['height_cm'] && $latestVitals['weight_kg']) {
        $heightM = $latestVitals['height_cm'] / 100;
        $bmi = round($latestVitals['weight_kg'] / ($heightM * $heightM), 1);
    }
    
    // Get last clinic visit
    $lastVisitQuery = "SELECT 
                        mv.visit_id,
                        mv.visit_datetime,
                        mv.chief_complaint,
                        mv.notes,
                        mv.status,
                        mv.visit_type
                     FROM medical_visits mv
                     WHERE mv.student_id = :student_id
                     ORDER BY mv.visit_datetime DESC
                     LIMIT 1";
    
    $lastVisitStmt = $db->prepare($lastVisitQuery);
    $lastVisitStmt->bindParam(':student_id', $studentId);
    $lastVisitStmt->execute();
    $lastVisit = $lastVisitStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get recent visits (last 5)
    $recentVisitsQuery = "SELECT 
                            mv.visit_id,
                            mv.visit_datetime,
                            mv.chief_complaint,
                            mv.notes,
                            mv.status,
                            mv.visit_type
                         FROM medical_visits mv
                         WHERE mv.student_id = :student_id
                         ORDER BY mv.visit_datetime DESC
                         LIMIT 5";
    
    $recentVisitsStmt = $db->prepare($recentVisitsQuery);
    $recentVisitsStmt->bindParam(':student_id', $studentId);
    $recentVisitsStmt->execute();
    $recentVisits = $recentVisitsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format response
    $fullName = trim($student['first_name'] . ' ' . ($student['middle_name'] ? $student['middle_name'] . ' ' : '') . $student['last_name']);
    $gradeSection = 'Grade ' . $student['grade_level'] . ' - ' . $student['section'];
    
    // Format allergies
    $allergyList = array_map(function($a) {
        return $a['allergy_text'];
    }, $allergies);
    
    // Format recent visits
    $formattedVisits = array_map(function($v) {
        return [
            'date' => date('M d, Y', strtotime($v['visit_datetime'])),
            'reason' => $v['chief_complaint'] ?: 'General Checkup',
            'status' => strtolower($v['status'] ?: 'completed'),
            'statusText' => $v['status'] ?: 'Completed'
        ];
    }, $recentVisits);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'name' => $fullName,
            'studentNumber' => $student['student_number'],
            'gradeSection' => $gradeSection,
            'gender' => $student['gender'] === 'F' ? 'Female' : ($student['gender'] === 'M' ? 'Male' : 'Other'),
            'birthday' => $student['birth_date'] ? date('M d, Y', strtotime($student['birth_date'])) : 'N/A',
            'age' => $student['birth_date'] ? floor((time() - strtotime($student['birth_date'])) / (365.25 * 24 * 60 * 60)) : null,
            'contact' => $student['phone'] ?: 'N/A',
            'email' => $student['email'] ?: 'N/A',
            'bloodType' => $student['blood_type'] ?: 'N/A',
            'vitals' => [
                'height' => $latestVitals && $latestVitals['height_cm'] ? $latestVitals['height_cm'] . ' cm' : 'N/A',
                'weight' => $latestVitals && $latestVitals['weight_kg'] ? $latestVitals['weight_kg'] . ' kg' : 'N/A',
                'bmi' => $bmi ? $bmi : 'N/A',
                'temperature' => $latestVitals && $latestVitals['temperature_c'] ? $latestVitals['temperature_c'] . '°C' : 'N/A',
                'bloodPressure' => $latestVitals && $latestVitals['bp_systolic'] && $latestVitals['bp_diastolic'] ? 
                    $latestVitals['bp_systolic'] . '/' . $latestVitals['bp_diastolic'] : 'N/A',
                'pulseRate' => $latestVitals && $latestVitals['pulse_rate'] ? $latestVitals['pulse_rate'] . ' bpm' : 'N/A',
                'respiratoryRate' => $latestVitals && $latestVitals['respiration_rate'] ? $latestVitals['respiration_rate'] . ' breaths/min' : 'N/A'
            ],
            'allergies' => $allergyList,
            'emergencyContact' => $student['emergency_contact'] ?: 'N/A',
            'lastVisit' => $lastVisit ? [
                'date' => date('M d, Y', strtotime($lastVisit['visit_datetime'])),
                'reason' => $lastVisit['chief_complaint'] ?: 'General Checkup',
                'status' => strtolower($lastVisit['status'] ?: 'completed'),
                'statusText' => $lastVisit['status'] ?: 'Completed'
            ] : null,
            'recentVisits' => $formattedVisits
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
