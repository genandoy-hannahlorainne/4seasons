<?php
/**
 * Get Health Monitoring Heat Map for Adviser's Class
 * GET /api/adviser/get-health-heatmap.php?days=7
 */

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, user_id, X-Requested-With");
header("Access-Control-Max-Age: 3600");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

// Authenticate user
$auth = new Auth($database);

// Require Adviser role
if (!$auth->hasRole('Adviser')) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Access denied. Adviser role required.'
    ]);
    exit();
}

$userId = $auth->userId();

// Get date range from query params (default to last 7 days)
$days = isset($_GET['days']) ? intval($_GET['days']) : 7;
$startDate = date('Y-m-d', strtotime("-$days days"));
$endDate = date('Y-m-d');

try {
    // Get adviser's grade and section from advisers table
    $stmt = $db->prepare("
        SELECT a.grade_level, a.section 
        FROM advisers a
        WHERE a.user_id = :user_id AND a.is_active = 1
    ");
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Adviser not found'
        ]);
        exit();
    }
    
    $adviser = $stmt->fetch(PDO::FETCH_ASSOC);
    $gradeLevel = $adviser['grade_level'];
    $section = $adviser['section'];
    
    // Get total students in class
    $stmt = $db->prepare("
        SELECT COUNT(*) as total
        FROM students
        WHERE grade_level = :grade_level AND section = :section
    ");
    $stmt->bindParam(':grade_level', $gradeLevel);
    $stmt->bindParam(':section', $section);
    $stmt->execute();
    $totalStudents = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get clinic visits by date and symptom category
    $stmt = $db->prepare("
        SELECT 
            DATE(mv.visit_datetime) as visit_date,
            mv.diagnosis_text,
            COUNT(DISTINCT mv.student_id) as student_count,
            GROUP_CONCAT(DISTINCT CONCAT(s.first_name, ' ', s.last_name) SEPARATOR ', ') as students
        FROM medical_visits mv
        JOIN students s ON mv.student_id = s.student_id
        WHERE s.grade_level = :grade_level
        AND s.section = :section
        AND DATE(mv.visit_datetime) BETWEEN :start_date AND :end_date
        GROUP BY DATE(mv.visit_datetime), mv.diagnosis_text
        ORDER BY visit_date DESC, student_count DESC
    ");
    $stmt->bindParam(':grade_level', $gradeLevel);
    $stmt->bindParam(':section', $section);
    $stmt->bindParam(':start_date', $startDate);
    $stmt->bindParam(':end_date', $endDate);
    $stmt->execute();
    
    $visitsByDate = [];
    $symptomCategories = [];
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $date = $row['visit_date'];
        $symptom = categorizeSymptom($row['diagnosis_text']);
        
        if (!isset($visitsByDate[$date])) {
            $visitsByDate[$date] = [
                'date' => $date,
                'total_visits' => 0,
                'unique_students' => 0,
                'symptoms' => []
            ];
        }
        
        $visitsByDate[$date]['total_visits'] += $row['student_count'];
        $visitsByDate[$date]['symptoms'][$symptom] = [
            'count' => $row['student_count'],
            'students' => explode(', ', $row['students'])
        ];
        
        if (!in_array($symptom, $symptomCategories)) {
            $symptomCategories[] = $symptom;
        }
    }
    
    // Calculate unique students per date
    $stmt = $db->prepare("
        SELECT 
            DATE(mv.visit_datetime) as visit_date,
            COUNT(DISTINCT mv.student_id) as unique_students
        FROM medical_visits mv
        JOIN students s ON mv.student_id = s.student_id
        WHERE s.grade_level = :grade_level
        AND s.section = :section
        AND DATE(mv.visit_datetime) BETWEEN :start_date AND :end_date
        GROUP BY DATE(mv.visit_datetime)
    ");
    $stmt->bindParam(':grade_level', $gradeLevel);
    $stmt->bindParam(':section', $section);
    $stmt->bindParam(':start_date', $startDate);
    $stmt->bindParam(':end_date', $endDate);
    $stmt->execute();
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $date = $row['visit_date'];
        if (isset($visitsByDate[$date])) {
            $visitsByDate[$date]['unique_students'] = $row['unique_students'];
            $visitsByDate[$date]['percentage'] = round(($row['unique_students'] / $totalStudents) * 100, 1);
        }
    }
    
    // Get trending symptoms (most common in period)
    $stmt = $db->prepare("
        SELECT 
            mv.diagnosis_text,
            COUNT(DISTINCT mv.student_id) as student_count,
            COUNT(*) as visit_count
        FROM medical_visits mv
        JOIN students s ON mv.student_id = s.student_id
        WHERE s.grade_level = :grade_level
        AND s.section = :section
        AND DATE(mv.visit_datetime) BETWEEN :start_date AND :end_date
        GROUP BY mv.diagnosis_text
        ORDER BY student_count DESC
        LIMIT 5
    ");
    $stmt->bindParam(':grade_level', $gradeLevel);
    $stmt->bindParam(':section', $section);
    $stmt->bindParam(':start_date', $startDate);
    $stmt->bindParam(':end_date', $endDate);
    $stmt->execute();
    
    $trendingSymptoms = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $trendingSymptoms[] = [
            'symptom' => categorizeSymptom($row['diagnosis_text']),
            'student_count' => $row['student_count'],
            'visit_count' => $row['visit_count'],
            'percentage' => round(($row['student_count'] / $totalStudents) * 100, 1)
        ];
    }
    
    // Get high-risk days (>10% of class visited)
    $highRiskDays = array_filter($visitsByDate, function($day) {
        return isset($day['percentage']) && $day['percentage'] >= 10;
    });
    
    // Get alerts for patterns
    $alerts = generateHealthAlerts($visitsByDate, $totalStudents, $trendingSymptoms);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'advisory_class' => "Grade $gradeLevel - $section",
            'total_students' => $totalStudents,
            'date_range' => [
                'start' => $startDate,
                'end' => $endDate,
                'days' => $days
            ],
            'visits_by_date' => array_values($visitsByDate),
            'symptom_categories' => $symptomCategories,
            'trending_symptoms' => $trendingSymptoms,
            'high_risk_days' => array_values($highRiskDays),
            'alerts' => $alerts
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Health heatmap error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}

