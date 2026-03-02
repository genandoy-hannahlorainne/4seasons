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

function hasColumn(PDO $db, string $table, string $column): bool {
    $stmt = $db->prepare("SHOW COLUMNS FROM `{$table}` LIKE :column");
    $stmt->bindValue(':column', $column);
    $stmt->execute();
    return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
}

// Accept either student_id or user_id
$student_id = isset($_GET['student_id']) ? intval($_GET['student_id']) : 0;
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

// If user_id is provided, get the student_id from the students table
if (!$student_id && $user_id) {
    $userStudentQuery = "SELECT student_id FROM students WHERE user_id = :user_id AND is_active = 1 LIMIT 1";
    $userStudentStmt = $db->prepare($userStudentQuery);
    $userStudentStmt->bindParam(':user_id', $user_id);
    $userStudentStmt->execute();
    
    if ($userStudentStmt->rowCount() > 0) {
        $row = $userStudentStmt->fetch(PDO::FETCH_ASSOC);
        $student_id = intval($row['student_id']);
    }
}

if (!$student_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Student ID or User ID is required']);
    exit;
}

try {
    error_log("Getting student profile for student_id: " . $student_id);
    
    // Get student basic info
    $studentQuery = "SELECT s.student_id, s.student_number, s.first_name, s.middle_name, s.last_name,
                            s.gender, s.grade_level, s.section, s.birth_date, s.blood_type, s.address,
                            u.email, u.phone, u.full_name as user_full_name
                     FROM students s
                     LEFT JOIN users u ON s.user_id = u.user_id
                     WHERE s.student_id = :student_id AND s.is_active = 1";
    
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(':student_id', $student_id, PDO::PARAM_INT);
    $studentStmt->execute();
    
    if ($studentStmt->rowCount() === 0) {
        error_log("Student not found: " . $student_id);
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Student not found']);
        exit;
    }
    
    $studentRow = $studentStmt->fetch(PDO::FETCH_ASSOC);
    
    // Handle case where first_name/last_name are empty but user_full_name exists
    $firstName = !empty($studentRow['first_name']) ? $studentRow['first_name'] : '';
    $middleName = !empty($studentRow['middle_name']) ? $studentRow['middle_name'] : '';
    $lastName = !empty($studentRow['last_name']) ? $studentRow['last_name'] : '';
    
    // If student names are empty, try to use user's full_name
    if (empty($firstName) && empty($lastName) && !empty($studentRow['user_full_name'])) {
        $nameParts = explode(' ', trim($studentRow['user_full_name']));
        if (count($nameParts) >= 2) {
            $firstName = $nameParts[0];
            $lastName = end($nameParts);
            if (count($nameParts) > 2) {
                $middleName = implode(' ', array_slice($nameParts, 1, -1));
            }
        } else {
            $firstName = $studentRow['user_full_name'];
        }
    }
    
    $fullName = trim($firstName . ' ' . ($middleName ? $middleName . ' ' : '') . $lastName);
    
    $student = [
        'student_id' => intval($studentRow['student_id']),
        'student_number' => $studentRow['student_number'],
        'name' => $fullName,
        'first_name' => $firstName,
        'middle_name' => $middleName,
        'last_name' => $lastName,
        'gender' => $studentRow['gender'],
        'grade_level' => $studentRow['grade_level'],
        'section' => $studentRow['section'],
        'grade_section' => 'Grade ' . $studentRow['grade_level'] . ' - ' . $studentRow['section'],
        'birth_date' => $studentRow['birth_date'],
        'blood_type' => $studentRow['blood_type'],
        'address' => $studentRow['address'],
        'email' => $studentRow['email'],
        'phone' => $studentRow['phone'],
        'contact_number' => $studentRow['phone'],
        'avatar' => $studentRow['gender'] === 'F' ? 'assets/user-female.png' : 'assets/user-male.png'
    ];
    
    error_log("Student found: " . $student['name']);

    $temperatureSelect = hasColumn($db, 'vitals', 'temperature')
        ? 'v.temperature AS temperature_value'
        : 'v.temperature_c AS temperature_value';

    $bloodPressureSelect = hasColumn($db, 'vitals', 'blood_pressure')
        ? "v.blood_pressure AS blood_pressure_value, NULL AS bp_systolic_value, NULL AS bp_diastolic_value"
        : "NULL AS blood_pressure_value, v.bp_systolic AS bp_systolic_value, v.bp_diastolic AS bp_diastolic_value";

    $respiratoryRateSelect = hasColumn($db, 'vitals', 'respiratory_rate')
        ? 'v.respiratory_rate AS respiratory_rate_value'
        : 'v.respiration_rate AS respiratory_rate_value';
    
    // Get vitals history (medical visits with vitals)
    $vitalsQuery = "SELECT mv.visit_id, mv.visit_datetime, {$temperatureSelect}, {$bloodPressureSelect},
                           v.pulse_rate, {$respiratoryRateSelect}, v.weight_kg, v.height_cm
                    FROM medical_visits mv
                    LEFT JOIN vitals v ON mv.visit_id = v.visit_id
                    WHERE mv.student_id = :student_id
                    ORDER BY mv.visit_datetime DESC
                    LIMIT 20";
    
    $vitalsStmt = $db->prepare($vitalsQuery);
    $vitalsStmt->bindParam(':student_id', $student_id, PDO::PARAM_INT);
    $vitalsStmt->execute();
    
    $vitals = [];
    while ($row = $vitalsStmt->fetch(PDO::FETCH_ASSOC)) {
        $bloodPressure = null;
        if (!empty($row['blood_pressure_value'])) {
            $bloodPressure = $row['blood_pressure_value'];
        } elseif (!empty($row['bp_systolic_value']) && !empty($row['bp_diastolic_value'])) {
            $bloodPressure = $row['bp_systolic_value'] . '/' . $row['bp_diastolic_value'];
        }
        
        $vitals[] = [
            'visit_id' => intval($row['visit_id']),
            'date' => date('M d, Y', strtotime($row['visit_datetime'])),
            'datetime' => $row['visit_datetime'],
            'temperature' => $row['temperature_value'],
            'blood_pressure' => $bloodPressure,
            'pulse_rate' => $row['pulse_rate'],
            'respiration_rate' => $row['respiratory_rate_value'],
            'weight' => $row['weight_kg'],
            'height' => $row['height_cm']
        ];
    }
    
    error_log("Vitals found: " . count($vitals));

    $allergyNameSelect = hasColumn($db, 'allergies', 'allergy_name')
        ? 'a.allergy_name AS allergy_value'
        : 'a.allergy_text AS allergy_value';
    
    // Get diagnoses (through medical_visits)
    $diagnosisQuery = "SELECT d.diagnosis_id, d.diagnosis_text, mv.visit_datetime
                       FROM diagnoses d
                       INNER JOIN medical_visits mv ON d.visit_id = mv.visit_id
                       WHERE mv.student_id = :student_id
                       ORDER BY mv.visit_datetime DESC
                       LIMIT 20";
    
    $diagnosisStmt = $db->prepare($diagnosisQuery);
    $diagnosisStmt->bindParam(':student_id', $student_id, PDO::PARAM_INT);
    $diagnosisStmt->execute();
    
    $diagnoses = [];
    while ($row = $diagnosisStmt->fetch(PDO::FETCH_ASSOC)) {
        $diagnoses[] = [
            'diagnosis_id' => intval($row['diagnosis_id']),
            'condition' => $row['diagnosis_text'],
            'date' => date('M d, Y', strtotime($row['visit_datetime'])),
            'notes' => '',
            'status' => 'active'
        ];
    }
    
    error_log("Diagnoses found: " . count($diagnoses));
    
    // Treatments and medications tables have been removed
    $treatments = [];
    $medications = [];
    
    error_log("Treatments found: " . count($treatments));
    error_log("Medications found: " . count($medications));
    
    // Get allergies
    $allergyQuery = "SELECT a.allergy_id, {$allergyNameSelect}, a.severity
                     FROM allergies a
                     WHERE a.student_id = :student_id
                     ORDER BY a.severity DESC";
    
    $allergyStmt = $db->prepare($allergyQuery);
    $allergyStmt->bindParam(':student_id', $student_id, PDO::PARAM_INT);
    $allergyStmt->execute();
    
    $allergies = [];
    while ($row = $allergyStmt->fetch(PDO::FETCH_ASSOC)) {
        $allergies[] = [
            'allergy_id' => intval($row['allergy_id']),
            'name' => $row['allergy_value'],
            'severity' => strtolower($row['severity'])
        ];
    }
    
    error_log("Allergies found: " . count($allergies));
    
    error_log("Returning student profile: " . json_encode([
        'success' => true,
        'student' => $student,
        'vitals_count' => count($vitals),
        'diagnoses_count' => count($diagnoses),
        'treatments_count' => count($treatments),
        'medications_count' => count($medications),
        'allergies_count' => count($allergies)
    ]));
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'student' => $student,
        'profile' => $student,
        'vitals' => $vitals,
        'diagnoses' => $diagnoses,
        'treatments' => $treatments,
        'medications' => $medications,
        'allergies' => $allergies
    ]);

} catch (PDOException $e) {
    error_log("PDOException: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("Exception: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
