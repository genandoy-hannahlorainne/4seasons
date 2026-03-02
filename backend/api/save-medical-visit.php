<?php
// Include CORS handler first
require_once '../cors.php';

header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';
require_once '../middleware/auth.php';
require_once '../services/EmailService.php';

$database = new Database();
$db = $database->getConnection();

// Authenticate user
$auth = new Auth($database);
$auth->requireRole('Clinic Staff');

// Initialize email service
$emailService = new EmailService($database);

/**
 * Check for frequent visit patterns and return alert message if pattern detected
 */
function checkFrequentVisitPattern($db, $studentId, $currentDiagnosis, $currentVisitId) {
    try {
        // Define symptom groups for pattern matching
        $symptomGroups = [
            'stomach' => ['stomach ache', 'abdominal pain', 'stomach pain', 'tummy ache', 'gastric pain', 'indigestion'],
            'headache' => ['headache', 'head pain', 'migraine', 'head ache'],
            'fever' => ['fever', 'high temperature', 'pyrexia'],
            'respiratory' => ['cough', 'cold', 'sore throat', 'runny nose', 'congestion'],
            'injury' => ['bruise', 'cut', 'wound', 'injury', 'sprain', 'strain']
        ];
        
        // Find which symptom group the current diagnosis belongs to
        $currentGroup = null;
        $currentDiagnosisLower = strtolower($currentDiagnosis);
        
        foreach ($symptomGroups as $group => $symptoms) {
            foreach ($symptoms as $symptom) {
                if (strpos($currentDiagnosisLower, $symptom) !== false) {
                    $currentGroup = $group;
                    break 2;
                }
            }
        }
        
        // If no group found, no pattern detection
        if (!$currentGroup) {
            return null;
        }
        
        // Get all symptoms in the same group for SQL matching
        $groupSymptoms = $symptomGroups[$currentGroup];
        $symptomConditions = [];
        foreach ($groupSymptoms as $symptom) {
            $symptomConditions[] = "LOWER(mv.notes) LIKE '%" . strtolower($symptom) . "%'";
        }
        $symptomWhere = '(' . implode(' OR ', $symptomConditions) . ')';
        
        // Check for visits in the last 14 days with similar symptoms
        $query = "SELECT COUNT(*) as visit_count, 
                         GROUP_CONCAT(DATE(mv.visit_datetime) ORDER BY mv.visit_datetime DESC) as visit_dates
                  FROM medical_visits mv 
                  WHERE mv.student_id = :student_id 
                    AND mv.visit_datetime >= DATE_SUB(NOW(), INTERVAL 14 DAY)
                    AND mv.visit_id != :current_visit_id
                    AND {$symptomWhere}";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':student_id', $studentId);
        $stmt->bindParam(':current_visit_id', $currentVisitId);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $visitCount = $result['visit_count'] + 1; // +1 for current visit
        
        // Trigger alert if 4 or more visits with similar symptoms in 2 weeks
        if ($visitCount >= 4) {
            // Check if we already sent a pattern alert for this symptom group recently
            $alertCheckQuery = "SELECT COUNT(*) as alert_count 
                               FROM notifications 
                               WHERE student_id = :student_id 
                                 AND message LIKE '%visited the clinic % times recently%'
                                 AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            
            $alertStmt = $db->prepare($alertCheckQuery);
            $alertStmt->bindParam(':student_id', $studentId);
            $alertStmt->execute();
            
            $alertResult = $alertStmt->fetch(PDO::FETCH_ASSOC);
            
            // Only send alert if no recent pattern alert was sent
            if ($alertResult['alert_count'] == 0) {
                // Get student name for message
                $studentQuery = "SELECT CONCAT(first_name, ' ', last_name) as full_name FROM students WHERE student_id = :student_id";
                $studentStmt = $db->prepare($studentQuery);
                $studentStmt->bindParam(':student_id', $studentId);
                $studentStmt->execute();
                $studentData = $studentStmt->fetch(PDO::FETCH_ASSOC);
                
                $studentName = $studentData['full_name'];
                $symptomType = ucfirst($currentGroup) . ' related symptoms';
                
                $message = "🚨 PATTERN ALERT: Your child {$studentName} has visited the clinic {$visitCount} times recently for {$symptomType}. We suggest a formal consultation with a specialist. Please contact Four Seasons School Clinic for guidance.";
                
                return [
                    'pattern_detected' => true,
                    'visit_count' => $visitCount,
                    'symptom_group' => $currentGroup,
                    'message' => $message
                ];
            }
        }
        
        return null;
        
    } catch (Exception $e) {
        error_log("Pattern detection error: " . $e->getMessage());
        return null;
    }
}

