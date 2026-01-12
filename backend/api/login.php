<?php
// Handle CORS - must be first thing before any output
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->username) && !empty($data->password)) {
    
    $query = "SELECT u.user_id, u.username, u.password_hash, u.email, u.full_name, u.role_id, r.role_name, u.is_active
              FROM users u
              INNER JOIN roles r ON u.role_id = r.role_id
              WHERE u.username = :username AND u.is_active = 1 AND u.deleted_at IS NULL";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":username", $data->username);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Verify password
        if (password_verify($data->password, $row['password_hash'])) {
            
            // Get additional info based on role (don't include password_hash in response)
            $userInfo = [
                'user_id' => $row['user_id'],
                'username' => $row['username'],
                'email' => $row['email'],
                'full_name' => $row['full_name'],
                'role_id' => $row['role_id'],
                'role_name' => $row['role_name']
            ];
            
            // Fetch role-specific data
            if ($row['role_name'] === 'Student') {
                $studentQuery = "SELECT student_id, student_number, first_name, last_name 
                                FROM students WHERE user_id = :user_id AND is_active = 1";
                $studentStmt = $db->prepare($studentQuery);
                $studentStmt->bindParam(":user_id", $row['user_id']);
                $studentStmt->execute();
                if ($studentStmt->rowCount() > 0) {
                    $userInfo['student_info'] = $studentStmt->fetch(PDO::FETCH_ASSOC);
                }
            } elseif ($row['role_name'] === 'Adviser') {
                $adviserQuery = "SELECT adviser_id, first_name, last_name, contact_phone 
                                FROM advisers WHERE user_id = :user_id AND is_active = 1";
                $adviserStmt = $db->prepare($adviserQuery);
                $adviserStmt->bindParam(":user_id", $row['user_id']);
                $adviserStmt->execute();
                if ($adviserStmt->rowCount() > 0) {
                    $userInfo['adviser_info'] = $adviserStmt->fetch(PDO::FETCH_ASSOC);
                }
            } elseif ($row['role_name'] === 'Clinic Staff') {
                $staffQuery = "SELECT clinic_staff_id, staff_code, position 
                              FROM clinic_staff WHERE user_id = :user_id AND is_active = 1 AND deleted_at IS NULL";
                $staffStmt = $db->prepare($staffQuery);
                $staffStmt->bindParam(":user_id", $row['user_id']);
                $staffStmt->execute();
                if ($staffStmt->rowCount() > 0) {
                    $userInfo['staff_info'] = $staffStmt->fetch(PDO::FETCH_ASSOC);
                } else {
                    // If clinic_staff record doesn't exist or is inactive, still allow login but without staff_info
                    $userInfo['staff_info'] = ['clinic_staff_id' => null];
                }
            } elseif ($row['role_name'] === 'Admin' || $row['role_name'] === 'admin') {
                // Admin doesn't need additional info
                $userInfo['admin_info'] = [
                    'is_admin' => true
                ];
            }
            
            // Log activity
            $logQuery = "INSERT INTO activity_logs (user_id, action, ip_address) 
                        VALUES (:user_id, 'Login', :ip)";
            $logStmt = $db->prepare($logQuery);
            $logStmt->bindParam(":user_id", $row['user_id']);
            $ip = $_SERVER['REMOTE_ADDR'];
            $logStmt->bindParam(":ip", $ip);
            $logStmt->execute();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                'user' => $userInfo
            ]);
        } else {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid username or password'
            ]);
        }
    } else {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid username or password'
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Username and password are required'
    ]);
}
?>
