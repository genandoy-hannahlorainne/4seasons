<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, User-Id, X-Requested-With, X-User-Id");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

// Authenticate user
$auth = new Auth($database);

// Only Admin can view all users
$auth->requireRole('Admin');

try {
    error_log("=== GET ALL USERS API ===");
    error_log("Request method: " . $_SERVER['REQUEST_METHOD']);
    error_log("Request headers: " . json_encode(getallheaders()));
    
    $role = isset($_GET['role']) ? strtolower($_GET['role']) : null;
    
    // If specific role requested
    if ($role === 'student') {
        error_log("Fetching students...");
        
        $query = "SELECT u.user_id, u.username, u.email, u.full_name, u.phone, u.is_active, u.created_at,
                         r.role_name,
                         s.student_id, s.student_number, s.grade_level, s.section, s.gender, s.birth_date
                  FROM users u
                  INNER JOIN roles r ON u.role_id = r.role_id
                  LEFT JOIN students s ON u.user_id = s.user_id
                  WHERE r.role_id = 2
                  AND u.deleted_at IS NULL
                  ORDER BY u.full_name ASC";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $users = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $users[] = [
                'user_id' => intval($row['user_id']),
                'username' => $row['username'],
                'email' => $row['email'],
                'full_name' => $row['full_name'],
                'phone' => $row['phone'],
                'student_id' => $row['student_id'] ? intval($row['student_id']) : null,
                'student_number' => $row['student_number'],
                'grade_level' => $row['grade_level'],
                'section' => $row['section'],
                'gender' => $row['gender'],
                'birth_date' => $row['birth_date'],
                'is_active' => intval($row['is_active']),
                'created_at' => $row['created_at'],
                'role_name' => $row['role_name']
            ];
        }
        
        error_log("Found " . count($users) . " students");
        $auth->logActivity('View Users', 'Viewed student list - ' . count($users) . ' students');
        
        echo json_encode([
            'success' => true,
            'role' => 'student',
            'users' => $users,
            'total' => count($users)
        ]);
        exit();
        
    } elseif ($role === 'adviser' || $role === 'faculty') {
        error_log("Fetching advisers...");
        
        $query = "SELECT u.user_id, u.username, u.email, u.full_name, u.phone, u.is_active, u.created_at,
                         r.role_name,
                         a.adviser_id, a.first_name, a.last_name, a.employee_number, a.contact_phone
                  FROM users u
                  INNER JOIN roles r ON u.role_id = r.role_id
                  LEFT JOIN advisers a ON u.user_id = a.user_id
                  WHERE r.role_id = 3
                  AND u.deleted_at IS NULL
                  ORDER BY u.full_name ASC";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $users = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $users[] = [
                'user_id' => intval($row['user_id']),
                'username' => $row['username'],
                'email' => $row['email'],
                'full_name' => $row['full_name'],
                'phone' => $row['phone'],
                'adviser_id' => $row['adviser_id'] ? intval($row['adviser_id']) : null,
                'first_name' => $row['first_name'],
                'last_name' => $row['last_name'],
                'employee_number' => $row['employee_number'],
                'contact_phone' => $row['contact_phone'],
                'is_active' => intval($row['is_active']),
                'created_at' => $row['created_at'],
                'role_name' => $row['role_name']
            ];
        }
        
        error_log("Found " . count($users) . " advisers");
        $auth->logActivity('View Users', 'Viewed adviser list - ' . count($users) . ' advisers');
        
        echo json_encode([
            'success' => true,
            'role' => 'adviser',
            'users' => $users,
            'total' => count($users)
        ]);
        exit();
        
    } elseif ($role === 'clinic_staff' || $role === 'staff') {
        error_log("Fetching clinic staff...");
        
        $query = "SELECT u.user_id, u.username, u.email, u.full_name, u.phone, u.is_active, u.created_at,
                         r.role_name,
                         cs.clinic_staff_id, cs.staff_code, cs.position
                  FROM users u
                  INNER JOIN roles r ON u.role_id = r.role_id
                  LEFT JOIN clinic_staff cs ON u.user_id = cs.user_id
                  WHERE r.role_id = 4
                  AND u.deleted_at IS NULL
                  ORDER BY u.full_name ASC";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $users = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $users[] = [
                'user_id' => intval($row['user_id']),
                'username' => $row['username'],
                'email' => $row['email'],
                'full_name' => $row['full_name'],
                'phone' => $row['phone'],
                'clinic_staff_id' => $row['clinic_staff_id'] ? intval($row['clinic_staff_id']) : null,
                'staff_code' => $row['staff_code'],
                'position' => $row['position'],
                'is_active' => intval($row['is_active']),
                'created_at' => $row['created_at'],
                'role_name' => $row['role_name']
            ];
        }
        
        error_log("Found " . count($users) . " clinic staff");
        $auth->logActivity('View Users', 'Viewed clinic staff list - ' . count($users) . ' staff');
        
        echo json_encode([
            'success' => true,
            'role' => 'clinic_staff',
            'users' => $users,
            'total' => count($users)
        ]);
        exit();
    }
    
    // If no role specified, fetch ALL users grouped by role
    error_log("Fetching all users (no role filter)...");
    
    $students = [];
    $advisers = [];
    $clinic_staff = [];
    $admins = [];
    
    // Get ALL students (role_id = 2)
    $query = "SELECT u.user_id, u.username, u.email, u.full_name, u.phone, u.is_active, u.created_at,
                     r.role_name,
                     s.student_id, s.student_number, s.grade_level, s.section, s.gender, s.birth_date
              FROM users u
              INNER JOIN roles r ON u.role_id = r.role_id
              LEFT JOIN students s ON u.user_id = s.user_id
              WHERE r.role_id = 2
              AND u.deleted_at IS NULL
              ORDER BY u.full_name ASC";
    
    error_log("Executing student query: " . $query);
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $students[] = [
            'user_id' => intval($row['user_id']),
            'username' => $row['username'],
            'email' => $row['email'],
            'full_name' => $row['full_name'],
            'phone' => $row['phone'],
            'student_id' => $row['student_id'] ? intval($row['student_id']) : null,
            'student_number' => $row['student_number'],
            'grade_level' => $row['grade_level'],
            'section' => $row['section'],
            'gender' => $row['gender'],
            'birth_date' => $row['birth_date'],
            'is_active' => intval($row['is_active']),
            'created_at' => $row['created_at'],
            'role_name' => $row['role_name']
        ];
    }
    error_log("Found " . count($students) . " students");
    
    // Get ALL advisers (role_id = 3)
    $query = "SELECT u.user_id, u.username, u.email, u.full_name, u.phone, u.is_active, u.created_at,
                     r.role_name,
                     a.adviser_id, a.first_name, a.last_name, a.employee_number, a.contact_phone
              FROM users u
              INNER JOIN roles r ON u.role_id = r.role_id
              LEFT JOIN advisers a ON u.user_id = a.user_id
              WHERE r.role_id = 3
              AND u.deleted_at IS NULL
              ORDER BY u.full_name ASC";
    
    error_log("Executing adviser query: " . $query);
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $advisers[] = [
            'user_id' => intval($row['user_id']),
            'username' => $row['username'],
            'email' => $row['email'],
            'full_name' => $row['full_name'],
            'phone' => $row['phone'],
            'adviser_id' => $row['adviser_id'] ? intval($row['adviser_id']) : null,
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'employee_number' => $row['employee_number'],
            'contact_phone' => $row['contact_phone'],
            'is_active' => intval($row['is_active']),
            'created_at' => $row['created_at'],
            'role_name' => $row['role_name']
        ];
    }
    error_log("Found " . count($advisers) . " advisers");
    
    // Get ALL clinic staff (role_id = 4)
    $query = "SELECT u.user_id, u.username, u.email, u.full_name, u.phone, u.is_active, u.created_at,
                     r.role_name,
                     cs.clinic_staff_id, cs.staff_code, cs.position
              FROM users u
              INNER JOIN roles r ON u.role_id = r.role_id
              LEFT JOIN clinic_staff cs ON u.user_id = cs.user_id
              WHERE r.role_id = 4
              AND u.deleted_at IS NULL
              ORDER BY u.full_name ASC";
    
    error_log("Executing clinic_staff query: " . $query);
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $clinic_staff[] = [
            'user_id' => intval($row['user_id']),
            'username' => $row['username'],
            'email' => $row['email'],
            'full_name' => $row['full_name'],
            'phone' => $row['phone'],
            'clinic_staff_id' => $row['clinic_staff_id'] ? intval($row['clinic_staff_id']) : null,
            'staff_code' => $row['staff_code'],
            'position' => $row['position'],
            'is_active' => intval($row['is_active']),
            'created_at' => $row['created_at'],
            'role_name' => $row['role_name']
        ];
    }
    error_log("Found " . count($clinic_staff) . " clinic staff");
    
    // Get ALL admins (role_id = 1)
    $query = "SELECT u.user_id, u.username, u.email, u.full_name, u.phone, u.is_active, u.created_at,
                     r.role_name
              FROM users u
              INNER JOIN roles r ON u.role_id = r.role_id
              WHERE r.role_id = 1
              AND u.deleted_at IS NULL
              ORDER BY u.full_name ASC";
    
    error_log("Executing admin query: " . $query);
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
    error_log("Found " . count($admins) . " admins");
    
    $total = count($students) + count($advisers) + count($clinic_staff) + count($admins);
    error_log("Total users: $total (Students: " . count($students) . ", Advisers: " . count($advisers) . ", Staff: " . count($clinic_staff) . ", Admins: " . count($admins) . ")");
    
    $auth->logActivity('View Users', 'Viewed all users - ' . $total . ' total');
    
    echo json_encode([
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
            'total' => $total
        ]
    ]);

} catch (PDOException $e) {
    error_log("❌ PDOException: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("❌ Exception: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
