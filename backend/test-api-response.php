<?php
// Test the get-all-users API response
require_once 'config/database.php';
require_once 'middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

// Simulate admin user (user_id 33)
$_SERVER['HTTP_USER_ID'] = '33';

// Get all users grouped by role
$students = [];
$advisers = [];
$clinic_staff = [];
$admins = [];

// Get real students
$query = "SELECT u.user_id, u.username, u.email, u.full_name, u.phone, u.is_active, u.created_at,
                 r.role_name,
                 s.student_id, s.student_number
          FROM users u
          INNER JOIN roles r ON u.role_id = r.role_id
          INNER JOIN students s ON u.user_id = s.user_id
          WHERE u.role_id = (SELECT role_id FROM roles WHERE LOWER(role_name) = 'student')
          AND s.student_id IS NOT NULL
          AND s.student_number IS NOT NULL
          AND u.deleted_at IS NULL
          ORDER BY u.full_name ASC";

$stmt = $db->prepare($query);
$stmt->execute();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $students[] = [
        'user_id' => intval($row['user_id']),
        'username' => $row['username'],
        'email' => $row['email'],
        'full_name' => $row['full_name'],
        'phone' => $row['phone'],
        'student_number' => $row['student_number'],
        'is_active' => intval($row['is_active']),
        'created_at' => $row['created_at'],
        'role_name' => $row['role_name']
    ];
}

// Get real advisers
$query = "SELECT u.user_id, u.username, u.email, u.full_name, u.phone, u.is_active, u.created_at,
                 r.role_name,
                 a.adviser_id
          FROM users u
          INNER JOIN roles r ON u.role_id = r.role_id
          INNER JOIN advisers a ON u.user_id = a.user_id
          WHERE u.role_id = (SELECT role_id FROM roles WHERE LOWER(role_name) = 'adviser')
          AND a.adviser_id IS NOT NULL
          AND u.deleted_at IS NULL
          ORDER BY u.full_name ASC";

$stmt = $db->prepare($query);
$stmt->execute();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $advisers[] = [
        'user_id' => intval($row['user_id']),
        'username' => $row['username'],
        'email' => $row['email'],
        'full_name' => $row['full_name'],
        'phone' => $row['phone'],
        'is_active' => intval($row['is_active']),
        'created_at' => $row['created_at'],
        'role_name' => $row['role_name']
    ];
}

// Get real clinic staff
$query = "SELECT u.user_id, u.username, u.email, u.full_name, u.phone, u.is_active, u.created_at,
                 r.role_name,
                 cs.clinic_staff_id
          FROM users u
          INNER JOIN roles r ON u.role_id = r.role_id
          INNER JOIN clinic_staff cs ON u.user_id = cs.user_id
          WHERE cs.clinic_staff_id IS NOT NULL
          AND cs.is_active = 1
          AND u.deleted_at IS NULL
          ORDER BY u.full_name ASC";

$stmt = $db->prepare($query);
$stmt->execute();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $clinic_staff[] = [
        'user_id' => intval($row['user_id']),
        'username' => $row['username'],
        'email' => $row['email'],
        'full_name' => $row['full_name'],
        'phone' => $row['phone'],
        'is_active' => intval($row['is_active']),
        'created_at' => $row['created_at'],
        'role_name' => $row['role_name']
    ];
}

// Get admins
$query = "SELECT u.user_id, u.username, u.email, u.full_name, u.phone, u.is_active, u.created_at,
                 r.role_name
          FROM users u
          INNER JOIN roles r ON u.role_id = r.role_id
          WHERE u.role_id = (SELECT role_id FROM roles WHERE LOWER(role_name) = 'admin')
          AND u.deleted_at IS NULL
          ORDER BY u.full_name ASC";

$stmt = $db->prepare($query);
$stmt->execute();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    $admins[] = [
        'user_id' => intval($row['user_id']),
        'username' => $row['username'],
        'email' => $row['email'],
        'full_name' => $row['full_name'],
        'phone' => $row['phone'],
        'is_active' => intval($row['is_active']),
        'created_at' => $row['created_at'],
        'role_name' => $row['role_name']
    ];
}

$response = [
    'success' => true,
    'users' => [
        'student' => $students,
        'adviser' => $advisers,
        'clinic_staff' => $clinic_staff,
        'admin' => $admins
    ],
    'totals' => [
        'students' => count($students),
        'advisers' => count($advisers),
        'clinic_staff' => count($clinic_staff),
        'admins' => count($admins),
        'total' => count($students) + count($advisers) + count($clinic_staff) + count($admins)
    ]
];

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>
