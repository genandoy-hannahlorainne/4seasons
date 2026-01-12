<?php
// Direct test of the get-all-users API
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Simulate admin user request
$_SERVER['HTTP_USER_ID'] = '33';
$_SERVER['REQUEST_METHOD'] = 'GET';

echo "=== TESTING GET-ALL-USERS API ===\n\n";

require_once 'config/database.php';
require_once 'middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

$auth = new Auth($database);

try {
    echo "Step 1: Checking authentication...\n";
    $auth->requireRole('Admin');
    echo "✓ Admin authentication passed\n\n";
    
    echo "Step 2: Fetching students...\n";
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
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "✓ Found " . count($students) . " students\n\n";
    
    echo "Step 3: Fetching advisers...\n";
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
    $advisers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "✓ Found " . count($advisers) . " advisers\n\n";
    
    echo "Step 4: Fetching clinic staff...\n";
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
    $clinic_staff = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "✓ Found " . count($clinic_staff) . " clinic staff\n\n";
    
    echo "Step 5: Fetching admins...\n";
    $query = "SELECT u.user_id, u.username, u.email, u.full_name, u.phone, u.is_active, u.created_at,
                     r.role_name
              FROM users u
              INNER JOIN roles r ON u.role_id = r.role_id
              WHERE u.role_id = (SELECT role_id FROM roles WHERE LOWER(role_name) = 'admin')
              AND u.deleted_at IS NULL
              ORDER BY u.full_name ASC";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "✓ Found " . count($admins) . " admins\n\n";
    
    echo "Step 6: Building response...\n";
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
    
    echo "✓ Response built successfully\n\n";
    echo "=== FINAL RESPONSE ===\n";
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
