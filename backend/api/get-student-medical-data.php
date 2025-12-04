<?php
// CORS headers
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$student_id = isset($_GET['student_id']) ? $_GET['student_id'] : null;

if (!$student_id) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Student ID is required'
    ]);
    exit();
}

try {
    // Get latest vitals
    $vitalsQuery = "SELECT 
                        v.weight_kg,
                        v.height_cm,
                        v.bmi,
                        v.bmi_category,
                        v.recorded_at
                    FROM vitals v
                    INNER JOIN medical_visits mv ON v.visit_id = mv.visit_id
                    WHERE mv.student_id = :student_id
                    ORDER BY v.recorded_at DESC
                    LIMIT 1";
    
    $vitalsStmt = $db->prepare($vitalsQuery);
    $vitalsStmt->bindParam(":student_id", $student_id);
    $vitalsStmt->execute();
    $vitals = $vitalsStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get allergies
    $allergiesQuery = "SELECT 
                          allergy_text,
                          severity,
                          recorded_at
                       FROM allergies
                       WHERE student_id = :student_id
                       ORDER BY recorded_at DESC";
    
    $allergiesStmt = $db->prepare($allergiesQuery);
    $allergiesStmt->bindParam(":student_id", $student_id);
    $allergiesStmt->execute();
    $allergies = $allergiesStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get immunizations
    $immunizationsQuery = "SELECT 
                              vaccine_name,
                              date_administered,
                              administered_by,
                              notes
                           FROM immunizations
                           WHERE student_id = :student_id
                           ORDER BY date_administered DESC";
    
    $immunizationsStmt = $db->prepare($immunizationsQuery);
    $immunizationsStmt->bindParam(":student_id", $student_id);
    $immunizationsStmt->execute();
    $immunizations = $immunizationsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get last visit
    $lastVisitQuery = "SELECT 
                          visit_datetime,
                          visit_type,
                          chief_complaint
                       FROM medical_visits
                       WHERE student_id = :student_id
                       ORDER BY visit_datetime DESC
                       LIMIT 1";
    
    $lastVisitStmt = $db->prepare($lastVisitQuery);
    $lastVisitStmt->bindParam(":student_id", $student_id);
    $lastVisitStmt->execute();
    $lastVisit = $lastVisitStmt->fetch(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'vitals' => $vitals ?: null,
            'allergies' => $allergies,
            'immunizations' => $immunizations,
            'last_visit' => $lastVisit ?: null
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching medical data: ' . $e->getMessage()
    ]);
}
?>
