<?php
require_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== CURRENT USERS IN DATABASE ===\n\n";

// Get all users with their roles
$query = "SELECT u.user_id, u.username, u.email, u.full_name, u.phone, u.is_active, u.created_at,
                 r.role_name
          FROM users u
          INNER JOIN roles r ON u.role_id = r.role_id
          WHERE u.deleted_at IS NULL
          ORDER BY u.user_id ASC";

$stmt = $db->prepare($query);
$stmt->execute();

echo "All Users:\n";
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "ID: {$row['user_id']}, Username: {$row['username']}, Name: {$row['full_name']}, Role: {$row['role_name']}, Email: {$row['email']}, Phone: {$row['phone']}\n";
}

echo "\n=== STUDENTS WITH COMPLETE PROFILE ===\n";
$query = "SELECT u.user_id, u.username, u.full_name, s.student_id, s.student_number
          FROM users u
          INNER JOIN students s ON u.user_id = s.user_id
          WHERE u.role_id = (SELECT role_id FROM roles WHERE LOWER(role_name) = 'student')
          AND s.student_id IS NOT NULL
          AND s.student_number IS NOT NULL
          AND u.deleted_at IS NULL
          ORDER BY u.user_id ASC";

$stmt = $db->prepare($query);
$stmt->execute();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "ID: {$row['user_id']}, Username: {$row['username']}, Name: {$row['full_name']}, Student#: {$row['student_number']}\n";
}

echo "\n=== ADVISERS WITH COMPLETE PROFILE ===\n";
$query = "SELECT u.user_id, u.username, u.full_name, a.adviser_id
          FROM users u
          INNER JOIN advisers a ON u.user_id = a.user_id
          WHERE u.role_id = (SELECT role_id FROM roles WHERE LOWER(role_name) = 'adviser')
          AND a.adviser_id IS NOT NULL
          AND u.deleted_at IS NULL
          ORDER BY u.user_id ASC";

$stmt = $db->prepare($query);
$stmt->execute();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "ID: {$row['user_id']}, Username: {$row['username']}, Name: {$row['full_name']}, Adviser#: {$row['adviser_id']}\n";
}

echo "\n=== CLINIC STAFF WITH COMPLETE PROFILE ===\n";
$query = "SELECT u.user_id, u.username, u.full_name, cs.clinic_staff_id
          FROM users u
          INNER JOIN clinic_staff cs ON u.user_id = cs.user_id
          WHERE cs.clinic_staff_id IS NOT NULL
          AND cs.is_active = 1
          AND u.deleted_at IS NULL
          ORDER BY u.user_id ASC";

$stmt = $db->prepare($query);
$stmt->execute();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "ID: {$row['user_id']}, Username: {$row['username']}, Name: {$row['full_name']}, Staff#: {$row['clinic_staff_id']}\n";
}

echo "\n=== ADMINS ===\n";
$query = "SELECT u.user_id, u.username, u.full_name
          FROM users u
          INNER JOIN roles r ON u.role_id = r.role_id
          WHERE u.role_id = (SELECT role_id FROM roles WHERE LOWER(role_name) = 'admin')
          AND u.deleted_at IS NULL
          ORDER BY u.user_id ASC";

$stmt = $db->prepare($query);
$stmt->execute();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "ID: {$row['user_id']}, Username: {$row['username']}, Name: {$row['full_name']}\n";
}
?>
