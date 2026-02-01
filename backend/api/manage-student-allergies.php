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
// Allow both Student and Admin roles to manage allergies
if (!$auth->hasRole('Student') && !$auth->hasRole('Admin')) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied. Student or Admin role required.']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"));

error_log("=== MANAGE ALLERGIES API ===");
error_log("Method: " . $method);
error_log("Request data: " . json_encode($data));

try {
    // Get student ID from authenticated user or from request
    $userId = $auth->userId();
    
    // If user_id is provided in request and user is admin, use that instead
    if (isset($data->user_id) && $auth->hasRole('Admin')) {
        $userId = $data->user_id;
        error_log("Admin accessing allergies for user ID: " . $userId);
    } else {
        error_log("Authenticated user ID: " . $userId);
    }
    
    // Get student record
    $studentQuery = "SELECT student_id FROM students WHERE user_id = :user_id AND is_active = 1";
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(':user_id', $userId);
    $studentStmt->execute();
    
    if ($studentStmt->rowCount() === 0) {
        error_log("❌ Student not found for user_id: " . $userId);
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Student record not found']);
        exit();
    }
    
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    $studentId = $student['student_id'];
    error_log("✅ Found student_id: " . $studentId);
    
    switch ($method) {
        case 'POST':
            // Check if this is a bulk update or single allergy add
            if (isset($data->action) && $data->action === 'bulk_update') {
                // Bulk update - replace all allergies for this student
                
                if (!isset($data->allergies) || !is_array($data->allergies)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Allergies array is required for bulk update']);
                    exit();
                }
                
                error_log("=== BULK UPDATE ALLERGIES ===");
                error_log("Student ID: " . $studentId);
                error_log("Allergies count: " . count($data->allergies));
                error_log("Allergies data: " . json_encode($data->allergies));
                
                // Start transaction
                $db->beginTransaction();
                
                try {
                    // Delete all existing allergies for this student
                    $deleteAllQuery = "DELETE FROM allergies WHERE student_id = :student_id";
                    $deleteAllStmt = $db->prepare($deleteAllQuery);
                    $deleteAllStmt->bindParam(':student_id', $studentId);
                    $deleteAllStmt->execute();
                    error_log("Deleted existing allergies");
                    
                    $addedAllergies = [];
                    $recordedAt = date('Y-m-d');
                    
                    // Insert new allergies
                    foreach ($data->allergies as $allergy) {
                        if (!empty($allergy->allergy_text)) {
                            $severity = $allergy->severity ?? 'Moderate';
                            
                            error_log("Inserting allergy: {$allergy->allergy_text} ({$severity})");
                            
                            $insertQuery = "INSERT INTO allergies (student_id, allergy_text, severity, recorded_at) 
                                           VALUES (:student_id, :allergy_text, :severity, :recorded_at)";
                            $insertStmt = $db->prepare($insertQuery);
                            $insertStmt->bindParam(':student_id', $studentId);
                            $insertStmt->bindParam(':allergy_text', $allergy->allergy_text);
                            $insertStmt->bindParam(':severity', $severity);
                            $insertStmt->bindParam(':recorded_at', $recordedAt);
                            $insertStmt->execute();
                            
                            $addedAllergies[] = [
                                'allergy_id' => $db->lastInsertId(),
                                'allergy_text' => $allergy->allergy_text,
                                'severity' => $severity,
                                'recorded_at' => $recordedAt
                            ];
                        }
                    }
                    
                    // Commit transaction
                    $db->commit();
                    error_log("Transaction committed successfully");
                    
                    // Log the activity
                    $allergyCount = count($addedAllergies);
                    $auth->logActivity('Update Allergies', "Updated allergies list - {$allergyCount} allergies saved");
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Allergies updated successfully',
                        'data' => $addedAllergies
                    ]);
                    
                } catch (Exception $e) {
                    // Rollback transaction on error
                    $db->rollback();
                    error_log("Transaction rolled back due to error: " . $e->getMessage());
                    throw $e;
                }
                
            } else {
                // Add single new allergy
                if (empty($data->allergy_text)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Allergy text is required']);
                    exit();
                }
                
                $severity = $data->severity ?? 'Moderate';
                $recordedAt = date('Y-m-d');
                
                // Check if allergy already exists
                $checkQuery = "SELECT allergy_id FROM allergies WHERE student_id = :student_id AND allergy_text = :allergy_text";
                $checkStmt = $db->prepare($checkQuery);
                $checkStmt->bindParam(':student_id', $studentId);
                $checkStmt->bindParam(':allergy_text', $data->allergy_text);
                $checkStmt->execute();
                
                if ($checkStmt->rowCount() > 0) {
                    echo json_encode(['success' => false, 'message' => 'This allergy is already recorded']);
                    exit();
                }
                
                // Insert new allergy
                $insertQuery = "INSERT INTO allergies (student_id, allergy_text, severity, recorded_at) 
                               VALUES (:student_id, :allergy_text, :severity, :recorded_at)";
                $insertStmt = $db->prepare($insertQuery);
                $insertStmt->bindParam(':student_id', $studentId);
                $insertStmt->bindParam(':allergy_text', $data->allergy_text);
                $insertStmt->bindParam(':severity', $severity);
                $insertStmt->bindParam(':recorded_at', $recordedAt);
                $insertStmt->execute();
                
                $allergyId = $db->lastInsertId();
                
                // Log the activity
                $auth->logActivity('Add Allergy', "Added allergy: {$data->allergy_text} (Severity: {$severity})");
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Allergy added successfully',
                    'data' => [
                        'allergy_id' => $allergyId,
                        'allergy_text' => $data->allergy_text,
                        'severity' => $severity,
                        'recorded_at' => $recordedAt
                    ]
                ]);
            }
            break;
            
        case 'DELETE':
            // Remove allergy
            if (empty($data->allergy_id)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Allergy ID is required']);
                exit();
            }
            
            // Verify allergy belongs to this student
            $verifyQuery = "SELECT allergy_text FROM allergies WHERE allergy_id = :allergy_id AND student_id = :student_id";
            $verifyStmt = $db->prepare($verifyQuery);
            $verifyStmt->bindParam(':allergy_id', $data->allergy_id);
            $verifyStmt->bindParam(':student_id', $studentId);
            $verifyStmt->execute();
            
            if ($verifyStmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Allergy not found']);
                exit();
            }
            
            $allergyInfo = $verifyStmt->fetch(PDO::FETCH_ASSOC);
            
            // Delete allergy
            $deleteQuery = "DELETE FROM allergies WHERE allergy_id = :allergy_id AND student_id = :student_id";
            $deleteStmt = $db->prepare($deleteQuery);
            $deleteStmt->bindParam(':allergy_id', $data->allergy_id);
            $deleteStmt->bindParam(':student_id', $studentId);
            $deleteStmt->execute();
            
            // Log the activity
            $auth->logActivity('Remove Allergy', "Removed allergy: {$allergyInfo['allergy_text']}");
            
            echo json_encode([
                'success' => true,
                'message' => 'Allergy removed successfully'
            ]);
            break;
            
        case 'PUT':
            // Check if this is a bulk update (has allergies array) or single allergy update
            if (isset($data->allergies) && is_array($data->allergies)) {
                // Bulk update - replace all allergies for this student
                
                // Start transaction
                $db->beginTransaction();
                
                try {
                    // Delete all existing allergies for this student
                    $deleteAllQuery = "DELETE FROM allergies WHERE student_id = :student_id";
                    $deleteAllStmt = $db->prepare($deleteAllQuery);
                    $deleteAllStmt->bindParam(':student_id', $studentId);
                    $deleteAllStmt->execute();
                    
                    $addedAllergies = [];
                    $recordedAt = date('Y-m-d');
                    
                    // Insert new allergies
                    foreach ($data->allergies as $allergy) {
                        if (!empty($allergy->allergy_text)) {
                            $severity = $allergy->severity ?? 'Moderate';
                            
                            $insertQuery = "INSERT INTO allergies (student_id, allergy_text, severity, recorded_at) 
                                           VALUES (:student_id, :allergy_text, :severity, :recorded_at)";
                            $insertStmt = $db->prepare($insertQuery);
                            $insertStmt->bindParam(':student_id', $studentId);
                            $insertStmt->bindParam(':allergy_text', $allergy->allergy_text);
                            $insertStmt->bindParam(':severity', $severity);
                            $insertStmt->bindParam(':recorded_at', $recordedAt);
                            $insertStmt->execute();
                            
                            $addedAllergies[] = [
                                'allergy_id' => $db->lastInsertId(),
                                'allergy_text' => $allergy->allergy_text,
                                'severity' => $severity,
                                'recorded_at' => $recordedAt
                            ];
                        }
                    }
                    
                    // Commit transaction
                    $db->commit();
                    
                    // Log the activity
                    $allergyCount = count($addedAllergies);
                    $auth->logActivity('Update Allergies', "Updated allergies list - {$allergyCount} allergies saved");
                    
                    echo json_encode([
                        'success' => true,
                        'message' => 'Allergies updated successfully',
                        'data' => $addedAllergies
                    ]);
                    
                } catch (Exception $e) {
                    // Rollback transaction on error
                    $db->rollback();
                    throw $e;
                }
                
            } else {
                // Single allergy update
                if (empty($data->allergy_id) || empty($data->allergy_text)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Allergy ID and text are required']);
                    exit();
                }
                
                $severity = $data->severity ?? 'Moderate';
                
                // Verify allergy belongs to this student
                $verifyQuery = "SELECT allergy_id FROM allergies WHERE allergy_id = :allergy_id AND student_id = :student_id";
                $verifyStmt = $db->prepare($verifyQuery);
                $verifyStmt->bindParam(':allergy_id', $data->allergy_id);
                $verifyStmt->bindParam(':student_id', $studentId);
                $verifyStmt->execute();
                
                if ($verifyStmt->rowCount() === 0) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Allergy not found']);
                    exit();
                }
                
                // Update allergy
                $updateQuery = "UPDATE allergies SET allergy_text = :allergy_text, severity = :severity 
                               WHERE allergy_id = :allergy_id AND student_id = :student_id";
                $updateStmt = $db->prepare($updateQuery);
                $updateStmt->bindParam(':allergy_text', $data->allergy_text);
                $updateStmt->bindParam(':severity', $severity);
                $updateStmt->bindParam(':allergy_id', $data->allergy_id);
                $updateStmt->bindParam(':student_id', $studentId);
                $updateStmt->execute();
                
                // Log the activity
                $auth->logActivity('Update Allergy', "Updated allergy: {$data->allergy_text} (Severity: {$severity})");
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Allergy updated successfully',
                    'data' => [
                        'allergy_id' => $data->allergy_id,
                        'allergy_text' => $data->allergy_text,
                        'severity' => $severity
                    ]
                ]);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>