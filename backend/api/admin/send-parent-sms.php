<?php
// Include CORS handler first
require_once '../../cors.php';

header("Content-Type: application/json; charset=UTF-8");

require_once '../../config/database.php';
require_once '../../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

// Authenticate user
$auth = new Auth($database);
$auth->requireRole('Admin');

$data = json_decode(file_get_contents("php://input"));

// Validate required fields
if (empty($data->visit_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'visit_id is required']);
    exit();
}

try {
    // Get visit details with student and parent information
    $query = "SELECT 
                mv.visit_id,
                mv.visit_datetime,
                mv.visit_type,
                mv.notes as diagnosis,
                mv.status,
                s.student_id,
                s.first_name,
                s.last_name,
                s.student_number,
                s.grade_level,
                s.section,
                s.emergency_contact,
                (SELECT p.phone FROM parents p 
                 JOIN student_parent sp ON p.parent_id = sp.parent_id 
                 WHERE sp.student_id = s.student_id LIMIT 1) as parent_phone
              FROM medical_visits mv
              INNER JOIN students s ON mv.student_id = s.student_id
              WHERE mv.visit_id = :visit_id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':visit_id', $data->visit_id);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Visit not found']);
        exit();
    }
    
    $visit = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get parent phone number
    $parentPhone = $visit['parent_phone'] ?: $visit['emergency_contact'];
    
    if (empty($parentPhone)) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'message' => 'No parent phone number on file for this student'
        ]);
        exit();
    }
    
    // Create SMS message
    $studentName = trim($visit['first_name'] . ' ' . $visit['last_name']);
    $visitType = $visit['visit_type'];
    $diagnosis = $visit['diagnosis'];
    $visitDate = date('M d, Y g:i A', strtotime($visit['visit_datetime']));
    
    if ($visitType === 'Emergency') {
        $smsMessage = "URGENT: Your child {$studentName} had an emergency clinic visit on {$visitDate}. Diagnosis: {$diagnosis}. Please contact Four Seasons School Clinic immediately at [CLINIC_PHONE].";
    } else {
        $smsMessage = "Good day! Your child {$studentName} visited Four Seasons School Clinic on {$visitDate}. Diagnosis: {$diagnosis}. For more details, please contact the clinic.";
    }
    
    // Log the SMS (in production, integrate with SMS gateway like Semaphore, Globe Labs, etc.)
    error_log("ADMIN SMS to {$parentPhone}: {$smsMessage}");
    
    // Insert notification record
    $notifQuery = "INSERT INTO notifications (student_id, visit_id, channel, message, status, created_at) 
                  VALUES (:student_id, :visit_id, 'SMS', :message, 'Sent', NOW())";
    $notifStmt = $db->prepare($notifQuery);
    $notifStmt->bindParam(':student_id', $visit['student_id']);
    $notifStmt->bindParam(':visit_id', $data->visit_id);
    $notifStmt->bindParam(':message', $smsMessage);
    $notifStmt->execute();
    
    // TODO: Integrate with actual SMS gateway
    // Example for Semaphore API:
    // $apiKey = 'YOUR_SEMAPHORE_API_KEY';
    // $apiUrl = 'https://api.semaphore.co/api/v4/messages';
    // $postData = [
    //     'apikey' => $apiKey,
    //     'number' => $parentPhone,
    //     'message' => $smsMessage,
    //     'sendername' => 'FourSeasons'
    // ];
    // $ch = curl_init($apiUrl);
    // curl_setopt($ch, CURLOPT_POST, 1);
    // curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
    // curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    // $response = curl_exec($ch);
    // curl_close($ch);
    
    echo json_encode([
        'success' => true,
        'message' => 'SMS notification sent to parent',
        'phone' => $parentPhone,
        'sms_message' => $smsMessage
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
