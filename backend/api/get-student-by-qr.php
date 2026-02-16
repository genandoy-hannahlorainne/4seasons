<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, User-Id, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get student_id or student_number from request
$student_id = isset($_GET['student_id']) ? $_GET['student_id'] : null;
$student_number = isset($_GET['student_number']) ? $_GET['student_number'] : null;

if (!$student_id && !$student_number) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'student_id or student_number is required']);
    exit();
}

try {
    // Build query based on provided parameter
    if ($student_id) {
        $query = "SELECT s.student_id, s.student_number, s.first_name, s.middle_name, s.last_name,
                         s.gender, s.birth_date, s.grade_level, s.section, s.blood_type,
                         s.emergency_contact, s.emergency_contact_phone, s.address
                  FROM students s
                  WHERE s.student_id = :student_id AND s.is_active = 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
    } else {
        $query = "SELECT s.student_id, s.student_number, s.first_name, s.middle_name, s.last_name,
                         s.gender, s.birth_date, s.grade_level, s.section, s.blood_type,
                         s.emergency_contact, s.emergency_contact_phone, s.address
                  FROM students s
                  WHERE s.student_number = :student_number AND s.is_active = 1";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':student_number', $student_number);
    }
    
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get full name
        $fullName = trim($student['first_name'] . ' ' . ($student['middle_name'] ? $student['middle_name'] . ' ' : '') . $student['last_name']);
        
        // Get allergies
        $allergyQuery = "SELECT allergy_text FROM allergies WHERE student_id = :student_id";
        $allergyStmt = $db->prepare($allergyQuery);
        $allergyStmt->bindParam(':student_id', $student['student_id']);
        $allergyStmt->execute();
        $allergies = $allergyStmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Get last visit
        $visitQuery = "SELECT visit_datetime, notes as diagnosis, status 
                       FROM medical_visits 
                       WHERE student_id = :student_id 
                       ORDER BY visit_datetime DESC LIMIT 1";
        $visitStmt = $db->prepare($visitQuery);
        $visitStmt->bindParam(':student_id', $student['student_id']);
        $visitStmt->execute();
        $lastVisit = $visitStmt->fetch(PDO::FETCH_ASSOC);
        
        // Check medical clearance using the same logic as check-medical-clearance.php
        $clearanceStatus = checkMedicalClearanceForStudent($db, $student['student_id'], 'off_campus');
        
        // Format grade and section
        $gradeSection = 'Grade ' . $student['grade_level'] . ' - ' . $student['section'];
        
        echo json_encode([
            'success' => true,
            'student' => [
                'student_id' => $student['student_id'],
                'student_number' => $student['student_number'],
                'full_name' => $fullName,
                'first_name' => $student['first_name'],
                'middle_name' => $student['middle_name'],
                'last_name' => $student['last_name'],
                'gender' => $student['gender'],
                'birth_date' => $student['birth_date'],
                'grade_level' => $student['grade_level'],
                'section' => $student['section'],
                'grade_section' => $gradeSection,
                'blood_type' => $student['blood_type'],
                'emergency_contact' => $student['emergency_contact'],
                'parentPhone' => $student['emergency_contact_phone'],
                'address' => $student['address'],
                'allergies' => $allergies,
                'last_visit' => $lastVisit,
                'avatar' => $student['gender'] === 'F' ? 'assets/user-female.png' : 'assets/user-male.png',
                'clearance' => $clearanceStatus,
                'emergency_contact' => [
                    'name' => $student['emergency_contact'],
                    'phone' => $student['emergency_contact_phone']
                ]
            ]
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Student not found']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}

function checkMedicalClearanceForStudent($db, $studentId, $activityType = 'off_campus') {
    // Get student information with clearance status
    $studentQuery = "SELECT 
                        s.student_id,
                        s.general_clearance_status,
                        s.clearance_expiry_date,
                        s.requires_special_clearance,
                        s.clearance_notes
                     FROM students s
                     WHERE s.student_id = :student_id AND s.is_active = 1";
    
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(':student_id', $studentId);
    $studentStmt->execute();
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$student) {
        return ['status' => 'ERROR', 'level' => 'red', 'message' => 'Student not found'];
    }
    
    // Get specific clearance for the activity type
    $clearanceQuery = "SELECT 
                          mc.clearance_id,
                          mc.clearance_type,
                          mc.status,
                          mc.required_for,
                          mc.issued_date,
                          mc.expiry_date,
                          mc.parent_consent,
                          mc.doctor_approval,
                          mc.medical_notes,
                          mc.issued_by
                       FROM medical_clearances mc
                       WHERE mc.student_id = :student_id 
                         AND mc.clearance_type = :activity_type
                       ORDER BY mc.created_at DESC
                       LIMIT 1";
    
    $clearanceStmt = $db->prepare($clearanceQuery);
    $clearanceStmt->bindParam(':student_id', $studentId);
    $clearanceStmt->bindParam(':activity_type', $activityType);
    $clearanceStmt->execute();
    $clearance = $clearanceStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get medical conditions that require clearance
    $conditionsQuery = "SELECT 
                           condition_heart_problem,
                           condition_asthma,
                           condition_seizure,
                           condition_bleeding_disorder
                        FROM medical_history
                        WHERE student_id = :student_id";
    
    $conditionsStmt = $db->prepare($conditionsQuery);
    $conditionsStmt->bindParam(':student_id', $studentId);
    $conditionsStmt->execute();
    $conditions = $conditionsStmt->fetch(PDO::FETCH_ASSOC);
    
    // Determine clearance status and risk level
    return determineClearanceStatusForQR($student, $clearance, $conditions, $activityType);
}

function determineClearanceStatusForQR($student, $clearance, $conditions, $activityType) {
    $result = [
        'status' => 'APPROVED',
        'level' => 'green',
        'message' => 'Student cleared for activity',
        'warnings' => [],
        'action_required' => false,
        'requires_parent_contact' => false
    ];
    
    // Check if student requires special clearance
    if ($student['requires_special_clearance']) {
        if (!$clearance) {
            $result['status'] = 'HOLD';
            $result['level'] = 'red';
            $result['message'] = 'No clearance on file - HOLD student';
            $result['action_required'] = true;
            $result['requires_parent_contact'] = true;
            return $result;
        }
        
        // Check clearance status
        switch ($clearance['status']) {
            case 'pending':
                $result['status'] = 'HOLD';
                $result['level'] = 'red';
                $result['message'] = 'Medical clearance PENDING - HOLD student';
                $result['action_required'] = true;
                $result['requires_parent_contact'] = true;
                break;
                
            case 'denied':
                $result['status'] = 'DENIED';
                $result['level'] = 'red';
                $result['message'] = 'Medical clearance DENIED - Student cannot participate';
                $result['action_required'] = true;
                $result['requires_parent_contact'] = true;
                break;
                
            case 'expired':
                $result['status'] = 'HOLD';
                $result['level'] = 'red';
                $result['message'] = 'Medical clearance EXPIRED - HOLD student';
                $result['action_required'] = true;
                $result['requires_parent_contact'] = true;
                break;
                
            case 'approved':
                // Check if clearance is still valid
                if ($clearance['expiry_date'] && strtotime($clearance['expiry_date']) < time()) {
                    $result['status'] = 'HOLD';
                    $result['level'] = 'red';
                    $result['message'] = 'Medical clearance EXPIRED - HOLD student';
                    $result['action_required'] = true;
                    $result['requires_parent_contact'] = true;
                } else {
                    $result['status'] = 'APPROVED';
                    $result['level'] = 'green';
                    $result['message'] = 'Student cleared with medical approval';
                    
                    // Add any restrictions from medical notes
                    if ($clearance['medical_notes']) {
                        $result['warnings'][] = $clearance['medical_notes'];
                    }
                }
                break;
        }
    }
    
    // Check for specific medical conditions that require extra caution
    if ($conditions) {
        $warnings = [];
        
        if ($conditions['condition_heart_problem']) {
            $warnings[] = 'Heart condition - monitor for fatigue/chest pain';
        }
        if ($conditions['condition_asthma']) {
            $warnings[] = 'Asthma - ensure inhaler available';
        }
        if ($conditions['condition_seizure']) {
            $warnings[] = 'Seizure disorder - supervise closely';
        }
        if ($conditions['condition_bleeding_disorder']) {
            $warnings[] = 'Bleeding disorder - avoid high-risk activities';
        }
        
        if (!empty($warnings)) {
            $result['warnings'] = array_merge($result['warnings'], $warnings);
            
            // If student has serious conditions but no clearance, escalate to CAUTION
            if (($conditions['condition_heart_problem'] || $conditions['condition_seizure']) && 
                $result['status'] === 'APPROVED' && !$clearance) {
                $result['level'] = 'yellow';
                $result['message'] = 'CAUTION: Medical conditions present - supervise closely';
            }
        }
    }
    
    return $result;
}

function determineClearanceDisplay($clearanceData, $conditions) {
    $result = [
        'status' => 'approved',
        'level' => 'green',
        'message' => 'No restrictions',
        'requires_special_clearance' => false,
        'expiry_date' => null,
        'warnings' => []
    ];
    
    if (!$clearanceData) {
        return $result;
    }
    
    $result['requires_special_clearance'] = (bool)$clearanceData['requires_special_clearance'];
    
    // Check general clearance status
    if ($clearanceData['requires_special_clearance']) {
        switch ($clearanceData['specific_clearance_status'] ?: $clearanceData['general_clearance_status']) {
            case 'pending':
                $result['status'] = 'pending';
                $result['level'] = 'yellow';
                $result['message'] = 'Medical clearance pending';
                break;
            case 'denied':
                $result['status'] = 'denied';
                $result['level'] = 'red';
                $result['message'] = 'Medical clearance denied';
                break;
            case 'expired':
                $result['status'] = 'expired';
                $result['level'] = 'red';
                $result['message'] = 'Medical clearance expired';
                break;
            case 'approved':
                $result['status'] = 'approved';
                $result['level'] = 'green';
                $result['message'] = 'Medical clearance approved';
                $result['expiry_date'] = $clearanceData['specific_expiry'] ?: $clearanceData['clearance_expiry_date'];
                break;
        }
    }
    
    // Add medical condition warnings
    if ($conditions) {
        if ($conditions['condition_heart_problem']) {
            $result['warnings'][] = 'Heart condition';
        }
        if ($conditions['condition_asthma']) {
            $result['warnings'][] = 'Asthma';
        }
        if ($conditions['condition_seizure']) {
            $result['warnings'][] = 'Seizure disorder';
        }
        if ($conditions['condition_bleeding_disorder']) {
            $result['warnings'][] = 'Bleeding disorder';
        }
    }
    
    return $result;
}
?>