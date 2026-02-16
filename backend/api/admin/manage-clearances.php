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
$auth->requireRole(['Admin', 'Clinic Staff']);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetClearances($db);
        break;
    case 'POST':
        handleCreateClearance($db, $auth);
        break;
    case 'PUT':
        handleUpdateClearance($db, $auth);
        break;
    case 'DELETE':
        handleDeleteClearance($db, $auth);
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}

function handleGetClearances($db) {
    $status = $_GET['status'] ?? 'all';
    $clearanceType = $_GET['type'] ?? 'all';
    $studentId = $_GET['student_id'] ?? null;
    
    $query = "SELECT 
                mc.clearance_id,
                mc.student_id,
                mc.clearance_type,
                mc.status,
                mc.required_for,
                mc.issued_date,
                mc.expiry_date,
                mc.parent_consent,
                mc.doctor_approval,
                mc.doctor_name,
                mc.medical_notes,
                mc.issued_by,
                mc.created_at,
                s.student_number,
                CONCAT(s.first_name, ' ', s.last_name) as student_name,
                s.grade_level,
                s.section,
                s.emergency_contact,
                s.emergency_contact_phone
              FROM medical_clearances mc
              INNER JOIN students s ON mc.student_id = s.student_id
              WHERE s.is_active = 1";
    
    $params = [];
    
    if ($status !== 'all') {
        $query .= " AND mc.status = :status";
        $params[':status'] = $status;
    }
    
    if ($clearanceType !== 'all') {
        $query .= " AND mc.clearance_type = :clearance_type";
        $params[':clearance_type'] = $clearanceType;
    }
    
    if ($studentId) {
        $query .= " AND mc.student_id = :student_id";
        $params[':student_id'] = $studentId;
    }
    
    $query .= " ORDER BY 
                  CASE mc.status 
                    WHEN 'pending' THEN 1 
                    WHEN 'expired' THEN 2 
                    WHEN 'approved' THEN 3 
                    WHEN 'denied' THEN 4 
                  END,
                  mc.created_at DESC";
    
    try {
        $stmt = $db->prepare($query);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        
        $clearances = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format the results
        $formattedClearances = array_map(function($clearance) {
            return [
                'clearance_id' => (int)$clearance['clearance_id'],
                'student' => [
                    'student_id' => (int)$clearance['student_id'],
                    'student_number' => $clearance['student_number'],
                    'name' => $clearance['student_name'],
                    'grade_section' => 'Grade ' . $clearance['grade_level'] . ' - ' . $clearance['section'],
                    'emergency_contact' => $clearance['emergency_contact'],
                    'emergency_phone' => $clearance['emergency_contact_phone']
                ],
                'clearance_type' => $clearance['clearance_type'],
                'status' => $clearance['status'],
                'required_for' => $clearance['required_for'],
                'issued_date' => $clearance['issued_date'],
                'expiry_date' => $clearance['expiry_date'],
                'parent_consent' => (bool)$clearance['parent_consent'],
                'doctor_approval' => (bool)$clearance['doctor_approval'],
                'doctor_name' => $clearance['doctor_name'],
                'medical_notes' => $clearance['medical_notes'],
                'issued_by' => $clearance['issued_by'],
                'created_at' => $clearance['created_at'],
                'days_until_expiry' => $clearance['expiry_date'] ? 
                    floor((strtotime($clearance['expiry_date']) - time()) / (60 * 60 * 24)) : null
            ];
        }, $clearances);
        
        echo json_encode([
            'success' => true,
            'clearances' => $formattedClearances,
            'total' => count($formattedClearances)
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handleCreateClearance($db, $auth) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!$data || !$data->student_id || !$data->clearance_type) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'student_id and clearance_type are required']);
        return;
    }
    
    try {
        $query = "INSERT INTO medical_clearances 
                  (student_id, clearance_type, status, required_for, issued_date, expiry_date, 
                   parent_consent, doctor_approval, doctor_name, medical_notes, issued_by, created_at)
                  VALUES 
                  (:student_id, :clearance_type, :status, :required_for, :issued_date, :expiry_date,
                   :parent_consent, :doctor_approval, :doctor_name, :medical_notes, :issued_by, NOW())";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':student_id', $data->student_id);
        $stmt->bindParam(':clearance_type', $data->clearance_type);
        $stmt->bindParam(':status', $data->status ?? 'pending');
        $stmt->bindParam(':required_for', $data->required_for ?? null);
        $stmt->bindParam(':issued_date', $data->issued_date ?? null);
        $stmt->bindParam(':expiry_date', $data->expiry_date ?? null);
        $stmt->bindParam(':parent_consent', $data->parent_consent ?? false, PDO::PARAM_BOOL);
        $stmt->bindParam(':doctor_approval', $data->doctor_approval ?? false, PDO::PARAM_BOOL);
        $stmt->bindParam(':doctor_name', $data->doctor_name ?? null);
        $stmt->bindParam(':medical_notes', $data->medical_notes ?? null);
        $stmt->bindParam(':issued_by', $auth->userId());
        
        $stmt->execute();
        $clearanceId = $db->lastInsertId();
        
        // Update student clearance status if this is a general clearance
        if ($data->clearance_type === 'off_campus' && isset($data->status)) {
            updateStudentClearanceStatus($db, $data->student_id, $data->status, $data->expiry_date ?? null);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Clearance created successfully',
            'clearance_id' => $clearanceId
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handleUpdateClearance($db, $auth) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!$data || !$data->clearance_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'clearance_id is required']);
        return;
    }
    
    try {
        $query = "UPDATE medical_clearances SET 
                    status = :status,
                    required_for = :required_for,
                    issued_date = :issued_date,
                    expiry_date = :expiry_date,
                    parent_consent = :parent_consent,
                    doctor_approval = :doctor_approval,
                    doctor_name = :doctor_name,
                    medical_notes = :medical_notes,
                    issued_by = :issued_by,
                    updated_at = NOW()
                  WHERE clearance_id = :clearance_id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':clearance_id', $data->clearance_id);
        $stmt->bindParam(':status', $data->status);
        $stmt->bindParam(':required_for', $data->required_for);
        $stmt->bindParam(':issued_date', $data->issued_date);
        $stmt->bindParam(':expiry_date', $data->expiry_date);
        $stmt->bindParam(':parent_consent', $data->parent_consent, PDO::PARAM_BOOL);
        $stmt->bindParam(':doctor_approval', $data->doctor_approval, PDO::PARAM_BOOL);
        $stmt->bindParam(':doctor_name', $data->doctor_name);
        $stmt->bindParam(':medical_notes', $data->medical_notes);
        $stmt->bindParam(':issued_by', $auth->userId());
        
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            // Get student_id and clearance_type for status update
            $getQuery = "SELECT student_id, clearance_type FROM medical_clearances WHERE clearance_id = :clearance_id";
            $getStmt = $db->prepare($getQuery);
            $getStmt->bindParam(':clearance_id', $data->clearance_id);
            $getStmt->execute();
            $clearance = $getStmt->fetch(PDO::FETCH_ASSOC);
            
            // Update student clearance status if this is a general clearance
            if ($clearance && $clearance['clearance_type'] === 'off_campus') {
                updateStudentClearanceStatus($db, $clearance['student_id'], $data->status, $data->expiry_date);
            }
            
            echo json_encode(['success' => true, 'message' => 'Clearance updated successfully']);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Clearance not found']);
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function handleDeleteClearance($db, $auth) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!$data || !$data->clearance_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'clearance_id is required']);
        return;
    }
    
    try {
        $query = "DELETE FROM medical_clearances WHERE clearance_id = :clearance_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':clearance_id', $data->clearance_id);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Clearance deleted successfully']);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Clearance not found']);
        }
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
}

function updateStudentClearanceStatus($db, $studentId, $status, $expiryDate) {
    try {
        $updateQuery = "UPDATE students SET 
                          general_clearance_status = :status,
                          clearance_expiry_date = :expiry_date
                        WHERE student_id = :student_id";
        
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->bindParam(':student_id', $studentId);
        $updateStmt->bindParam(':status', $status);
        $updateStmt->bindParam(':expiry_date', $expiryDate);
        $updateStmt->execute();
        
    } catch (PDOException $e) {
        error_log("Failed to update student clearance status: " . $e->getMessage());
    }
}
?>