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
        // Parse blood pressure into systolic/diastolic
        $bpSystolic = null;
        $bpDiastolic = null;
        if (!empty($data->vitals->blood_pressure)) {
            $bpParts = explode('/', $data->vitals->blood_pressure);
            if (count($bpParts) == 2) {
                $bpSystolic = intval(trim($bpParts[0]));
                $bpDiastolic = intval(trim($bpParts[1]));
            }
        }
        
        $vitalsQuery = "INSERT INTO vitals (
                          visit_id,
                          recorded_at,
                          temperature_c,
                          bp_systolic,
                          bp_diastolic,
                          pulse_rate,
                          respiration_rate
                        ) VALUES (
                          :visit_id,
                          :recorded_at,
                          :temperature,
                          :bp_systolic,
                          :bp_diastolic,
                          :pulse_rate,
                          :respiration_rate
                        )";
        
        $vitalsStmt = $db->prepare($vitalsQuery);
        $temperature = !empty($data->vitals->temperature) ? $data->vitals->temperature : null;
        $pulseRate = !empty($data->vitals->pulse_rate) ? $data->vitals->pulse_rate : null;
        $respiratoryRate = !empty($data->vitals->respiratory_rate) ? $data->vitals->respiratory_rate : null;
        
        $vitalsStmt->bindParam(':visit_id', $visitId);
        $vitalsStmt->bindParam(':recorded_at', $visitDateTime);
        $vitalsStmt->bindParam(':temperature', $temperature);
        $vitalsStmt->bindParam(':bp_systolic', $bpSystolic);
        $vitalsStmt->bindParam(':bp_diastolic', $bpDiastolic);
        $vitalsStmt->bindParam(':pulse_rate', $pulseRate);
        $vitalsStmt->bindParam(':respiration_rate', $respiratoryRate);
        
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
                         JOIN advisers a ON s.grade_level = a.grade_level AND s.section = a.section
                         JOIN users u ON a.user_id = u.user_id
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
            
            // Create SMS message
            $smsMessage = "Good day! This is from Four Seasons School Clinic. Your child {$studentName} visited the clinic today. Diagnosis: {$diagnosis}. Please contact the clinic for more details.";
            
            // Log the SMS (in production, integrate with SMS gateway like Semaphore, Globe Labs, etc.)
            error_log("SMS to {$parentPhone}: {$smsMessage}");
            
            // Insert notification record
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
    
    $db->commit();
    
    $responseMessage = 'Medical visit saved successfully';
    if ($smsSent) {
        $responseMessage .= '. SMS notification queued for parent.';
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
