<?php
/**
 * Bulk Promote Students
 * POST /api/admin/students/bulk-promote
 */

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, X-Requested-With");
header("Access-Control-Max-Age: 3600");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../../config/database.php';
require_once '../../../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

// Authenticate user
$auth = new Auth($database);

// Require Admin role
if (!$auth->hasRole('Admin')) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Access denied. Admin role required.'
    ]);
    exit();
}

try {
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($data['current_school_year_id']) || !isset($data['target_school_year_id']) || !isset($data['promotion_rules'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Missing required fields'
        ]);
        exit;
    }

    $current_school_year_id = (int)$data['current_school_year_id'];
    $target_school_year_id = (int)$data['target_school_year_id'];
    $promotion_rules = $data['promotion_rules']; // Array: grade_id => new_grade_id or 'graduated'
    $exclude_student_ids = $data['exclude_student_ids'] ?? [];
    $current_user_id = $auth->userId();

    // Validate school years exist
    $yearQuery = "SELECT id FROM school_years WHERE id IN (?, ?)";
    $yearStmt = $db->prepare($yearQuery);
    $yearStmt->execute([$current_school_year_id, $target_school_year_id]);
    if ($yearStmt->rowCount() !== 2) {
        http_response_code(404);
        echo json_encode(['error' => 'One or both school years not found']);
        exit;
    }

    // Start transaction
    $db->beginTransaction();

    try {
        // Create batch log
        $batchQuery = "INSERT INTO promotion_batch_logs (batch_name, current_school_year_id, target_school_year_id, status, executed_by_admin_id, started_at) 
                      VALUES (?, ?, ?, 'in_progress', ?, NOW())";
        $batchStmt = $db->prepare($batchQuery);
        $batchStmt->execute([
            'Promotion ' . date('Y-m-d H:i:s'),
            $current_school_year_id,
            $target_school_year_id,
            $current_user_id
        ]);
        $batch_id = $db->lastInsertId();

        // Get all active students in current school year
        $studentQuery = "SELECT s.student_id, s.current_grade_level_id, s.current_section_id, s.current_adviser_id
                        FROM students s
                        WHERE s.current_school_year_id = ? 
                        AND s.enrollment_status = 'active'
                        AND s.student_id NOT IN (" . implode(',', array_fill(0, count($exclude_student_ids), '?')) . ")";
        
        $params = [$current_school_year_id];
        $params = array_merge($params, $exclude_student_ids);
        
        $studentStmt = $db->prepare($studentQuery);
        $studentStmt->execute($params);
        $students = $studentStmt->fetchAll(PDO::FETCH_ASSOC);

        $promoted_count = 0;
        $graduated_count = 0;
        $repeated_count = 0;
        $transferred_count = 0;
        $dropped_count = 0;
        $failed_count = 0;

        foreach ($students as $student) {
            $current_grade_id = $student['current_grade_level_id'];
            $new_grade_id = $promotion_rules[$current_grade_id] ?? null;

            if ($new_grade_id === 'graduated') {
                // Mark as graduated
                $updateQuery = "UPDATE students SET 
                               enrollment_status = 'graduated',
                               current_grade_level_id = NULL,
                               current_section_id = NULL,
                               current_adviser_id = NULL,
                               promotion_date = NOW()
                               WHERE student_id = ?";
                $db->prepare($updateQuery)->execute([$student['student_id']]);

                // Log promotion
                $logQuery = "INSERT INTO student_promotions (student_id, previous_grade_level_id, previous_section_id, previous_adviser_id, 
                            school_year_id, promoted_by_admin_id, promotion_type) 
                            VALUES (?, ?, ?, ?, ?, ?, 'graduation')";
                $db->prepare($logQuery)->execute([
                    $student['student_id'],
                    $current_grade_id,
                    $student['current_section_id'],
                    $student['current_adviser_id'],
                    $current_school_year_id,
                    $current_user_id
                ]);

                $graduated_count++;

            } else if ($new_grade_id) {
                // Get new section for this grade
                $sectionQuery = "SELECT id, adviser_id FROM sections 
                                WHERE grade_level_id = ? AND school_year_id = ? 
                                ORDER BY current_enrollment ASC LIMIT 1";
                $sectionStmt = $db->prepare($sectionQuery);
                $sectionStmt->execute([$new_grade_id, $target_school_year_id]);
                
                if ($sectionStmt->rowCount() > 0) {
                    $section = $sectionStmt->fetch(PDO::FETCH_ASSOC);
                    $new_section_id = $section['id'];
                    $new_adviser_id = $section['adviser_id'];

                    // Update student
                    $updateQuery = "UPDATE students SET 
                                   current_grade_level_id = ?,
                                   current_section_id = ?,
                                   current_adviser_id = ?,
                                   current_school_year_id = ?,
                                   promotion_date = NOW()
                                   WHERE student_id = ?";
                    $db->prepare($updateQuery)->execute([
                        $new_grade_id,
                        $new_section_id,
                        $new_adviser_id,
                        $target_school_year_id,
                        $student['student_id']
                    ]);

                    // Update section enrollment
                    $enrollQuery = "UPDATE sections SET current_enrollment = current_enrollment + 1 WHERE id = ?";
                    $db->prepare($enrollQuery)->execute([$new_section_id]);

                    // Log promotion
                    $logQuery = "INSERT INTO student_promotions (student_id, previous_grade_level_id, previous_section_id, previous_adviser_id, 
                                new_grade_level_id, new_section_id, new_adviser_id, school_year_id, promoted_by_admin_id, promotion_type) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'promotion')";
                    $db->prepare($logQuery)->execute([
                        $student['student_id'],
                        $current_grade_id,
                        $student['current_section_id'],
                        $student['current_adviser_id'],
                        $new_grade_id,
                        $new_section_id,
                        $new_adviser_id,
                        $target_school_year_id,
                        $current_user_id
                    ]);

                    $promoted_count++;
                } else {
                    $failed_count++;
                }
            }
        }

        // Update batch log
        $updateBatchQuery = "UPDATE promotion_batch_logs SET 
                            total_students = ?,
                            promoted_count = ?,
                            graduated_count = ?,
                            status = 'completed',
                            completed_at = NOW()
                            WHERE id = ?";
        $db->prepare($updateBatchQuery)->execute([
            count($students),
            $promoted_count,
            $graduated_count,
            $batch_id
        ]);

        $db->commit();

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Bulk promotion completed',
            'batch_id' => $batch_id,
            'total_students' => count($students),
            'promoted_count' => $promoted_count,
            'graduated_count' => $graduated_count,
            'failed_count' => $failed_count
        ]);

    } catch (Exception $e) {
        $db->rollBack();
        
        // Update batch log with error
        $errorQuery = "UPDATE promotion_batch_logs SET status = 'failed', error_message = ?, completed_at = NOW() WHERE id = ?";
        $db->prepare($errorQuery)->execute([$e->getMessage(), $batch_id]);
        
        throw $e;
    }

} catch (Exception $e) {
    error_log("Error in bulk-promote.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
