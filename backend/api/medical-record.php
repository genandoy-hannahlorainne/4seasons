<?php
// CORS headers
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: GET, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id");
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

// Get user_id from header or query parameter
$user_id = null;
if (isset($_SERVER['HTTP_USER_ID'])) {
    $user_id = $_SERVER['HTTP_USER_ID'];
} elseif (isset($_GET['user_id'])) {
    $user_id = $_GET['user_id'];
}

if (!$user_id) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'User ID is required'
    ]);
    exit();
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get student information
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
        
        if (!$student) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Student not found'
            ]);
            exit();
        }
        
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
        $allergiesStmt->bindParam(":student_id", $student['student_id']);
        $allergiesStmt->execute();
        $allergies = $allergiesStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get visit counts
        $recentVisitsQuery = "SELECT COUNT(*) as count
                             FROM medical_visits
                             WHERE student_id = :student_id
                             AND visit_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        
        $recentVisitsStmt = $db->prepare($recentVisitsQuery);
        $recentVisitsStmt->bindParam(":student_id", $student['student_id']);
        $recentVisitsStmt->execute();
        $recentVisitsCount = $recentVisitsStmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        $totalVisitsQuery = "SELECT COUNT(*) as count
                            FROM medical_visits
                            WHERE student_id = :student_id";
        
        $totalVisitsStmt = $db->prepare($totalVisitsQuery);
        $totalVisitsStmt->bindParam(":student_id", $student['student_id']);
        $totalVisitsStmt->execute();
        $totalVisitsCount = $totalVisitsStmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        // Format response
        $response = [
            'success' => true,
            'data' => [
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
                    'section' => $student['section']
                ],
                'allergies' => array_map(function($allergy) {
                    return [
                        'allergy_id' => (int)$allergy['allergy_id'],
                        'allergy_text' => $allergy['allergy_text'],
                        'severity' => $allergy['severity'],
                        'recorded_at' => $allergy['recorded_at']
                    ];
                }, $allergies),
                'recent_visits_count' => (int)$recentVisitsCount,
                'total_visits_count' => (int)$totalVisitsCount
            ]
        ];
        
        http_response_code(200);
        echo json_encode($response);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Handle updates to medical info
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid JSON input'
            ]);
            exit();
        }
        
        // Get student ID first
        $studentQuery = "SELECT student_id FROM students WHERE user_id = :user_id AND is_active = 1";
        $studentStmt = $db->prepare($studentQuery);
        $studentStmt->bindParam(":user_id", $user_id);
        $studentStmt->execute();
        $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$student) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Student not found'
            ]);
            exit();
        }
        
        // Update allowed fields
        $updateFields = [];
        $params = [':student_id' => $student['student_id']];
        
        if (isset($input['address'])) {
            $updateFields[] = "address = :address";
            $params[':address'] = $input['address'];
        }
        
        if (isset($input['emergency_contact'])) {
            $updateFields[] = "emergency_contact = :emergency_contact";
            $params[':emergency_contact'] = $input['emergency_contact'];
        }
        
        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'No valid fields to update'
            ]);
            exit();
        }
        
        $updateQuery = "UPDATE students SET " . implode(', ', $updateFields) . " WHERE student_id = :student_id";
        $updateStmt = $db->prepare($updateQuery);
        
        if ($updateStmt->execute($params)) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Medical information updated successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update medical information'
            ]);
        }
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error processing request: ' . $e->getMessage()
    ]);
}
?>