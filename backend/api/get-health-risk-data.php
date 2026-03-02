<?php
/**
 * Get health risk visualization data - Legacy API endpoint
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, user_id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/database.php';

try {
    // Create database connection
    $database = new Database();
    $pdo = $database->getConnection();

    if (!$pdo) {
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed'
        ]);
        exit;
    }

    // Get BMI data from vitals table with student grade information
    $query = "
        SELECT 
            COALESCE(s.grade_level, 'Unknown') as grade_name,
            COALESCE(s.grade_level, 'Unknown') as grade_level,
            COUNT(DISTINCT s.student_id) as total_students,
            SUM(CASE WHEN v.bmi_category = 'Underweight' THEN 1 ELSE 0 END) as underweight_count,
            SUM(CASE WHEN v.bmi_category = 'Normal' THEN 1 ELSE 0 END) as normal_count,
            SUM(CASE WHEN v.bmi_category = 'Overweight' THEN 1 ELSE 0 END) as overweight_count,
            SUM(CASE WHEN v.bmi_category = 'Obese' THEN 1 ELSE 0 END) as obese_count,
            AVG(v.bmi) as average_bmi
        FROM students s
        LEFT JOIN medical_visits mv ON s.student_id = mv.student_id
        LEFT JOIN vitals v ON mv.visit_id = v.visit_id AND v.bmi IS NOT NULL
        WHERE s.is_active = 1
        GROUP BY s.grade_level
        HAVING total_students > 0
        ORDER BY s.grade_level
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $gradeStatistics = [];
    $totalStudents = 0;
    $totalUnderweight = 0;
    $totalNormal = 0;
    $totalOverweight = 0;
    $totalObese = 0;
    $totalBmi = 0;
    $bmiCount = 0;
    
    if (empty($results)) {
        // No data available - return empty structure
        $gradeStatistics = [[
            'grade_name' => 'No Data',
            'grade_level' => 'No Data',
            'total_students' => 0,
            'underweight_count' => 0,
            'normal_count' => 0,
            'overweight_count' => 0,
            'obese_count' => 0,
            'underweight_percentage' => 0.0,
            'normal_percentage' => 0.0,
            'overweight_percentage' => 0.0,
            'obese_percentage' => 0.0
        ]];
    } else {
        foreach ($results as $row) {
            $total = (int)$row['total_students'];
            $underweight = (int)$row['underweight_count'];
            $normal = (int)$row['normal_count'];
            $overweight = (int)$row['overweight_count'];
            $obese = (int)$row['obese_count'];
            
            // Calculate percentages
            $underweightPct = $total > 0 ? round(($underweight / $total) * 100, 1) : 0;
            $normalPct = $total > 0 ? round(($normal / $total) * 100, 1) : 0;
            $overweightPct = $total > 0 ? round(($overweight / $total) * 100, 1) : 0;
            $obesePct = $total > 0 ? round(($obese / $total) * 100, 1) : 0;
            
            $gradeStatistics[] = [
                'grade_name' => 'Grade ' . $row['grade_level'],
                'grade_level' => 'Grade ' . $row['grade_level'],
                'total_students' => $total,
                'underweight_count' => $underweight,
                'normal_count' => $normal,
                'overweight_count' => $overweight,
                'obese_count' => $obese,
                'underweight_percentage' => $underweightPct,
                'normal_percentage' => $normalPct,
                'overweight_percentage' => $overweightPct,
                'obese_percentage' => $obesePct
            ];
            
            // Accumulate totals
            $totalStudents += $total;
            $totalUnderweight += $underweight;
            $totalNormal += $normal;
            $totalOverweight += $overweight;
            $totalObese += $obese;
            
            if ($row['average_bmi']) {
                $totalBmi += (float)$row['average_bmi'] * $total;
                $bmiCount += $total;
            }
        }
    }

    $overallStatistics = [
        'total_students' => $totalStudents,
        'total_underweight' => $totalUnderweight,
        'total_normal' => $totalNormal,
        'total_overweight' => $totalOverweight,
        'total_obese' => $totalObese,
        'average_bmi' => $bmiCount > 0 ? round($totalBmi / $bmiCount, 1) : 0
    ];

    // Get top health risks by grade
    $topRisks = [];
    foreach ($gradeStatistics as $grade) {
        $risks = [
            'underweight' => $grade['underweight_percentage'],
            'overweight' => $grade['overweight_percentage'],
            'obese' => $grade['obese_percentage']
        ];
        
        // Find highest risk category
        $highestRisk = 'normal';
        $highestPercentage = $grade['normal_percentage'];
        
        foreach ($risks as $riskType => $percentage) {
            if ($percentage > $highestPercentage) {
                $highestRisk = $riskType;
                $highestPercentage = $percentage;
            }
        }
        
        $topRisks[] = [
            'grade_name' => $grade['grade_name'],
            'grade_level' => $grade['grade_level'],
            'highest_risk' => $highestRisk,
            'risk_percentage' => $highestPercentage,
            'total_students' => $grade['total_students']
        ];
    }

    // Get recent BMI update trends (last 30 days)
    $trendsQuery = "
        SELECT 
            DATE(v.recorded_at) as update_date,
            COUNT(*) as updates_count,
            SUM(CASE WHEN v.bmi_category = 'Overweight' THEN 1 ELSE 0 END) as new_overweight,
            SUM(CASE WHEN v.bmi_category = 'Obese' THEN 1 ELSE 0 END) as new_obese
        FROM vitals v
        WHERE v.recorded_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND v.bmi IS NOT NULL
        GROUP BY DATE(v.recorded_at)
        ORDER BY update_date DESC
        LIMIT 10
    ";
    
    $stmt = $pdo->prepare($trendsQuery);
    $stmt->execute();
    $recentTrends = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Chart data
    $labels = array_column($gradeStatistics, 'grade_name');
    $chartData = [
        'labels' => $labels,
        'datasets' => [
            [
                'label' => 'Underweight',
                'data' => array_column($gradeStatistics, 'underweight_percentage'),
                'backgroundColor' => '#17a2b8',
                'borderColor' => '#138496',
                'borderWidth' => 1
            ],
            [
                'label' => 'Normal Weight',
                'data' => array_column($gradeStatistics, 'normal_percentage'),
                'backgroundColor' => '#28a745',
                'borderColor' => '#1e7e34',
                'borderWidth' => 1
            ],
            [
                'label' => 'Overweight',
                'data' => array_column($gradeStatistics, 'overweight_percentage'),
                'backgroundColor' => '#ffc107',
                'borderColor' => '#e0a800',
                'borderWidth' => 1
            ],
            [
                'label' => 'Obese',
                'data' => array_column($gradeStatistics, 'obese_percentage'),
                'backgroundColor' => '#dc3545',
                'borderColor' => '#c82333',
                'borderWidth' => 1
            ]
        ]
    ];

    echo json_encode([
        'success' => true,
        'data' => [
            'grade_statistics' => $gradeStatistics,
            'overall_statistics' => $overallStatistics,
            'top_health_risks' => $topRisks,
            'recent_trends' => $recentTrends,
            'chart_data' => $chartData
        ],
        'message' => 'Health risk visualization data retrieved successfully'
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to retrieve health risk data: ' . $e->getMessage()
    ]);
}
?>