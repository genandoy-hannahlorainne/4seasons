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

    $allergyNameSelect = hasColumn($db, 'allergies', 'allergy_name')
        ? 'allergy_name AS allergy_value'
        : 'allergy_text AS allergy_value';
    
    // Get allergies
    $allergyQuery = "SELECT {$allergyNameSelect}, severity FROM allergies WHERE student_id = :student_id";
    $allergyStmt = $db->prepare($allergyQuery);
    $allergyStmt->bindParam(':student_id', $studentId);
    $allergyStmt->execute();
    $allergies = $allergyStmt->fetchAll(PDO::FETCH_ASSOC);

    $temperatureSelect = hasColumn($db, 'vitals', 'temperature')
        ? 'v.temperature AS temperature_value'
        : 'v.temperature_c AS temperature_value';

    $bloodPressureSelect = hasColumn($db, 'vitals', 'blood_pressure')
        ? "v.blood_pressure AS blood_pressure_value, NULL AS bp_systolic_value, NULL AS bp_diastolic_value"
        : "NULL AS blood_pressure_value, v.bp_systolic AS bp_systolic_value, v.bp_diastolic AS bp_diastolic_value";

    $respiratoryRateSelect = hasColumn($db, 'vitals', 'respiratory_rate')
        ? 'v.respiratory_rate AS respiratory_rate_value'
        : 'v.respiration_rate AS respiratory_rate_value';
    
    // Get latest vitals
    $vitalsQuery = "SELECT 
                        {$temperatureSelect},
                        {$bloodPressureSelect},
                        v.pulse_rate,
                        {$respiratoryRateSelect},
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

    $latestBloodPressure = 'N/A';
    if ($latestVitals) {
        if (!empty($latestVitals['blood_pressure_value'])) {
            $latestBloodPressure = $latestVitals['blood_pressure_value'];
        } elseif (!empty($latestVitals['bp_systolic_value']) && !empty($latestVitals['bp_diastolic_value'])) {
            $latestBloodPressure = $latestVitals['bp_systolic_value'] . '/' . $latestVitals['bp_diastolic_value'];
        }
    }
    
    // Get last clinic visit
    $lastVisitQuery = "SELECT 
                        mv.visit_id,
                        mv.visit_datetime,
                        mv.notes as diagnosis,
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
                            mv.notes as diagnosis,
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
        return $a['allergy_value'];
    }, $allergies);
    
    // Format recent visits
    $formattedVisits = array_map(function($v) {
        return [
            'date' => date('M d, Y', strtotime($v['visit_datetime'])),
            'reason' => $v['diagnosis'] ?: 'General Checkup',
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
                'temperature' => $latestVitals && $latestVitals['temperature_value'] ? $latestVitals['temperature_value'] . '°C' : 'N/A',
                'bloodPressure' => $latestBloodPressure,
                'pulseRate' => $latestVitals && $latestVitals['pulse_rate'] ? $latestVitals['pulse_rate'] . ' bpm' : 'N/A',
                'respiratoryRate' => $latestVitals && $latestVitals['respiratory_rate_value'] ? $latestVitals['respiratory_rate_value'] . ' breaths/min' : 'N/A'
            ],
            'allergies' => $allergyList,
            'emergencyContact' => $student['emergency_contact'] ?: 'N/A',
            'lastVisit' => $lastVisit ? [
                'date' => date('M d, Y', strtotime($lastVisit['visit_datetime'])),
                'reason' => $lastVisit['diagnosis'] ?: 'General Checkup',
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
