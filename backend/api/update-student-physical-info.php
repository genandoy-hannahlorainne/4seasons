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
$auth->requireRole('Student');

$data = json_decode(file_get_contents("php://input"));

// Validate required fields
if (empty($data->height_cm) && empty($data->weight_kg) && empty($data->blood_type)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'At least one field (height, weight, or blood type) is required']);
    exit();
}

try {
    // Get student ID from authenticated user
    $userId = $auth->userId();
    
    // Get student record
    $studentQuery = "SELECT student_id FROM students WHERE user_id = :user_id AND is_active = 1";
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(':user_id', $userId);
    $studentStmt->execute();
    
    if ($studentStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Student record not found']);
        exit();
    }
    
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    $studentId = $student['student_id'];
    
    // Calculate BMI if both height and weight are provided
    $bmi = null;
    $bmiCategory = null;
    
    if (!empty($data->height_cm) && !empty($data->weight_kg)) {
        $heightInMeters = $data->height_cm / 100;
        $bmi = $data->weight_kg / ($heightInMeters * $heightInMeters);
        
        // Determine BMI category
        if ($bmi < 18.5) {
            $bmiCategory = 'Underweight';
        } elseif ($bmi < 25) {
            $bmiCategory = 'Normal weight';
        } elseif ($bmi < 30) {
            $bmiCategory = 'Overweight';
        } else {
            $bmiCategory = 'Obese';
        }
    }
    
    // Build update query dynamically
    $updateFields = [];
    $params = [':student_id' => $studentId];
    
    if (!empty($data->height_cm)) {
        $updateFields[] = "height_cm = :height_cm";
        $params[':height_cm'] = $data->height_cm;
    }
    
    if (!empty($data->weight_kg)) {
        $updateFields[] = "weight_kg = :weight_kg";
        $params[':weight_kg'] = $data->weight_kg;
    }
    
    if (!empty($data->blood_type)) {
        $updateFields[] = "blood_type = :blood_type";
        $params[':blood_type'] = $data->blood_type;
    }
    
    if ($bmi !== null) {
        $updateFields[] = "bmi = :bmi";
        $updateFields[] = "bmi_category = :bmi_category";
        $params[':bmi'] = round($bmi, 2);
        $params[':bmi_category'] = $bmiCategory;
    }
    
    $updateFields[] = "last_physical_update = NOW()";
    
    $updateQuery = "UPDATE students SET " . implode(', ', $updateFields) . " WHERE student_id = :student_id";
    
    $updateStmt = $db->prepare($updateQuery);
    
    foreach ($params as $key => $value) {
        $updateStmt->bindValue($key, $value);
    }
    
    $updateStmt->execute();
    
    if ($updateStmt->rowCount() > 0) {
        // Log the activity
        $auth->logActivity('Update Physical Info', 'Updated physical information (height, weight, BMI, blood type)');
        
        echo json_encode([
            'success' => true,
            'message' => 'Physical information updated successfully',
            'data' => [
                'height_cm' => $data->height_cm ?? null,
                'weight_kg' => $data->weight_kg ?? null,
                'blood_type' => $data->blood_type ?? null,
                'bmi' => $bmi ? round($bmi, 2) : null,
                'bmi_category' => $bmiCategory
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'No changes were made']);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>