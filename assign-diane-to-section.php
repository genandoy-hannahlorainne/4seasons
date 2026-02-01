<?php
require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== Assigning Diane to Grade 8 - Daffodils Section ===\n\n";

// Get Diane's user_id
$query = "SELECT u.user_id, u.full_name, u.email, r.role_name 
          FROM users u
          LEFT JOIN roles r ON u.role_id = r.role_id
          WHERE u.email LIKE '%diane%'";
$stmt = $db->prepare($query);
$stmt->execute();
$diane = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$diane) {
    echo "ERROR: Diane not found!\n";
    exit;
}

echo "Diane's User ID: {$diane['user_id']}\n";
echo "Name: {$diane['full_name']}\n";
echo "Email: {$diane['email']}\n";
echo "Role: {$diane['role_name']}\n\n";

// Get the Grade 8 - Daffodils section for 2025-2026
$query = "SELECT sec.id as section_id, sec.section_name, gl.level_name, sy.year_name
          FROM sections sec
          LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
          LEFT JOIN school_years sy ON sec.school_year_id = sy.id
          WHERE gl.level_number = 8 
          AND sec.section_name = 'Daffodils'
          AND sy.year_name = '2025-2026'";
$stmt = $db->prepare($query);
$stmt->execute();
$section = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$section) {
    echo "ERROR: Section not found!\n";
    exit;
}

echo "Section ID: {$section['section_id']}\n";
echo "Section: {$section['level_name']} - {$section['section_name']}\n";
echo "School Year: {$section['year_name']}\n\n";

// Update section's adviser_id
$updateQuery = "UPDATE sections SET adviser_id = :adviser_id WHERE id = :section_id";
$updateStmt = $db->prepare($updateQuery);
$updateStmt->bindParam(':adviser_id', $diane['user_id']);
$updateStmt->bindParam(':section_id', $section['section_id']);

if ($updateStmt->execute()) {
    echo "✓ Successfully assigned Diane as adviser!\n\n";
    
    // Verify the update
    $verifyQuery = "SELECT sec.id, sec.section_name, sec.adviser_id, gl.level_name, sy.year_name
                    FROM sections sec
                    LEFT JOIN grade_levels gl ON sec.grade_level_id = gl.id
                    LEFT JOIN school_years sy ON sec.school_year_id = sy.id
                    WHERE sec.id = ?";
    
    $verifyStmt = $db->prepare($verifyQuery);
    $verifyStmt->execute([$section['section_id']]);
    $result = $verifyStmt->fetch(PDO::FETCH_ASSOC);
    
    echo "=== Verification ===\n";
    echo "Section: {$result['level_name']} - {$result['section_name']}\n";
    echo "School Year: {$result['year_name']}\n";
    echo "Adviser ID: {$result['adviser_id']}\n";
    
    // Count students in this section
    $countQuery = "SELECT COUNT(*) as count FROM students 
                   WHERE current_section_id = ? AND enrollment_status = 'active'";
    $countStmt = $db->prepare($countQuery);
    $countStmt->execute([$section['section_id']]);
    $count = $countStmt->fetch(PDO::FETCH_ASSOC);
    echo "Students: {$count['count']}\n";
} else {
    echo "ERROR: Failed to assign adviser!\n";
}
?>
