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
        $studentStmt->bindParam(':grade_level', $data->grade_level);
        $studentStmt->bindParam(':section', $data->section);
        $studentStmt->bindParam(':current_school_year_id', $currentSchoolYearId);
        $studentStmt->execute();
        
        $roleSpecificId = $db->lastInsertId();
        
        error_log("✅ Student created with current_school_year_id: " . ($currentSchoolYearId ?? 'NULL'));
        
        // Link student to section if grade_level and section are provided
        if (!empty($data->grade_level) && !empty($data->section) && $currentSchoolYearId) {
            // Find matching section
            $findSectionQuery = "SELECT s.id, s.section_name, gl.level_number 
                                FROM sections s
                                LEFT JOIN grade_levels gl ON s.grade_level_id = gl.id
                                WHERE gl.level_number = :grade_level 
                                AND s.section_name = :section_name
                                AND s.school_year_id = :school_year_id
                                AND s.is_active = 1
                                LIMIT 1";
            $findSectionStmt = $db->prepare($findSectionQuery);
            $findSectionStmt->bindParam(':grade_level', $data->grade_level);
            $findSectionStmt->bindParam(':section_name', $data->section);
            $findSectionStmt->bindParam(':school_year_id', $currentSchoolYearId);
            $findSectionStmt->execute();
            $matchingSection = $findSectionStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($matchingSection) {
                // Update student's current_section_id
                $updateSectionLinkQuery = "UPDATE students SET current_section_id = :section_id WHERE student_id = :student_id";
                $updateSectionLinkStmt = $db->prepare($updateSectionLinkQuery);
                $updateSectionLinkStmt->bindParam(':section_id', $matchingSection['id']);
                $updateSectionLinkStmt->bindParam(':student_id', $roleSpecificId);
                $updateSectionLinkStmt->execute();
                
                // Update section enrollment count
                $updateEnrollmentQuery = "UPDATE sections SET current_enrollment = current_enrollment + 1 WHERE id = :section_id";
                $updateEnrollmentStmt = $db->prepare($updateEnrollmentQuery);
                $updateEnrollmentStmt->bindParam(':section_id', $matchingSection['id']);
                $updateEnrollmentStmt->execute();
                
                error_log("✅ Student linked to section ID: " . $matchingSection['id'] . " (" . $matchingSection['section_name'] . ")");
            } else {
                error_log("⚠️ No matching section found for Grade {$data->grade_level} - {$data->section}");
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
                          user_id, first_name, last_name, employee_number,
                          contact_phone, grade_level, section, is_active
                        ) VALUES (
                          :user_id, :first_name, :last_name, :employee_number,
                          :contact_phone, :grade_level, :section, 1
                        )";
        
        $adviserStmt = $db->prepare($adviserQuery);
        $adviserStmt->bindParam(':user_id', $userId);
        $adviserStmt->bindParam(':first_name', $data->first_name);
        $adviserStmt->bindParam(':last_name', $data->last_name);
        $adviserStmt->bindParam(':employee_number', $data->employee_number);
        $adviserStmt->bindParam(':contact_phone', $data->phone);
        $adviserStmt->bindParam(':grade_level', $data->grade_level);
        $adviserStmt->bindParam(':section', $data->section);
        $adviserStmt->execute();
        
        $roleSpecificId = $db->lastInsertId();
        
        // If grade_level and section are provided, assign adviser to that section
        if (!empty($data->grade_level) && !empty($data->section)) {
            error_log("Assigning adviser to section: Grade {$data->grade_level}, Section {$data->section}");
            
            // Get current school year
            $currentSchoolYearQuery = "SELECT id FROM school_years WHERE is_current = 1 LIMIT 1";
            $currentSchoolYearStmt = $db->query($currentSchoolYearQuery);
            
            if ($currentSchoolYearStmt->rowCount() > 0) {
                $currentSchoolYear = $currentSchoolYearStmt->fetch(PDO::FETCH_ASSOC);
                $schoolYearId = $currentSchoolYear['id'];
                
                error_log("Using current school year ID: $schoolYearId");
                
                // Find the section
                $findSectionQuery = "SELECT sec.id 
                                    FROM sections sec
                                    JOIN grade_levels gl ON sec.grade_level_id = gl.id
                                    WHERE gl.level_number = :grade_level
                                    AND sec.section_name = :section_name
                                    AND sec.school_year_id = :school_year_id
                                    AND sec.is_active = 1
                                    LIMIT 1";
                $findSectionStmt = $db->prepare($findSectionQuery);
                $findSectionStmt->bindParam(':grade_level', $data->grade_level);
                $findSectionStmt->bindParam(':section_name', $data->section);
                $findSectionStmt->bindParam(':school_year_id', $schoolYearId);
                $findSectionStmt->execute();
                
                if ($findSectionStmt->rowCount() > 0) {
                    $section = $findSectionStmt->fetch(PDO::FETCH_ASSOC);
                    $sectionId = $section['id'];
                    
                    // Assign adviser to section (use user_id, not adviser_id)
                    $assignSectionQuery = "UPDATE sections SET adviser_id = :user_id WHERE id = :section_id";
                    $assignSectionStmt = $db->prepare($assignSectionQuery);
                    $assignSectionStmt->bindParam(':user_id', $userId);
                    $assignSectionStmt->bindParam(':section_id', $sectionId);
                    $assignSectionStmt->execute();
                    
                    error_log("✓ Assigned adviser (user_id: $userId) to section (id: $sectionId) for current school year");
                } else {
                    error_log("⚠️ Section not found: Grade {$data->grade_level}, Section {$data->section}, School Year {$schoolYearId}");
                }
            } else {
                error_log("⚠️ No current school year set. Please set a current school year first.");
            }
        } else {
            error_log("⚠️ No active school year found, cannot assign adviser to section");
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
        $base = strtolower($data->first_name[0] . $data->last_name);
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
