<?php
/**
 * Manual Adjust Student Promotion
 * POST /api/admin/students/manual-adjust-promotion
 */

header('Content-Type: application/json');
require_once '../../../config/database.php';
require_once '../../../middleware/auth.php';

verifyAdminRole();

try {
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (!isset($data['student_id']) || !isset($data['action'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit;
    }

    $student_id = (int)$data['student_id'];
    $action = $data['action']; // 'repeat_grade', 'transfer', 'dropout', 'promote'
    $new_grade_level_id = $data['new_grade_level_id'] ?? null;
    $new_section_id = $data['new_section_id'] ?? null;
    $notes = $data['notes'] ?? '';
    $current_user_id = $_SESSION['user_id'];

    // Get current student info
    $studentQuery = "SELECT student_id, current_grade_level_id, current_section_id, current_adviser_id, current_school_year_id 
                    FROM students WHERE student_id = ?";
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->execute([$student_id]);
    
    if ($studentStmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Student not found']);
        exit;
    }

    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);

    // Start transaction
    $db->beginTransaction();

    try {
        $old_grade = $student['current_grade_level_id'];
        $old_section = $student['current_section_id'];
        $old_adviser = $student['current_adviser_id'];
        $school_year = $student['current_school_year_id'];

        if ($action === 'repeat_grade') {
            // Student repeats same grade, assign to new section
            if (!$new_section_id) {
                http_response_code(400);
                echo json_encode(['error' => 'new_section_id required for repeat_grade']);
                exit;
            }

            $sectionQuery = "SELECT adviser_id FROM sections WHERE id = ?";
            $sectionStmt = $db->prepare($sectionQuery);
            $sectionStmt->execute([$new_section_id]);
            $section = $sectionStmt->fetch(PDO::FETCH_ASSOC);

            $updateQuery = "UPDATE students SET current_section_id = ?, current_adviser_id = ? WHERE student_id = ?";
            $db->prepare($updateQuery)->execute([$new_section_id, $section['adviser_id'], $student_id]);

            $promotion_type = 'repeat_grade';
            $new_grade = $old_grade;

        } else if ($action === 'transfer') {
            // Student transferred out
            $updateQuery = "UPDATE students SET 
                           enrollment_status = 'transferred',
                           current_grade_level_id = NULL,
                           current_section_id = NULL,
                           current_adviser_id = NULL
                           WHERE student_id = ?";
            $db->prepare($updateQuery)->execute([$student_id]);

            $promotion_type = 'transfer';
            $new_grade = null;
            $new_section_id = null;

        } else if ($action === 'dropout') {
            // Student dropped out
            $updateQuery = "UPDATE students SET 
                           enrollment_status = 'dropped',
                           current_grade_level_id = NULL,
                           current_section_id = NULL,
                           current_adviser_id = NULL
                           WHERE student_id = ?";
            $db->prepare($updateQuery)->execute([$student_id]);

            $promotion_type = 'dropout';
            $new_grade = null;
            $new_section_id = null;

        } else if ($action === 'promote') {
            // Manual promotion to specific grade/section
            if (!$new_grade_level_id || !$new_section_id) {
                http_response_code(400);
                echo json_encode(['error' => 'new_grade_level_id and new_section_id required for promote']);
                exit;
            }

            $sectionQuery = "SELECT adviser_id FROM sections WHERE id = ?";
            $sectionStmt = $db->prepare($sectionQuery);
            $sectionStmt->execute([$new_section_id]);
            $section = $sectionStmt->fetch(PDO::FETCH_ASSOC);

            $updateQuery = "UPDATE students SET 
                           current_grade_level_id = ?,
                           current_section_id = ?,
                           current_adviser_id = ?
                           WHERE student_id = ?";
            $db->prepare($updateQuery)->execute([$new_grade_level_id, $new_section_id, $section['adviser_id'], $student_id]);

            $promotion_type = 'manual_adjustment';
            $new_grade = $new_grade_level_id;

        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            exit;
        }

        // Log promotion
        $logQuery = "INSERT INTO student_promotions (student_id, previous_grade_level_id, previous_section_id, previous_adviser_id, 
                    new_grade_level_id, new_section_id, new_adviser_id, school_year_id, promoted_by_admin_id, promotion_type, notes) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $new_adviser = null;
        if ($new_section_id) {
            $adviserQuery = "SELECT adviser_id FROM sections WHERE id = ?";
            $adviserStmt = $db->prepare($adviserQuery);
            $adviserStmt->execute([$new_section_id]);
            $adviserResult = $adviserStmt->fetch(PDO::FETCH_ASSOC);
            $new_adviser = $adviserResult['adviser_id'] ?? null;
        }

        $db->prepare($logQuery)->execute([
            $student_id,
            $old_grade,
            $old_section,
            $old_adviser,
            $new_grade ?? null,
            $new_section_id,
            $new_adviser,
            $school_year,
            $current_user_id,
            $promotion_type,
            $notes
        ]);

        $db->commit();

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Student adjustment completed',
            'student_id' => $student_id,
            'action' => $action,
            'promotion_type' => $promotion_type
        ]);

    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
