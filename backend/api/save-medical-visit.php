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
$auth->requireRole('Clinic Staff');

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
    // Form sends: walk-in, emergency, scheduled, follow-up
    // DB expects: Routine, Emergency, Follow-up, Referral
    $visitTypeMap = [
        'walk-in' => 'Routine',
        'emergency' => 'Emergency',
        'scheduled' => 'Routine',
        'follow-up' => 'Follow-up'
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
    
    // Build notes field with all the extra info (diagnosis, treatment, medications, recommendations)
    $notesArray = [];
    if (!empty($data->diagnosis)) {
        $notesArray[] = "Diagnosis: " . $data->diagnosis;
    }
    if (!empty($data->treatment)) {
        $notesArray[] = "Treatment: " . $data->treatment;
    }
    if (!empty($data->medications)) {
        $notesArray[] = "Medications: " . $data->medications;
    }
    if (!empty($data->recommendations)) {
        $notesArray[] = "Recommendations: " . $data->recommendations;
    }
    $notes = !empty($notesArray) ? implode("\n\n", $notesArray) : null;
    
    // Insert medical visit into medical_visits table
    // Table columns: visit_id, student_id, clinic_staff_id, visit_datetime, visit_type, chief_complaint, notes, status
    $query = "INSERT INTO medical_visits (
                student_id, 
                clinic_staff_id,
                visit_datetime, 
                visit_type,
                chief_complaint, 
                notes,
                status
              ) VALUES (
                :student_id,
                :clinic_staff_id,
                :visit_datetime,
                :visit_type,
                :chief_complaint,
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
    $stmt->bindParam(':chief_complaint', $data->chief_complaint);
    $stmt->bindParam(':notes', $notes);
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
    
    // Insert treatment into treatments table if provided
    if (!empty($data->treatment)) {
        $treatQuery = "INSERT INTO treatments (visit_id, treatment_text) VALUES (:visit_id, :treatment_text)";
        $treatStmt = $db->prepare($treatQuery);
        $treatStmt->bindParam(':visit_id', $visitId);
        $treatStmt->bindParam(':treatment_text', $data->treatment);
        $treatStmt->execute();
    }
    
    // Insert medications into medications table if provided
    if (!empty($data->medications)) {
        $medQuery = "INSERT INTO medications (visit_id, medication_name, notes) VALUES (:visit_id, :medication_name, :notes)";
        $medStmt = $db->prepare($medQuery);
        $medStmt->bindParam(':visit_id', $visitId);
        $medStmt->bindParam(':medication_name', $data->medications);
        $medNotes = !empty($data->recommendations) ? $data->recommendations : null;
        $medStmt->bindParam(':notes', $medNotes);
        $medStmt->execute();
    }
    
    // If notify adviser is checked, create notification
    if (!empty($data->notify_adviser) && $data->notify_adviser === true) {
        // Get student's adviser
        $adviserQuery = "SELECT a.adviser_id, a.user_id, u.email
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
            
            // Create notification record (you can expand this table later)
            // For now, just log it
            error_log("Notification: Adviser {$adviser['adviser_id']} notified about student {$student['full_name']} visit");
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
            $complaint = $data->chief_complaint;
            
            // Create SMS message
            $smsMessage = "Good day! This is from Four Seasons School Clinic. Your child {$studentName} visited the clinic today. Reason: {$complaint}. Please contact the clinic for more details.";
            
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
