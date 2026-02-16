<?php
echo "=== Testing QR Scanner + Clearance Integration ===\n\n";

// Test the QR scanner API with our test student
$testStudentId = 25; // From our previous test

echo "Testing QR scan for student ID: $testStudentId\n";

// Simulate QR scan API call
$url = "http://localhost/4seasons/backend/api/get-student-by-qr.php?student_id=$testStudentId";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, false);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: $httpCode\n";
echo "Response:\n";

if ($response) {
    $data = json_decode($response, true);
    if ($data && $data['success']) {
        $student = $data['student'];
        echo "✅ Student Found: {$student['full_name']} (#{$student['student_number']})\n";
        echo "📋 Grade: {$student['grade_section']}\n";
        
        if (isset($student['clearance'])) {
            $clearance = $student['clearance'];
            echo "\n🔍 CLEARANCE STATUS:\n";
            echo "   Status: {$clearance['status']}\n";
            echo "   Level: {$clearance['level']}\n";
            echo "   Message: {$clearance['message']}\n";
            
            if (!empty($clearance['warnings'])) {
                echo "   Warnings: " . implode(', ', $clearance['warnings']) . "\n";
            }
            
            if ($clearance['action_required']) {
                echo "   🚨 ACTION REQUIRED: YES\n";
            }
            
            if ($clearance['requires_parent_contact']) {
                echo "   📞 PARENT CONTACT: YES\n";
            }
            
            // Display color-coded result
            switch ($clearance['level']) {
                case 'green':
                    echo "\n✅ RESULT: GREEN - Student can participate\n";
                    break;
                case 'yellow':
                    echo "\n⚠️  RESULT: YELLOW - Caution required\n";
                    break;
                case 'red':
                    echo "\n🚨 RESULT: RED - HOLD student, cannot participate\n";
                    break;
            }
        } else {
            echo "❌ No clearance data returned\n";
        }
        
        if (isset($student['emergency_contact'])) {
            echo "\n📞 Emergency Contact: {$student['emergency_contact']['name']} - {$student['emergency_contact']['phone']}\n";
        }
        
    } else {
        echo "❌ API Error: " . ($data['message'] ?? 'Unknown error') . "\n";
    }
} else {
    echo "❌ Failed to get response from API\n";
}

echo "\n=== Integration Test Complete ===\n";
echo "The QR scanner now includes full clearance verification!\n";
echo "When staff scan a student's QR code, they will see:\n";
echo "- GREEN: Student cleared for activities\n";
echo "- YELLOW: Caution - medical conditions present\n";
echo "- RED: HOLD - student cannot participate\n";
?>