<?php
// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, X-Requested-With");
header("Access-Control-Max-Age: 3600");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get student_id from query parameter (direct) or user_id (indirect)
$student_id = null;
$student = null;

if (isset($_GET['student_id'])) {
    // Direct student_id provided
    $student_id = $_GET['student_id'];
    
    // Get student info
    $studentQuery = "SELECT 
                        s.student_id,
                        s.student_number,
                        s.first_name,
                        s.middle_name,
                        s.last_name,
                        s.birth_date,
                        s.gender,
                        s.blood_type,
                        s.address,
                        s.emergency_contact,
                        s.grade_level,
                        s.section
                     FROM students s
                     WHERE s.student_id = :student_id AND s.is_active = 1";
    
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(":student_id", $student_id);
    $studentStmt->execute();
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    
} elseif (isset($_GET['user_id']) || isset($_SERVER['HTTP_USER_ID'])) {
    // Get user_id from header or query parameter
    $user_id = isset($_SERVER['HTTP_USER_ID']) ? $_SERVER['HTTP_USER_ID'] : $_GET['user_id'];
    
    error_log("Getting student for user_id: " . $user_id);
    
    // Get student info from user_id
    $studentQuery = "SELECT 
                        s.student_id,
                        s.student_number,
                        s.first_name,
                        s.middle_name,
                        s.last_name,
                        s.birth_date,
                        s.gender,
                        s.blood_type,
                        s.address,
                        s.emergency_contact,
                        s.grade_level,
                        s.section
                     FROM students s
                     WHERE s.user_id = :user_id AND s.is_active = 1";
    
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(":user_id", $user_id);
    $studentStmt->execute();
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    
    error_log("Student found: " . ($student ? "Yes" : "No"));
    
    if ($student) {
        $student_id = $student['student_id'];
    }
} else {
    // Default for testing
    $user_id = 19;
    error_log("No user_id provided, using default: $user_id");
    
    $studentQuery = "SELECT 
                        s.student_id,
                        s.student_number,
                        s.first_name,
                        s.middle_name,
                        s.last_name,
                        s.birth_date,
                        s.gender,
                        s.blood_type,
                        s.address,
                        s.emergency_contact,
                        s.grade_level,
                        s.section
                     FROM students s
                     WHERE s.user_id = :user_id AND s.is_active = 1";
    
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(":user_id", $user_id);
    $studentStmt->execute();
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($student) {
        $student_id = $student['student_id'];
    }
}

