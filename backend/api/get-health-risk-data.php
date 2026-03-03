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

    // Get BMI data per student (latest vitals BMI, fallback to student BMI)
    // Then aggregate by grade level to avoid counting multiple visits per student
    $query = "
        SELECT 
            COALESCE(b.grade_level, 'Unknown') as grade_level,
            COUNT(*) as total_students,
            SUM(CASE WHEN LOWER(COALESCE(b.bmi_category, '')) = 'underweight' THEN 1 ELSE 0 END) as underweight_count,
            SUM(CASE WHEN LOWER(COALESCE(b.bmi_category, '')) IN ('normal', 'normal weight') THEN 1 ELSE 0 END) as normal_count,
            SUM(CASE WHEN LOWER(COALESCE(b.bmi_category, '')) = 'overweight' THEN 1 ELSE 0 END) as overweight_count,
            SUM(CASE WHEN LOWER(COALESCE(b.bmi_category, '')) = 'obese' THEN 1 ELSE 0 END) as obese_count,
            AVG(b.bmi) as average_bmi
        FROM (
            SELECT 
                s.student_id,
                s.grade_level,
                COALESCE(vl.latest_bmi, s.bmi) as bmi,
                CASE 
                    WHEN COALESCE(vl.latest_bmi, s.bmi) < 18.5 THEN 'Underweight'
                    WHEN COALESCE(vl.latest_bmi, s.bmi) >= 18.5 AND COALESCE(vl.latest_bmi, s.bmi) < 25 THEN 'Normal'
                    WHEN COALESCE(vl.latest_bmi, s.bmi) >= 25 AND COALESCE(vl.latest_bmi, s.bmi) < 30 THEN 'Overweight'
                    WHEN COALESCE(vl.latest_bmi, s.bmi) >= 30 THEN 'Obese'
                    ELSE NULL
                END as bmi_category
            FROM students s
            LEFT JOIN (
                SELECT 
                    ranked.student_id,
                    ranked.bmi as latest_bmi
                FROM (
                    SELECT 
                        mv.student_id,
                        v.bmi,
                        ROW_NUMBER() OVER (
                            PARTITION BY mv.student_id
                            ORDER BY COALESCE(v.recorded_at, mv.visit_datetime) DESC, v.vitals_id DESC
                        ) as rn
                    FROM medical_visits mv
                    INNER JOIN vitals v ON v.visit_id = mv.visit_id
                    WHERE v.bmi IS NOT NULL
                ) ranked
                WHERE ranked.rn = 1
            ) vl ON vl.student_id = s.student_id
            WHERE s.is_active = 1
        ) b
        WHERE b.bmi IS NOT NULL
        GROUP BY b.grade_level
        HAVING total_students > 0
        ORDER BY b.grade_level
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
            
            $rawGradeLevel = trim((string)$row['grade_level']);
            $formattedGradeLevel = preg_match('/^\d+$/', $rawGradeLevel)
                ? 'Grade ' . $rawGradeLevel
                : $rawGradeLevel;

            $gradeStatistics[] = [
                'grade_name' => $formattedGradeLevel,
                'grade_level' => $formattedGradeLevel,
                'total_students' => $total,
                'underweight_count' => $underweight,
                'normal_count' => $normal,
                'overweight_count' => $overweight,
                'obese_count' => $obese,
                'average_bmi' => $row['average_bmi'] !== null ? round((float)$row['average_bmi'], 1) : 0,
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
            
            if ($row['average_bmi'] !== null) {
                $totalBmi += (float)$row['average_bmi'] * $total;
                $bmiCount += $total;
            }
        }
    }

    usort($gradeStatistics, function($a, $b) {
        preg_match('/(\d+)/', $a['grade_name'], $am);
        preg_match('/(\d+)/', $b['grade_name'], $bm);
        $an = isset($am[1]) ? (int)$am[1] : PHP_INT_MAX;
        $bn = isset($bm[1]) ? (int)$bm[1] : PHP_INT_MAX;
        return $an <=> $bn;
    });

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
            SUM(CASE WHEN v.bmi >= 25 AND v.bmi < 30 THEN 1 ELSE 0 END) as new_overweight,
            SUM(CASE WHEN v.bmi >= 30 THEN 1 ELSE 0 END) as new_obese
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