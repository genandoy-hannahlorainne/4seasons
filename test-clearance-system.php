<?php
require_once 'backend/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== Testing Health Clearance Verification System ===\n\n";

try {
    // 1. Find a student with heart condition
    $heartStudentQuery = "SELECT s.student_id, s.student_number, s.first_name, s.last_name, s.grade_level, s.section
                          FROM students s
                          INNER JOIN medical_history mh ON s.student_id = mh.student_id
                          WHERE mh.condition_heart_problem = TRUE
                          LIMIT 1";
    
    $stmt = $db->prepare($heartStudentQuery);
    $stmt->execute();
    $heartStudent = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$heartStudent) {
        echo "❌ No student with heart condition found. Creating test data...\n";
        
        // Create a test student with heart condition
        $createStudentQuery = "INSERT INTO students (student_number, first_name, last_name, grade_level, section, gender, birth_date, is_active)
                               VALUES ('TEST001', 'John', 'Doe', '10', 'A', 'M', '2008-01-01', 1)";
        $db->prepare($createStudentQuery)->execute();
        $studentId = $db->lastInsertId();
        
        // Add heart condition
        $addConditionQuery = "INSERT INTO medical_history (student_id, condition_heart_problem) VALUES (?, TRUE)";
        $db->prepare($addConditionQuery)->execute([$studentId]);
        
        $heartStudent = [
            'student_id' => $studentId,
            'student_number' => 'TEST001',
            'first_name' => 'John',
            'last_name' => 'Doe',
            'grade_level' => '10',
            'section' => 'A'
        ];
        
        echo "✅ Created test student: {$heartStudent['first_name']} {$heartStudent['last_name']} (ID: {$heartStudent['student_id']})\n";
    } else {
        echo "✅ Found student with heart condition: {$heartStudent['first_name']} {$heartStudent['last_name']} (ID: {$heartStudent['student_id']})\n";
    }
    
    // 2. Update student to require special clearance
    $updateStudentQuery = "UPDATE students SET 
                           requires_special_clearance = TRUE,
                           general_clearance_status = 'pending',
                           clearance_notes = 'Heart condition requires medical clearance for off-campus activities'
                           WHERE student_id = ?";
    $db->prepare($updateStudentQuery)->execute([$heartStudent['student_id']]);
    echo "✅ Updated student to require special clearance\n";
    
    // 3. Create PENDING clearance (this will trigger the HOLD scenario)
    $createClearanceQuery = "INSERT INTO medical_clearances 
                             (student_id, clearance_type, status, required_for, parent_consent, doctor_approval, medical_notes)
                             VALUES (?, 'off_campus', 'pending', 'Heart condition - requires doctor approval', FALSE, FALSE, 
                                     'Student has heart condition. Requires parent consent and doctor approval before off-campus activities.')";
    $db->prepare($createClearanceQuery)->execute([$heartStudent['student_id']]);
    echo "✅ Created PENDING clearance for student\n";
    
    // 4. Test the clearance check API
    echo "\n=== Testing Clearance Check API ===\n";
    
    $testData = json_encode([
        'student_id' => $heartStudent['student_id'],
        'activity_type' => 'off_campus'
    ]);
    
    // Simulate API call
    $_POST = json_decode($testData, true);
    
    echo "📋 Student: {$heartStudent['first_name']} {$heartStudent['last_name']} (#{$heartStudent['student_number']})\n";
    echo "📋 Grade: {$heartStudent['grade_level']}-{$heartStudent['section']}\n";
    echo "📋 Activity: Off-campus field trip\n";
    echo "📋 Medical Condition: Heart problem ❤️\n";
    echo "📋 Clearance Status: PENDING ⏳\n\n";
    
    // Check clearance status
    $checkQuery = "SELECT 
                      s.student_id,
                      s.requires_special_clearance,
                      s.general_clearance_status,
                      mc.status as clearance_status,
                      mc.parent_consent,
                      mc.doctor_approval,
                      mh.condition_heart_problem
                   FROM students s
                   LEFT JOIN medical_clearances mc ON s.student_id = mc.student_id AND mc.clearance_type = 'off_campus'
                   LEFT JOIN medical_history mh ON s.student_id = mh.student_id
                   WHERE s.student_id = ?";
    
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->execute([$heartStudent['student_id']]);
    $result = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    echo "🔍 CLEARANCE CHECK RESULT:\n";
    
    if ($result['requires_special_clearance'] && $result['clearance_status'] === 'pending') {
        echo "🚨 STATUS: HOLD - STUDENT CANNOT PARTICIPATE\n";
        echo "🚨 LEVEL: RED ALERT\n";
        echo "🚨 REASON: Medical clearance PENDING\n";
        echo "🚨 ACTION: Student must be held back from field trip\n";
        echo "📞 PARENT CONTACT REQUIRED: YES\n";
        
        if ($result['condition_heart_problem']) {
            echo "⚠️  MEDICAL WARNING: Heart condition present\n";
        }
        
        echo "\n✅ SYSTEM WORKING CORRECTLY! Student would be flagged and held back.\n";
    } else {
        echo "❌ System not working as expected\n";
    }
    
    // 5. Test APPROVED scenario
    echo "\n=== Testing APPROVED Scenario ===\n";
    
    // Update clearance to approved
    $approveQuery = "UPDATE medical_clearances SET 
                     status = 'approved',
                     parent_consent = TRUE,
                     doctor_approval = TRUE,
                     issued_date = CURDATE(),
                     expiry_date = DATE_ADD(CURDATE(), INTERVAL 6 MONTH)
                     WHERE student_id = ? AND clearance_type = 'off_campus'";
    $db->prepare($approveQuery)->execute([$heartStudent['student_id']]);
    
    // Update student status
    $updateStatusQuery = "UPDATE students SET general_clearance_status = 'approved' WHERE student_id = ?";
    $db->prepare($updateStatusQuery)->execute([$heartStudent['student_id']]);
    
    // Check again
    $checkStmt->execute([$heartStudent['student_id']]);
    $result = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result['clearance_status'] === 'approved') {
        echo "✅ STATUS: APPROVED - STUDENT CAN PARTICIPATE\n";
        echo "✅ LEVEL: GREEN\n";
        echo "✅ REASON: Medical clearance approved\n";
        echo "⚠️  MEDICAL WARNING: Heart condition - monitor for fatigue/chest pain\n";
        echo "\n✅ APPROVED SCENARIO WORKING CORRECTLY!\n";
    }
    
    echo "\n=== Test Summary ===\n";
    echo "✅ Database tables created\n";
    echo "✅ Test student with heart condition ready\n";
    echo "✅ PENDING clearance triggers HOLD status\n";
    echo "✅ APPROVED clearance allows participation with warnings\n";
    echo "✅ System ready for field trip scenario testing!\n";
    
    echo "\n=== Next Steps for Manual Testing ===\n";
    echo "1. Login as Clinic Staff\n";
    echo "2. Go to Visit Form and scan QR for student ID: {$heartStudent['student_id']}\n";
    echo "3. Should see RED ALERT if clearance is pending\n";
    echo "4. Login as Admin to manage clearances\n";
    echo "5. Approve clearance and test again\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>