function categorizeSymptom($diagnosis) {
    $text = strtolower($diagnosis);
    
    if (preg_match('/cough|cold|flu|fever|respiratory|throat|sore throat/i', $text)) {
        return 'Respiratory';
    } elseif (preg_match('/stomach|nausea|vomit|diarrhea|abdominal/i', $text)) {
        return 'Gastrointestinal';
    } elseif (preg_match('/headache|migraine|dizzy/i', $text)) {
        return 'Headache';
    } elseif (preg_match('/injury|wound|cut|bruise|sprain|fracture/i', $text)) {
        return 'Injury';
    } elseif (preg_match('/allergy|rash|itch|skin/i', $text)) {
        return 'Allergic/Skin';
    } else {
        return 'Other';
    }
}

function generateHealthAlerts($visitsByDate, $totalStudents, $trendingSymptoms) {
    $alerts = [];
    
    // Check for outbreak pattern (>15% of class with same symptom)
    foreach ($visitsByDate as $date => $data) {
        if (isset($data['percentage']) && $data['percentage'] >= 15) {
            $topSymptom = null;
            $maxCount = 0;
            
            foreach ($data['symptoms'] as $symptom => $info) {
                if ($info['count'] > $maxCount) {
                    $maxCount = $info['count'];
                    $topSymptom = $symptom;
                }
            }
            
            if ($topSymptom) {
                $alerts[] = [
                    'type' => 'outbreak',
                    'severity' => 'high',
                    'date' => $date,
                    'message' => "{$data['percentage']}% of class visited clinic on " . date('M d', strtotime($date)) . " with {$topSymptom} symptoms",
                    'recommendation' => 'Consider deep cleaning classroom and monitoring for spread'
                ];
            }
        }
    }
    
    // Check for trending symptoms
    if (!empty($trendingSymptoms) && $trendingSymptoms[0]['percentage'] >= 10) {
        $top = $trendingSymptoms[0];
        $alerts[] = [
            'type' => 'trend',
            'severity' => 'medium',
            'message' => "{$top['symptom']} affecting {$top['percentage']}% of students",
            'recommendation' => 'Monitor students and coordinate with health staff'
        ];
    }
    
    return $alerts;
}
?>