function hasColumn(PDO $db, string $table, string $column): bool {
    $stmt = $db->prepare("SHOW COLUMNS FROM `{$table}` LIKE :column");
    $stmt->bindValue(':column', $column);
    $stmt->execute();
    return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
}

$data = json_decode(file_get_contents("php://input"));

// Validate required fields
if (empty($data->student_id) || empty($data->diagnosis) || empty($data->visit_type)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'student_id, diagnosis, and visit_type are required']);
    exit();
}

// Get clinic_staff_id for the authenticated user
$userId = $auth->userId();
$clinicStaffQuery = "SELECT clinic_staff_id FROM clinic_staff WHERE user_id = :user_id AND is_active = 1 LIMIT 1";
$clinicStaffStmt = $db->prepare($clinicStaffQuery);
$clinicStaffStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
$clinicStaffStmt->execute();

if ($clinicStaffStmt->rowCount() === 0) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Clinic staff profile not found']);
    exit();
}

$clinicStaffData = $clinicStaffStmt->fetch(PDO::FETCH_ASSOC);
$clinicStaffId = $clinicStaffData['clinic_staff_id'];

try {
    $db->beginTransaction();
    
    // Log incoming data for debugging
    error_log("Save visit request: " . json_encode($data));
    
    // Map visit_type from form to database enum
    // Form sends: routine, emergency
    // DB expects: Routine, Emergency
    $visitTypeMap = [
        'routine' => 'Routine',
        'emergency' => 'Emergency'
    ];
    $visitType = isset($visitTypeMap[$data->visit_type]) ? $visitTypeMap[$data->visit_type] : 'Routine';
    
    // Map status from form to database enum
    // Form sends: pending, completed, referred
    // DB expects: Open, Closed, Referred
    $statusMap = [
        'pending' => 'Open',
        'completed' => 'Closed',
        'referred' => 'Referred'
    ];
    $status = isset($statusMap[$data->status]) ? $statusMap[$data->status] : 'Open';
    
    // Build notes field with all the extra info (diagnosis, recommendations)
    $notesArray = [];
    if (!empty($data->diagnosis)) {
        $notesArray[] = "Diagnosis: " . $data->diagnosis;
    }
    if (!empty($data->recommendations)) {
        $notesArray[] = "Recommendations: " . $data->recommendations;
    }
    $notes = !empty($notesArray) ? implode("\n\n", $notesArray) : null;
    
    // Insert medical visit into medical_visits table
    // Save diagnosis to notes column (primary) and chief_complaint (for backwards compatibility)
    $diagnosis = $data->diagnosis ?? '';
    
    $query = "INSERT INTO medical_visits (
                student_id, 
                clinic_staff_id,
                visit_datetime, 
                visit_type,
                notes,
                status
              ) VALUES (
                :student_id,
                :clinic_staff_id,
                :visit_datetime,
                :visit_type,
                :notes,
                :status
              )";
    
    $stmt = $db->prepare($query);
    
    // Set values
    $visitDateTime = !empty($data->date_time) ? $data->date_time : date('Y-m-d H:i:s');
    
    $stmt->bindParam(':student_id', $data->student_id);
    $stmt->bindParam(':clinic_staff_id', $clinicStaffId);
    $stmt->bindParam(':visit_datetime', $visitDateTime);
    $stmt->bindParam(':visit_type', $visitType);
    $stmt->bindParam(':notes', $diagnosis);
    $stmt->bindParam(':status', $status);
    
    $stmt->execute();
    $visitId = $db->lastInsertId();
    
    error_log("Visit saved with ID: " . $visitId);
    
    // Insert vitals into vitals table if provided
    $hasVitals = !empty($data->vitals) && (
        !empty($data->vitals->temperature) || 
        !empty($data->vitals->blood_pressure) || 
        !empty($data->vitals->pulse_rate) || 
        !empty($data->vitals->respiratory_rate)
    );
    
    if ($hasVitals) {
        $hasTemperature = hasColumn($db, 'vitals', 'temperature');
        $hasTemperatureC = hasColumn($db, 'vitals', 'temperature_c');
        $hasBloodPressure = hasColumn($db, 'vitals', 'blood_pressure');
        $hasBpSystolic = hasColumn($db, 'vitals', 'bp_systolic');
        $hasBpDiastolic = hasColumn($db, 'vitals', 'bp_diastolic');
        $hasPulseRate = hasColumn($db, 'vitals', 'pulse_rate');
        $hasRespiratoryRate = hasColumn($db, 'vitals', 'respiratory_rate');
        $hasRespirationRate = hasColumn($db, 'vitals', 'respiration_rate');

        // Parse blood pressure into systolic/diastolic for legacy schema
        $bpSystolic = null;
        $bpDiastolic = null;
        if (!empty($data->vitals->blood_pressure)) {
            $bpParts = explode('/', $data->vitals->blood_pressure);
            if (count($bpParts) == 2) {
                $bpSystolic = intval(trim($bpParts[0]));
                $bpDiastolic = intval(trim($bpParts[1]));
            }
        }

        $temperature = !empty($data->vitals->temperature) ? $data->vitals->temperature : null;
        $bloodPressure = !empty($data->vitals->blood_pressure) ? $data->vitals->blood_pressure : null;
        $pulseRate = !empty($data->vitals->pulse_rate) ? $data->vitals->pulse_rate : null;
        $respiratoryRate = !empty($data->vitals->respiratory_rate) ? $data->vitals->respiratory_rate : null;

        $insertColumns = ['visit_id', 'recorded_at'];
        $insertPlaceholders = [':visit_id', ':recorded_at'];

        if ($hasTemperature) {
            $insertColumns[] = 'temperature';
            $insertPlaceholders[] = ':temperature';
        } elseif ($hasTemperatureC) {
            $insertColumns[] = 'temperature_c';
            $insertPlaceholders[] = ':temperature';
        }

        if ($hasBloodPressure) {
            $insertColumns[] = 'blood_pressure';
            $insertPlaceholders[] = ':blood_pressure';
        } else {
            if ($hasBpSystolic) {
                $insertColumns[] = 'bp_systolic';
                $insertPlaceholders[] = ':bp_systolic';
            }
            if ($hasBpDiastolic) {
                $insertColumns[] = 'bp_diastolic';
                $insertPlaceholders[] = ':bp_diastolic';
            }
        }

        if ($hasPulseRate) {
            $insertColumns[] = 'pulse_rate';
            $insertPlaceholders[] = ':pulse_rate';
        }

        if ($hasRespiratoryRate) {
            $insertColumns[] = 'respiratory_rate';
            $insertPlaceholders[] = ':respiratory_rate';
        } elseif ($hasRespirationRate) {
            $insertColumns[] = 'respiration_rate';
            $insertPlaceholders[] = ':respiratory_rate';
        }
        
        $vitalsQuery = "INSERT INTO vitals (" . implode(', ', $insertColumns) . ") VALUES (" . implode(', ', $insertPlaceholders) . ")";
        
        $vitalsStmt = $db->prepare($vitalsQuery);
        
        $vitalsStmt->bindParam(':visit_id', $visitId);
        $vitalsStmt->bindParam(':recorded_at', $visitDateTime);

        if (strpos($vitalsQuery, ':temperature') !== false) {
            $vitalsStmt->bindParam(':temperature', $temperature);
        }
        if (strpos($vitalsQuery, ':blood_pressure') !== false) {
            $vitalsStmt->bindParam(':blood_pressure', $bloodPressure);
        }
        if (strpos($vitalsQuery, ':bp_systolic') !== false) {
            $vitalsStmt->bindParam(':bp_systolic', $bpSystolic);
        }
        if (strpos($vitalsQuery, ':bp_diastolic') !== false) {
            $vitalsStmt->bindParam(':bp_diastolic', $bpDiastolic);
        }
        if (strpos($vitalsQuery, ':pulse_rate') !== false) {
            $vitalsStmt->bindParam(':pulse_rate', $pulseRate);
        }
        if (strpos($vitalsQuery, ':respiratory_rate') !== false) {
            $vitalsStmt->bindParam(':respiratory_rate', $respiratoryRate);
        }
        
        $vitalsStmt->execute();
    }
    
    // Insert diagnosis into diagnoses table if provided
    if (!empty($data->diagnosis)) {
        $diagQuery = "INSERT INTO diagnoses (visit_id, diagnosis_text) VALUES (:visit_id, :diagnosis_text)";
        $diagStmt = $db->prepare($diagQuery);
        $diagStmt->bindParam(':visit_id', $visitId);
        $diagStmt->bindParam(':diagnosis_text', $data->diagnosis);
        $diagStmt->execute();
    }
    
    // Treatment and medication tables have been removed - no longer inserting these
    
    // Implement different workflows based on visit type
    if ($data->visit_type === 'emergency') {
        // EMERGENCY WORKFLOW
        
        // 1. Notify Admin immediately
        $adminQuery = "SELECT u.user_id, u.email, u.full_name 
                       FROM users u 
                       INNER JOIN roles r ON u.role_id = r.role_id
                       WHERE r.role_name = 'Admin' AND u.is_active = 1";
        $adminStmt = $db->prepare($adminQuery);
        $adminStmt->execute();
        
        while ($admin = $adminStmt->fetch(PDO::FETCH_ASSOC)) {
            // Get student info for notification
            $studentQuery = "SELECT CONCAT(first_name, ' ', last_name) as full_name, student_number, grade_level, section
                            FROM students WHERE student_id = :student_id";
            $studentStmt = $db->prepare($studentQuery);
            $studentStmt->bindParam(':student_id', $data->student_id);
            $studentStmt->execute();
            $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
            
            $emergencyMessage = "EMERGENCY ALERT: Student {$student['full_name']} ({$student['student_number']}) from Grade {$student['grade_level']}-{$student['section']} has been flagged for emergency medical attention. Diagnosis: {$data->diagnosis}";
            
            // Check if notifications table has user_id and priority columns
            $checkColumns = "SHOW COLUMNS FROM notifications LIKE 'user_id'";
            $checkStmt = $db->prepare($checkColumns);
            $checkStmt->execute();
            $hasUserIdColumn = $checkStmt->rowCount() > 0;
            
            if ($hasUserIdColumn) {
                // Use enhanced notification structure
                $adminNotifQuery = "INSERT INTO notifications (user_id, visit_id, student_id, channel, message, priority, status, created_at) 
                                   VALUES (:user_id, :visit_id, :student_id, 'System', :message, 'urgent', 'Pending', NOW())";
                $adminNotifStmt = $db->prepare($adminNotifQuery);
                $adminNotifStmt->bindParam(':user_id', $admin['user_id']);
                $adminNotifStmt->bindParam(':visit_id', $visitId);
                $adminNotifStmt->bindParam(':student_id', $data->student_id);
                $adminNotifStmt->bindParam(':message', $emergencyMessage);
                $adminNotifStmt->execute();
            } else {
                // Fallback to basic notification structure
                error_log("EMERGENCY: Admin {$admin['full_name']} should be notified about emergency visit for student {$student['full_name']} - {$emergencyMessage}");
            }
            
            // Send email notification for emergency
            if (!empty($admin['email'])) {
                $visitData = [
                    'chief_complaint' => $data->diagnosis,
                    'visit_datetime' => $visitDateTime,
                    'staff_name' => 'Clinic Staff' // You can get actual staff name if needed
                ];
                
                $emailSent = $emailService->sendEmergencyNotification(
                    $admin['email'],
                    $admin['full_name'],
                    $student,
                    $visitData
                );
                
                if ($emailSent) {
                    error_log("EMERGENCY EMAIL: Sent to admin {$admin['full_name']} at {$admin['email']}");
                } else {
                    error_log("EMERGENCY EMAIL FAILED: Could not send to admin {$admin['full_name']} at {$admin['email']}");
                }
            }
        }
        
        // 2. Force parent notification for emergency cases
        $data->notify_parent = true;
        
    } else {
        // ROUTINE WORKFLOW
        
        // 1. Notify Adviser for routine visits
        $adviserQuery = "SELECT a.adviser_id, a.user_id, u.email, u.full_name
                 FROM students s
                 JOIN users u ON s.current_adviser_id = u.user_id
                 JOIN advisers a ON a.user_id = u.user_id
                 WHERE s.student_id = :student_id AND a.is_active = 1
                 LIMIT 1";
        $adviserStmt = $db->prepare($adviserQuery);
        $adviserStmt->bindParam(':student_id', $data->student_id);
        $adviserStmt->execute();
        
        if ($adviserStmt->rowCount() > 0) {
            $adviser = $adviserStmt->fetch(PDO::FETCH_ASSOC);
            
            // Get student name
            $studentQuery = "SELECT CONCAT(first_name, ' ', last_name) as full_name, student_number 
                            FROM students WHERE student_id = :student_id";
            $studentStmt = $db->prepare($studentQuery);
            $studentStmt->bindParam(':student_id', $data->student_id);
            $studentStmt->execute();
            $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
            
            $routineMessage = "Student {$student['full_name']} ({$student['student_number']}) visited the clinic for routine care. Diagnosis: {$data->diagnosis}";
            
            // Check if notifications table has user_id and priority columns
            $checkColumns = "SHOW COLUMNS FROM notifications LIKE 'user_id'";
            $checkStmt = $db->prepare($checkColumns);
            $checkStmt->execute();
            $hasUserIdColumn = $checkStmt->rowCount() > 0;
            
            if ($hasUserIdColumn) {
                // Use enhanced notification structure
                $adviserNotifQuery = "INSERT INTO notifications (user_id, visit_id, student_id, channel, message, priority, status, created_at) 
                                     VALUES (:user_id, :visit_id, :student_id, 'System', :message, 'normal', 'Pending', NOW())";
                $adviserNotifStmt = $db->prepare($adviserNotifQuery);
                $adviserNotifStmt->bindParam(':user_id', $adviser['user_id']);
                $adviserNotifStmt->bindParam(':visit_id', $visitId);
                $adviserNotifStmt->bindParam(':student_id', $data->student_id);
                $adviserNotifStmt->bindParam(':message', $routineMessage);
                $adviserNotifStmt->execute();
            } else {
                // Fallback to basic notification structure
                error_log("ROUTINE: Adviser {$adviser['full_name']} should be notified about routine visit for student {$student['full_name']} - {$routineMessage}");
            }
            
            // Send email notification for routine visit
            if (!empty($adviser['email'])) {
                $visitData = [
                    'chief_complaint' => $data->diagnosis,
                    'visit_datetime' => $visitDateTime,
                    'staff_name' => 'Clinic Staff'
                ];
                
                $emailSent = $emailService->sendRoutineNotification(
                    $adviser['email'],
                    $adviser['full_name'],
                    $student,
                    $visitData
                );
                
                if ($emailSent) {
                    error_log("ROUTINE EMAIL: Sent to adviser {$adviser['full_name']} at {$adviser['email']}");
                } else {
                    error_log("ROUTINE EMAIL FAILED: Could not send to adviser {$adviser['full_name']} at {$adviser['email']}");
                }
            }
        }
    }
    
    // If notify parent is checked, send SMS notification
    $smsSent = false;
    $smsMessage = '';
    if (!empty($data->notify_parent) && $data->notify_parent === true) {
        // Get student name and parent phone
        $studentQuery = "SELECT s.first_name, s.last_name, s.student_number, s.emergency_contact,
                                (SELECT p.phone FROM parents p 
                                 JOIN student_parent sp ON p.parent_id = sp.parent_id 
                                 WHERE sp.student_id = s.student_id LIMIT 1) as parent_phone
                         FROM students s WHERE s.student_id = :student_id";
        $studentStmt = $db->prepare($studentQuery);
        $studentStmt->bindParam(':student_id', $data->student_id);
        $studentStmt->execute();
        $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
        
        $parentPhone = !empty($data->parent_phone) ? $data->parent_phone : 
                       ($student['parent_phone'] ?: $student['emergency_contact']);
        
        if ($parentPhone) {
            $studentName = trim($student['first_name'] . ' ' . $student['last_name']);
            $diagnosis = $data->diagnosis;
            
            // Check for frequent visit patterns before sending regular SMS
            $patternAlert = checkFrequentVisitPattern($db, $data->student_id, $diagnosis, $visitId);
            
            if ($patternAlert) {
                // Send pattern alert SMS instead of regular SMS
                $smsMessage = $patternAlert['message'];
                error_log("PATTERN ALERT SMS to {$parentPhone}: {$smsMessage}");
                
                // Insert pattern alert notification
                $notifQuery = "INSERT INTO notifications (student_id, visit_id, channel, message, status, created_at, priority) 
                              VALUES (:student_id, :visit_id, 'SMS', :message, 'Pending', NOW(), 'urgent')";
                $notifStmt = $db->prepare($notifQuery);
                $notifStmt->bindParam(':student_id', $data->student_id);
                $notifStmt->bindParam(':visit_id', $visitId);
                $notifStmt->bindParam(':message', $smsMessage);
                $notifStmt->execute();
                
                $smsSent = true;
                $responseMessage = 'Medical visit saved successfully. Pattern alert SMS queued for parent.';
            } else {
                // Send regular SMS
                $smsMessage = "Good day! This is from Four Seasons School Clinic. Your child {$studentName} visited the clinic today. Diagnosis: {$diagnosis}. Please contact the clinic for more details.";
                error_log("SMS to {$parentPhone}: {$smsMessage}");
                
                // Insert regular notification
                $notifQuery = "INSERT INTO notifications (student_id, visit_id, channel, message, status, created_at) 
                              VALUES (:student_id, :visit_id, 'SMS', :message, 'Pending', NOW())";
                $notifStmt = $db->prepare($notifQuery);
                $notifStmt->bindParam(':student_id', $data->student_id);
                $notifStmt->bindParam(':visit_id', $visitId);
                $notifStmt->bindParam(':message', $smsMessage);
                $notifStmt->execute();
                
                $smsSent = true;
            }
        }
    }
    
    $db->commit();
    
    // Set response message (may have been set in pattern alert logic)
    if (!isset($responseMessage)) {
        $responseMessage = 'Medical visit saved successfully';
        if ($smsSent) {
            $responseMessage .= '. SMS notification queued for parent.';
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => $responseMessage,
        'visit_id' => $visitId,
        'sms_sent' => $smsSent
    ]);
    
} catch (PDOException $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
