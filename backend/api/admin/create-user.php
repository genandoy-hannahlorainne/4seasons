<?php
// Suppress all output except JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Handle CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Start output buffering to catch any stray output
ob_start();

require_once '../../config/database.php';
require_once '../../middleware/auth.php';
require_once '../../services/EmailService.php';
require_once '../../services/StudentAssignmentService.php';

error_log("=== CREATE USER API CALLED ===");

$database = new Database();
$db = $database->getConnection();

// Authenticate admin
$auth = new Auth($database);
$auth->requireRole('Admin');

error_log("Admin authenticated, processing request...");

$data = json_decode(file_get_contents("php://input"));

// Validate required fields
if (empty($data->role) || empty($data->full_name) || empty($data->email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Role, full name, and email are required']);
    exit();
}

try {
    $db->beginTransaction();
    
    // Generate temporary password
    $tempPassword = generateTempPassword();
    $passwordHash = password_hash($tempPassword, PASSWORD_BCRYPT);
    
    // Generate username based on role
    $username = generateUsername($data->role, $data, $db);
    
    // Check if username or email already exists
    $checkQuery = "SELECT user_id FROM users WHERE username = :username OR email = :email";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':username', $username);
    $checkStmt->bindParam(':email', $data->email);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Username or email already exists']);
        exit();
    }
    
    // Get role_id
    $roleMap = [
        'student' => 2,
        'adviser' => 3,
        'clinic_staff' => 4
    ];
    $roleId = $roleMap[strtolower($data->role)] ?? 2;
    
    // Insert into users table
    $userQuery = "INSERT INTO users (
                    role_id, username, password_hash, email, phone, full_name, 
                    password_must_change, created_by_admin_id, temp_password, is_active
                  ) VALUES (
                    :role_id, :username, :password_hash, :email, :phone, :full_name,
                    1, :admin_id, :temp_password, 1
                  )";
    
    $userStmt = $db->prepare($userQuery);
    $adminId = $auth->userId();
    
    $userStmt->bindParam(':role_id', $roleId);
    $userStmt->bindParam(':username', $username);
    $userStmt->bindParam(':password_hash', $passwordHash);
    $userStmt->bindParam(':email', $data->email);
    $userStmt->bindParam(':phone', $data->phone);
    $userStmt->bindParam(':full_name', $data->full_name);
    $userStmt->bindParam(':admin_id', $adminId);
    $userStmt->bindParam(':temp_password', $tempPassword);
    
    $userStmt->execute();
    $userId = $db->lastInsertId();
    
    // Insert role-specific data
    $roleSpecificId = null;
    
    if (strtolower($data->role) === 'student') {
        // Get current school year
        $currentSchoolYearQuery = "SELECT id FROM school_years WHERE is_current = 1 LIMIT 1";
        $currentSchoolYearStmt = $db->query($currentSchoolYearQuery);
        $currentSchoolYear = $currentSchoolYearStmt->fetch(PDO::FETCH_ASSOC);
        $currentSchoolYearId = $currentSchoolYear ? $currentSchoolYear['id'] : null;
        
        // If no current school year is set, use the most recent active school year
        if (!$currentSchoolYearId) {
            $fallbackQuery = "SELECT id FROM school_years WHERE is_active = 1 ORDER BY id DESC LIMIT 1";
            $fallbackStmt = $db->query($fallbackQuery);
            $fallbackYear = $fallbackStmt->fetch(PDO::FETCH_ASSOC);
            $currentSchoolYearId = $fallbackYear ? $fallbackYear['id'] : null;
            error_log("⚠️ No current school year set, using fallback: " . ($currentSchoolYearId ?? 'NONE'));
        }
        
        $studentQuery = "INSERT INTO students (
                          user_id, student_number, first_name, middle_name, last_name,
                          birth_date, gender, grade_level, section, 
                          current_school_year_id, is_active
                        ) VALUES (
                          :user_id, :student_number, :first_name, :middle_name, :last_name,
                          :birth_date, :gender, :grade_level, :section,
                          :current_school_year_id, 1
                        )";
        
        $studentStmt = $db->prepare($studentQuery);
        $studentStmt->bindParam(':user_id', $userId);
        $studentStmt->bindParam(':student_number', $data->student_number);
        $studentStmt->bindParam(':first_name', $data->first_name);
        $studentStmt->bindParam(':middle_name', $data->middle_name);
        $studentStmt->bindParam(':last_name', $data->last_name);
        $studentStmt->bindParam(':birth_date', $data->birth_date);
        $studentStmt->bindParam(':gender', $data->gender);
        
        // For section, we need to get the section name and actual grade level from section_id
        $sectionName = null;
        $actualGradeLevel = null;
        if (!empty($data->section_id)) {
            $getSectionInfoQuery = "SELECT s.section_name, gl.level_number 
                                   FROM sections s 
                                   LEFT JOIN grade_levels gl ON s.grade_level_id = gl.id
                                   WHERE s.id = :section_id";
            $getSectionInfoStmt = $db->prepare($getSectionInfoQuery);
            $getSectionInfoStmt->bindParam(':section_id', $data->section_id);
            $getSectionInfoStmt->execute();
            if ($getSectionInfoStmt->rowCount() > 0) {
                $sectionInfo = $getSectionInfoStmt->fetch(PDO::FETCH_ASSOC);
                $sectionName = $sectionInfo['section_name'];
                $actualGradeLevel = $sectionInfo['level_number']; // This will be 7, 8, 9, etc.
            }
        }
        $studentStmt->bindParam(':section', $sectionName);
        $studentStmt->bindParam(':grade_level', $actualGradeLevel); // Store actual grade level (7-12)
        $studentStmt->bindParam(':current_school_year_id', $currentSchoolYearId);
        $studentStmt->execute();
        
        $roleSpecificId = $db->lastInsertId();
        
        error_log("✅ Student created with current_school_year_id: " . ($currentSchoolYearId ?? 'NULL'));
        
        // Use StudentAssignmentService for robust assignment
        $assignmentService = new StudentAssignmentService($database);
        $assignmentResult = $assignmentService->autoAssignStudent(
            $roleSpecificId, 
            $actualGradeLevel, 
            !empty($data->section_id) ? $data->section_id : null
        );
        
        if ($assignmentResult['success']) {
            error_log("✅ " . $assignmentResult['message']);
        } else {
            error_log("⚠️ Assignment warning: " . $assignmentResult['message']);

            // Fallback assignment when section is provided and already has an adviser
            if (!empty($data->section_id)) {
                $fallbackSectionQuery = "SELECT id, adviser_id, section_name
                                        FROM sections
                                        WHERE id = :section_id
                                        AND is_active = 1
                                        AND adviser_id IS NOT NULL
                                        LIMIT 1";
                $fallbackSectionStmt = $db->prepare($fallbackSectionQuery);
                $fallbackSectionStmt->bindParam(':section_id', $data->section_id);
                $fallbackSectionStmt->execute();
                $fallbackSection = $fallbackSectionStmt->fetch(PDO::FETCH_ASSOC);

                if ($fallbackSection) {
                    $fallbackUpdateStudent = "UPDATE students
                                             SET current_section_id = :section_id,
                                                 current_adviser_id = :adviser_id,
                                                 section = :section_name,
                                                 grade_level = :grade_level
                                             WHERE student_id = :student_id";
                    $fallbackUpdateStmt = $db->prepare($fallbackUpdateStudent);
                    $fallbackUpdateStmt->bindParam(':section_id', $fallbackSection['id']);
                    $fallbackUpdateStmt->bindParam(':adviser_id', $fallbackSection['adviser_id']);
                    $fallbackUpdateStmt->bindParam(':section_name', $fallbackSection['section_name']);
                    $fallbackUpdateStmt->bindParam(':grade_level', $actualGradeLevel);
                    $fallbackUpdateStmt->bindParam(':student_id', $roleSpecificId);
                    $fallbackUpdateStmt->execute();

                    $fallbackEnrollmentQuery = "UPDATE sections SET current_enrollment = current_enrollment + 1 WHERE id = :section_id";
                    $fallbackEnrollmentStmt = $db->prepare($fallbackEnrollmentQuery);
                    $fallbackEnrollmentStmt->bindParam(':section_id', $fallbackSection['id']);
                    $fallbackEnrollmentStmt->execute();

                    error_log("✅ Fallback assignment applied for student_id {$roleSpecificId} to section {$fallbackSection['section_name']} with adviser {$fallbackSection['adviser_id']}");
                }
            }
        }
        
        // Generate QR code for student
        $qrToken = bin2hex(random_bytes(16)); // Generate unique token
        
        $qrCodeQuery = "INSERT INTO qr_codes (student_id, qr_token, qr_generated_at) 
                        VALUES (:student_id, :qr_token, NOW())";
        $qrStmt = $db->prepare($qrCodeQuery);
        $qrStmt->bindParam(':student_id', $roleSpecificId);
        $qrStmt->bindParam(':qr_token', $qrToken);
        $qrStmt->execute();
        
        error_log("✅ QR code generated for student_id: " . $roleSpecificId . " with token: " . $qrToken);
        
        } elseif (strtolower($data->role) === 'adviser') {
                $adviserQuery = "INSERT INTO advisers (
                                                    user_id, employee_id, contact_phone, is_active
                                                ) VALUES (
                                                    :user_id, :employee_id, :contact_phone, 1
                                                )";
        
        $adviserStmt = $db->prepare($adviserQuery);
        $adviserStmt->bindParam(':user_id', $userId);
        $employeeId = !empty($data->employee_number) ? $data->employee_number : ('ADV-' . str_pad((string)$userId, 6, '0', STR_PAD_LEFT));
        $adviserStmt->bindParam(':employee_id', $employeeId);
        $adviserStmt->bindParam(':contact_phone', $data->phone);

        $adviserStmt->execute();
        
        $roleSpecificId = $db->lastInsertId();
        
        // If section_id is provided, assign adviser to that section
        if (!empty($data->section_id)) {
            error_log("Assigning adviser to section ID: {$data->section_id}");
            
            // Assign adviser to section (use user_id, not adviser_id)
            $assignSectionQuery = "UPDATE sections SET adviser_id = :user_id WHERE id = :section_id";
            $assignSectionStmt = $db->prepare($assignSectionQuery);
            $assignSectionStmt->bindParam(':user_id', $userId);
            $assignSectionStmt->bindParam(':section_id', $data->section_id);
            $assignSectionStmt->execute();
            
            error_log("✓ Assigned adviser (user_id: $userId) to section (id: {$data->section_id})");
        } else {
            error_log("⚠️ No section_id provided for adviser");
        }
        
    } elseif (strtolower($data->role) === 'clinic_staff') {
        $staffQuery = "INSERT INTO clinic_staff (
                        user_id, staff_code, position, is_active
                      ) VALUES (
                        :user_id, :staff_code, :position, 1
                      )";
        
        $staffStmt = $db->prepare($staffQuery);
        $staffStmt->bindParam(':user_id', $userId);
        $staffStmt->bindParam(':staff_code', $data->staff_code);
        $staffStmt->bindParam(':position', $data->position);
        $staffStmt->execute();
        
        $roleSpecificId = $db->lastInsertId();
    }
    
    // Log activity
    $logQuery = "INSERT INTO activity_logs (user_id, action, details, ip_address) 
                VALUES (:admin_id, 'Created User Account', :details, :ip)";
    $logStmt = $db->prepare($logQuery);
    $details = "Created {$data->role} account: {$username} ({$data->full_name})";
    $ip = $_SERVER['REMOTE_ADDR'];
    $logStmt->bindParam(':admin_id', $adminId);
    $logStmt->bindParam(':details', $details);
    $logStmt->bindParam(':ip', $ip);
    $logStmt->execute();
    
    // Send email with credentials
    error_log("=== SENDING EMAIL ===");
    error_log("Email: " . $data->email);
    error_log("Username: " . $username);
    error_log("Temp Password: " . $tempPassword);
    
    $emailService = new EmailService($database);
    $emailSent = $emailService->sendAccountCreationEmail(
        $data->email,
        $data->full_name,
        $username,
        $tempPassword,
        $data->role
    );
    
    error_log("Email sent: " . ($emailSent ? 'YES' : 'NO'));
    
    $db->commit();
    
    // Clear any buffered output and send clean JSON
    ob_clean();
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'User account created successfully',
        'data' => [
            'user_id' => $userId,
            'username' => $username,
            'email' => $data->email,
            'role' => $data->role,
            'email_sent' => $emailSent
        ]
    ]);
    
} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log("Error creating user: " . $e->getMessage());
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log("Error creating user: " . $e->getMessage());
    ob_clean();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