try {
    if (!$student || !$student_id) {
        error_log("Student not found - student: " . ($student ? "exists" : "null") . ", student_id: " . ($student_id ? $student_id : "null"));
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Student not found. Please ensure you are logged in as a student.'
        ]);
        exit();
    }

    // Get vitals - for now, we'll return null since vitals aren't stored in separate columns
    // In the future, vitals could be stored in a separate table or added to medical_visits
    $vitals = null;

    // Get allergies
    $allergiesQuery = "SELECT 
                          allergy_id,
                          allergy_text,
                          severity,
                          recorded_at
                       FROM allergies
                       WHERE student_id = :student_id
                       ORDER BY recorded_at DESC";
    
    $allergiesStmt = $db->prepare($allergiesQuery);
    $allergiesStmt->bindParam(":student_id", $student_id);
    
    try {
        $allergiesStmt->execute();
        $allergies = $allergiesStmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Allergies table error: " . $e->getMessage());
        $allergies = [];
    }
    
    // Get immunizations from the immunizations table
    $immunizationsQuery = "SELECT 
                              immunization_id,
                              vaccine_name,
                              date_administered,
                              administered_by,
                              notes
                           FROM immunizations
                           WHERE student_id = :student_id
                           ORDER BY date_administered DESC";
    
    $immunizationsStmt = $db->prepare($immunizationsQuery);
    $immunizationsStmt->bindParam(":student_id", $student_id);
    
    try {
        $immunizationsStmt->execute();
        $immunizations = $immunizationsStmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        // Table might not exist, use empty array
        error_log("Immunizations table error: " . $e->getMessage());
        $immunizations = [];
    }
    
    // Get last visit
    $lastVisitQuery = "SELECT 
                          visit_datetime,
                          visit_type,
                          chief_complaint,
                          notes
                       FROM medical_visits
                       WHERE student_id = :student_id
                       ORDER BY visit_datetime DESC
                       LIMIT 1";
    
    $lastVisitStmt = $db->prepare($lastVisitQuery);
    $lastVisitStmt->bindParam(":student_id", $student_id);
    $lastVisitStmt->execute();
    $lastVisit = $lastVisitStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get adviser information
    $adviserQuery = "SELECT 
                        a.adviser_id,
                        a.first_name,
                        a.last_name,
                        a.contact_phone,
                        u.email
                     FROM advisers a
                     INNER JOIN users u ON a.user_id = u.user_id
                     INNER JOIN student_adviser sa ON a.adviser_id = sa.adviser_id
                     WHERE a.is_active = 1
                     AND sa.student_id = :student_id
                     LIMIT 1";
    
    $adviserStmt = $db->prepare($adviserQuery);
    $adviserStmt->bindParam(":student_id", $student_id);
    $adviserStmt->execute();
    $adviser = $adviserStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get visit counts
    $recentVisitsQuery = "SELECT COUNT(*) as count
                         FROM medical_visits
                         WHERE student_id = :student_id
                         AND visit_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    
    $recentVisitsStmt = $db->prepare($recentVisitsQuery);
    $recentVisitsStmt->bindParam(":student_id", $student_id);
    $recentVisitsStmt->execute();
    $recentVisitsCount = $recentVisitsStmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    $totalVisitsQuery = "SELECT COUNT(*) as count
                        FROM medical_visits
                        WHERE student_id = :student_id";
    
    $totalVisitsStmt = $db->prepare($totalVisitsQuery);
    $totalVisitsStmt->bindParam(":student_id", $student_id);
    $totalVisitsStmt->execute();
    $totalVisitsCount = $totalVisitsStmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Format response for dashboard
    $response = [
        'success' => true,
        'data' => [
            'vitals' => $vitals,
            'allergies' => array_map(function($allergy) {
                return [
                    'allergy_id' => (int)$allergy['allergy_id'],
                    'allergy_text' => $allergy['allergy_text'],
                    'severity' => $allergy['severity'],
                    'recorded_at' => $allergy['recorded_at']
                ];
            }, $allergies),
            'immunizations' => array_map(function($imm) {
                return [
                    'immunization_id' => (int)$imm['immunization_id'],
                    'vaccine_name' => $imm['vaccine_name'],
                    'date_administered' => $imm['date_administered'],
                    'administered_by' => $imm['administered_by'],
                    'notes' => $imm['notes']
                ];
            }, $immunizations),
            'last_visit' => $lastVisit ? [
                'visit_datetime' => $lastVisit['visit_datetime'],
                'visit_type' => $lastVisit['visit_type'],
                'chief_complaint' => $lastVisit['chief_complaint'],
                'notes' => $lastVisit['notes']
            ] : null,
            'personal_info' => [
                'student_id' => (int)$student['student_id'],
                'student_number' => $student['student_number'],
                'full_name' => trim($student['first_name'] . ' ' . ($student['middle_name'] ? $student['middle_name'] . ' ' : '') . $student['last_name']),
                'birth_date' => $student['birth_date'],
                'gender' => $student['gender'],
                'blood_type' => $student['blood_type'],
                'address' => $student['address'],
                'emergency_contact' => $student['emergency_contact'],
                'grade_level' => $student['grade_level'],
                'section' => $student['section'],
                'adviser_name' => $adviser ? trim($adviser['first_name'] . ' ' . $adviser['last_name']) : 'Not assigned',
                'adviser_contact' => $adviser ? ($adviser['contact_phone'] ?: $adviser['email']) : 'N/A'
            ],
            'recent_visits_count' => (int)$recentVisitsCount,
            'total_visits_count' => (int)$totalVisitsCount
        ]
    ];
    
    http_response_code(200);
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching medical data: ' . $e->getMessage()
    ]);
}
?>
