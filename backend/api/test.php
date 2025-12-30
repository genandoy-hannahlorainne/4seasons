<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if this is a medical data request
if (isset($_GET['medical']) && $_GET['medical'] === '1') {
    require_once '../config/database.php';
    
    try {
        $database = new Database();
        $db = $database->getConnection();
        
        // Get user_id from header or query parameter
        $user_id = null;
        if (isset($_SERVER['HTTP_USER_ID'])) {
            $user_id = $_SERVER['HTTP_USER_ID'];
        } elseif (isset($_GET['user_id'])) {
            $user_id = $_GET['user_id'];
        } else {
            $user_id = 19; // Default for testing
        }
        
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
                'message' => 'Student not found for user_id: ' . $user_id
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
        echo json_encode([
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
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error fetching medical data: ' . $e->getMessage()
        ]);
    }
    exit();
}

// Default test response
echo json_encode([
    'success' => true,
    'message' => 'Backend is working!',
    'php_version' => phpversion(),
    'server' => $_SERVER['SERVER_SOFTWARE']
]);
?>