// Helper function to generate temporary password
function generateTempPassword() {
    $uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $lowercase = 'abcdefghijklmnopqrstuvwxyz';
    $numbers = '0123456789';
    $special = '@#$%';
    
    $password = '';
    $password .= $uppercase[rand(0, strlen($uppercase) - 1)];
    $password .= $lowercase[rand(0, strlen($lowercase) - 1)];
    $password .= $numbers[rand(0, strlen($numbers) - 1)];
    $password .= $special[rand(0, strlen($special) - 1)];
    
    $allChars = $uppercase . $lowercase . $numbers;
    for ($i = 0; $i < 4; $i++) {
        $password .= $allChars[rand(0, strlen($allChars) - 1)];
    }
    
    return str_shuffle($password);
}

// Helper function to generate username
function generateUsername($role, $data, $db) {
    $role = strtolower($role);
    
    if ($role === 'student') {
        // Use student number as username
        return $data->student_number;
    } elseif ($role === 'adviser') {
        // Use employee number or generate from name
        if (!empty($data->employee_number)) {
            return $data->employee_number;
        }
        $nameParts = preg_split('/\s+/', trim((string)$data->full_name));
        $first = strtolower(substr($nameParts[0] ?? 'adviser', 0, 1));
        $last = strtolower($nameParts[count($nameParts) - 1] ?? 'user');
        $base = $first . $last;
        return generateUniqueUsername($base, $db);
    } elseif ($role === 'clinic_staff') {
        // Use staff code or generate from name
        if (!empty($data->staff_code)) {
            return $data->staff_code;
        }
        $base = strtolower(str_replace(' ', '', $data->full_name));
        return generateUniqueUsername($base, $db);
    }
    
    // Default: generate from full name
    $base = strtolower(str_replace(' ', '', $data->full_name));
    return generateUniqueUsername($base, $db);
}

// Helper function to ensure unique username
function generateUniqueUsername($base, $db) {
    $username = $base;
    $counter = 1;
    
    while (true) {
        $checkQuery = "SELECT user_id FROM users WHERE username = :username";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':username', $username);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() === 0) {
            return $username;
        }
        
        $username = $base . $counter;
        $counter++;
    }
}
?>
