<?php
require_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== USER COUNT DEBUG ===\n\n";

// Total users
$query = "SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL";
$stmt = $db->prepare($query);
$stmt->execute();
$total = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
echo "Total users (not deleted): $total\n\n";

// Users by role
$query = "SELECT r.role_name, COUNT(*) as count 
          FROM users u
          INNER JOIN roles r ON u.role_id = r.role_id
          WHERE u.deleted_at IS NULL
          GROUP BY r.role_name
          ORDER BY count DESC";
$stmt = $db->prepare($query);
$stmt->execute();
echo "Users by role:\n";
$roleTotal = 0;
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  {$row['role_name']}: {$row['count']}\n";
    $roleTotal += $row['count'];
}
echo "  Total by role: $roleTotal\n\n";

// Students with complete profile
$query = "SELECT COUNT(*) as count 
          FROM users u
          INNER JOIN roles r ON u.role_id = r.role_id
          INNER JOIN students s ON u.user_id = s.user_id
          WHERE u.role_id = (SELECT role_id FROM roles WHERE LOWER(role_name) = 'student')
          AND s.student_id IS NOT NULL
          AND s.student_number IS NOT NULL
          AND u.deleted_at IS NULL";
$stmt = $db->prepare($query);
$stmt->execute();
$students = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
echo "Students with complete profile: $students\n";

// Advisers with complete profile
$query = "SELECT COUNT(*) as count 
          FROM users u
          INNER JOIN roles r ON u.role_id = r.role_id
          INNER JOIN advisers a ON u.user_id = a.user_id
          WHERE u.role_id = (SELECT role_id FROM roles WHERE LOWER(role_name) = 'adviser')
          AND a.adviser_id IS NOT NULL
          AND u.deleted_at IS NULL";
$stmt = $db->prepare($query);
$stmt->execute();
$advisers = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
echo "Advisers with complete profile: $advisers\n";

// Clinic staff with complete profile
$query = "SELECT COUNT(*) as count 
          FROM users u
          INNER JOIN roles r ON u.role_id = r.role_id
          INNER JOIN clinic_staff cs ON u.user_id = cs.user_id
          WHERE cs.clinic_staff_id IS NOT NULL
          AND cs.is_active = 1
          AND u.deleted_at IS NULL";
$stmt = $db->prepare($query);
$stmt->execute();
$clinic_staff = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
echo "Clinic staff with complete profile: $clinic_staff\n";

// Admins
$query = "SELECT COUNT(*) as count 
          FROM users u
          INNER JOIN roles r ON u.role_id = r.role_id
          WHERE u.role_id = (SELECT role_id FROM roles WHERE LOWER(role_name) = 'admin')
          AND u.deleted_at IS NULL";
$stmt = $db->prepare($query);
$stmt->execute();
$admins = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
echo "Admins: $admins\n\n";

$complete_total = $students + $advisers + $clinic_staff + $admins;
echo "Total with complete profile: $complete_total\n";
echo "Difference: " . ($total - $complete_total) . " (users without complete profile)\n\n";

// Users without complete profile
$query = "SELECT u.user_id, u.username, u.full_name, r.role_name,
                 (SELECT COUNT(*) FROM students WHERE user_id = u.user_id) as has_student,
                 (SELECT COUNT(*) FROM advisers WHERE user_id = u.user_id) as has_adviser,
                 (SELECT COUNT(*) FROM clinic_staff WHERE user_id = u.user_id) as has_clinic_staff
          FROM users u
          INNER JOIN roles r ON u.role_id = r.role_id
          WHERE u.deleted_at IS NULL
          AND (
            (r.role_name = 'Student' AND (SELECT COUNT(*) FROM students WHERE user_id = u.user_id AND student_id IS NOT NULL AND student_number IS NOT NULL) = 0)
            OR (r.role_name = 'Adviser' AND (SELECT COUNT(*) FROM advisers WHERE user_id = u.user_id AND adviser_id IS NOT NULL) = 0)
            OR (r.role_name = 'Clinic Staff' AND (SELECT COUNT(*) FROM clinic_staff WHERE user_id = u.user_id AND clinic_staff_id IS NOT NULL) = 0)
          )";
$stmt = $db->prepare($query);
$stmt->execute();
echo "Users without complete profile:\n";
$count = 0;
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  ID: {$row['user_id']}, Username: {$row['username']}, Name: {$row['full_name']}, Role: {$row['role_name']}\n";
    $count++;
}
echo "  Total: $count\n";
?>
