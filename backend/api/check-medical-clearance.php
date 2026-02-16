<?php
// Include CORS handler first
require_once '../cors.php';

header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';
require_once '../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

// Authenticate user
$auth = new Auth($database);
$auth->requireRole(['Clinic Staff', 'Admin', 'Adviser']);

$data = json_decode(file_get_contents("php://input"));

// Validate required fields
if (empty($data->student_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'student_id is required']);
    exit();
}

$activityType = $data->activity_type ?? 'off_campus';
$scannedBy = $auth->userId();

try {
    // Get student information with clearance status
    $studentQuery = "SELECT 
                        s.student_id,
                        s.student_number,
                        s.first_name,
                        s.last_name,
                        s.grade_level,
                        s.section,
                        s.general_clearance_status,
                        s.clearance_expiry_date,
                        s.requires_special_clearance,
                        s.clearance_notes,
                        s.emergency_contact,
                        s.emergency_contact_phone
                     FROM students s
                     WHERE s.student_id = :student_id AND s.is_active = 1";
    
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(':student_id', $data->student_id);
    $studentStmt->execute();
    
    if ($studentStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Student not found']);
        exit();
    }
    
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    
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
    $clearanceStmt->bindParam(':student_id', $data->student_id);
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
    $conditionsStmt->bindParam(':student_id', $data->student_id);
    $conditionsStmt->execute();
    $conditions = $conditionsStmt->fetch(PDO::FETCH_ASSOC);
    
    // Determine clearance status and risk level
    $clearanceResult = determineClearanceStatus($student, $clearance, $conditions, $activityType);
    
    // Log the clearance check
    logClearanceCheck($db, $data->student_id, $scannedBy, $activityType, $clearanceResult);
    
    // If student is flagged, create violation record
    if ($clearanceResult['status'] === 'HOLD' || $clearanceResult['status'] === 'DENIED') {
        createViolationRecord($db, $data->student_id, $scannedBy, $activityType, $clearanceResult);
    }
    
    echo json_encode([
        'success' => true,
        'student' => [
            'student_id' => $student['student_id'],
            'student_number' => $student['student_number'],
            'full_name' => trim($student['first_name'] . ' ' . $student['last_name']),
            'grade_section' => 'Grade ' . $student['grade_level'] . ' - ' . $student['section']
        ],
        'clearance' => $clearanceResult,
        'emergency_contact' => [
            'name' => $student['emergency_contact'],
            'phone' => $student['emergency_contact_phone']
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}

function determineClearanceStatus($student, $clearance, $conditions, $activityType) {
    $result = [
        'status' => 'APPROVED',
        'level' => 'green',
        'message' => 'Student cleared for activity',
        'restrictions' => [],
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
                        $result['restrictions'][] = $clearance['medical_notes'];
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
            $result['restrictions'] = array_merge($result['restrictions'], $warnings);
            
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

function logClearanceCheck($db, $studentId, $scannedBy, $activityType, $result) {
    $logQuery = "INSERT INTO clearance_checks 
                 (student_id, scanned_by, activity_type, clearance_status, result_level, created_at)
                 VALUES (:student_id, :scanned_by, :activity_type, :status, :level, NOW())";
    
    try {
        $logStmt = $db->prepare($logQuery);
        $logStmt->bindParam(':student_id', $studentId);
        $logStmt->bindParam(':scanned_by', $scannedBy);
        $logStmt->bindParam(':activity_type', $activityType);
        $logStmt->bindParam(':status', $result['status']);
        $logStmt->bindParam(':level', $result['level']);
        $logStmt->execute();
    } catch (PDOException $e) {
        // Log error but don't fail the main request
        error_log("Failed to log clearance check: " . $e->getMessage());
    }
}

function createViolationRecord($db, $studentId, $scannedBy, $activityType, $result) {
    $violationQuery = "INSERT INTO clearance_violations 
                       (student_id, scanned_by, activity_type, violation_reason, clearance_status, action_taken, created_at)
                       VALUES (:student_id, :scanned_by, :activity_type, :reason, :status, :action, NOW())";
    
    try {
        $violationStmt = $db->prepare($violationQuery);
        $violationStmt->bindParam(':student_id', $studentId);
        $violationStmt->bindParam(':scanned_by', $scannedBy);
        $violationStmt->bindParam(':activity_type', $activityType);
        $violationStmt->bindParam(':reason', $result['message']);
        $violationStmt->bindParam(':status', $result['status']);
        $violationStmt->bindParam(':action', 'Student held back from activity');
        $violationStmt->execute();
    } catch (PDOException $e) {
        error_log("Failed to create violation record: " . $e->getMessage());
    }
}
?>