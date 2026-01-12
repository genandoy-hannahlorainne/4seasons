<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    $role = isset($_GET['role']) ? strtolower($_GET['role']) : null;
    
    if ($role === 'student') {
        // Fetch all REAL students (must have student_id and student_number)
        $query = "SELECT u.user_id, u.username, u.email, u.full_name, u.is_active, u.created_at,
                         s.student_id, s.student_number, s.grade_level, s.section, s.gender, s.birth_date
                  FROM users u
                  INNER JOIN students s ON u.user_id = s.user_id
                  WHERE u.role_id = (SELECT role_id FROM roles WHERE LOWER(role_name) = 'student')
                  AND s.student_id IS NOT NULL
                  AND s.student_number IS NOT NULL
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
                'student_number' => $row['student_number'],
                'grade_level' => $row['grade_level'],
                'section' => $row['section'],
                'gender' => $row['gender'],
                'birth_date' => $row['birth_date'],
                'is_active' => intval($row['is_active']),
                'created_at' => $row['created_at'],
                'role' => 'student'
            ];
        }
        
        echo json_encode([
            'success' => true,
            'role' => 'student',
            'users' => $users,
            'total' => count($users)
        ]);
        
    } elseif ($role === 'adviser' || $role === 'faculty') {
        // Fetch all REAL advisers (must have adviser_id)
        $query = "SELECT u.user_id, u.username, u.email, u.full_name, u.is_active, u.created_at,
                         a.adviser_id, a.first_name, a.last_name, a.employee_number, a.contact_phone
                  FROM users u
                  INNER JOIN advisers a ON u.user_id = a.user_id
                  WHERE u.role_id = (SELECT role_id FROM roles WHERE LOWER(role_name) = 'adviser')
                  AND a.adviser_id IS NOT NULL
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
                'adviser_id' => intval($row['adviser_id']),
                'first_name' => $row['first_name'],
                'last_name' => $row['last_name'],
                'employee_number' => $row['employee_number'],
                'contact_phone' => $row['contact_phone'],
                'is_active' => intval($row['is_active']),
                'created_at' => $row['created_at'],
                'role' => 'adviser'
            ];
        }
        
        echo json_encode([
            'success' => true,
            'role' => 'adviser',
            'users' => $users,
            'total' => count($users)
        ]);
        
    } elseif ($role === 'clinic_staff' || $role === 'staff') {
        // Fetch all REAL clinic staff (must have clinic_staff_id)
        $query = "SELECT u.user_id, u.username, u.email, u.full_name, u.is_active, u.created_at,
                         cs.clinic_staff_id, cs.staff_code, cs.position
                  FROM users u
                  INNER JOIN clinic_staff cs ON u.user_id = cs.user_id
                  WHERE cs.clinic_staff_id IS NOT NULL
                  AND cs.is_active = 1
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
                'clinic_staff_id' => intval($row['clinic_staff_id']),
                'staff_code' => $row['staff_code'],
                'position' => $row['position'],
                'is_active' => intval($row['is_active']),
                'created_at' => $row['created_at'],
                'role' => 'clinic_staff'
            ];
        }
        
        echo json_encode([
            'success' => true,
            'role' => 'clinic_staff',
            'users' => $users,
            'total' => count($users)
        ]);
        
    } else {
        // Fetch all REAL users grouped by role (only those with complete profiles)
        $students = [];
        $advisers = [];
        $clinic_staff = [];
        
        // Get real students
        $query = "SELECT u.user_id, u.username, u.email, u.full_name, u.is_active, u.created_at,
                         s.student_id, s.student_number
                  FROM users u
                  INNER JOIN students s ON u.user_id = s.user_id
                  WHERE u.role_id = (SELECT role_id FROM roles WHERE LOWER(role_name) = 'student')
                  AND s.student_id IS NOT NULL
                  AND s.student_number IS NOT NULL
                  ORDER BY u.full_name ASC";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $students[] = [
                'user_id' => intval($row['user_id']),
                'username' => $row['username'],
                'email' => $row['email'],
                'full_name' => $row['full_name'],
                'student_number' => $row['student_number'],
                'is_active' => intval($row['is_active']),
                'created_at' => $row['created_at'],
                'role' => 'student'
            ];
        }
        
        // Get real advisers
        $query = "SELECT u.user_id, u.username, u.email, u.full_name, u.is_active, u.created_at,
                         a.adviser_id
                  FROM users u
                  INNER JOIN advisers a ON u.user_id = a.user_id
                  WHERE u.role_id = (SELECT role_id FROM roles WHERE LOWER(role_name) = 'adviser')
                  AND a.adviser_id IS NOT NULL
                  ORDER BY u.full_name ASC";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $advisers[] = [
                'user_id' => intval($row['user_id']),
                'username' => $row['username'],
                'email' => $row['email'],
                'full_name' => $row['full_name'],
                'is_active' => intval($row['is_active']),
                'created_at' => $row['created_at'],
                'role' => 'adviser'
            ];
        }
        
        // Get real clinic staff
        $query = "SELECT u.user_id, u.username, u.email, u.full_name, u.is_active, u.created_at,
                         cs.clinic_staff_id
                  FROM users u
                  INNER JOIN clinic_staff cs ON u.user_id = cs.user_id
                  WHERE cs.clinic_staff_id IS NOT NULL
                  AND cs.is_active = 1
                  ORDER BY u.full_name ASC";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $clinic_staff[] = [
                'user_id' => intval($row['user_id']),
                'username' => $row['username'],
                'email' => $row['email'],
                'full_name' => $row['full_name'],
                'is_active' => intval($row['is_active']),
                'created_at' => $row['created_at'],
                'role' => 'clinic_staff'
            ];
        }
        
        echo json_encode([
            'success' => true,
            'users' => [
                'student' => $students,
                'adviser' => $advisers,
                'clinic_staff' => $clinic_staff
            ],
            'totals' => [
                'students' => count($students),
                'advisers' => count($advisers),
                'clinic_staff' => count($clinic_staff),
                'total' => count($students) + count($advisers) + count($clinic_staff)
            ]
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
