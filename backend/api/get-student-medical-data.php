<?php
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

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

function hasColumn(PDO $db, string $table, string $column): bool {
    $stmt = $db->prepare("SHOW COLUMNS FROM `{$table}` LIKE :column");
    $stmt->bindValue(':column', $column);
    $stmt->execute();
    return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
}

function hasTable(PDO $db, string $table): bool {
    $stmt = $db->prepare("SHOW TABLES LIKE :table_name");
    $stmt->bindValue(':table_name', $table);
    $stmt->execute();
    return (bool) $stmt->fetch(PDO::FETCH_NUM);
}

// Get student_id from query parameter (direct) or user_id (indirect)
$student_id = null;
$student = null;

$hasEmergencyContactRelation = hasColumn($db, 'students', 'emergency_contact_relation');
$hasEmergencyContactPhone = hasColumn($db, 'students', 'emergency_contact_phone');

$studentQueryBase = "SELECT 
                                s.student_id,
                                s.student_number,
                                s.first_name,
                                s.middle_name,
                                s.last_name,
                                s.birth_date,
                                s.gender,
                                s.blood_type,
                                s.address,
                                s.emergency_contact,
                                " . ($hasEmergencyContactRelation ? "s.emergency_contact_relation" : "NULL AS emergency_contact_relation") . ",
                                " . ($hasEmergencyContactPhone ? "s.emergency_contact_phone" : "NULL AS emergency_contact_phone") . ",
                                s.grade_level,
                                s.section,
                                s.height_cm,
                                s.weight_kg,
                                s.bmi,
                                s.bmi_category,
                                u.full_name as user_full_name,
                                u.phone as user_phone,
                                u.email as user_email
                            FROM students s
                            LEFT JOIN users u ON s.user_id = u.user_id";

if (isset($_GET['student_id'])) {
    // Direct student_id provided
    $student_id = $_GET['student_id'];
    
    // Get student info
    $studentQuery = $studentQueryBase . " WHERE s.student_id = :student_id AND s.is_active = 1";
    
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(":student_id", $student_id);
    $studentStmt->execute();
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    
} elseif (isset($_GET['user_id']) || isset($_SERVER['HTTP_USER_ID'])) {
    // Get user_id from header or query parameter
    $user_id = isset($_SERVER['HTTP_USER_ID']) ? $_SERVER['HTTP_USER_ID'] : $_GET['user_id'];
    
    error_log("Getting student for user_id: " . $user_id);
    
    // Get student info from user_id
    $studentQuery = $studentQueryBase . " WHERE s.user_id = :user_id AND s.is_active = 1";
    
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(":user_id", $user_id);
    $studentStmt->execute();
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    
    error_log("Student found: " . ($student ? "Yes" : "No"));
    
    if ($student) {
        $student_id = $student['student_id'];
    }
} else {
    // Default for testing
    $user_id = 19;
    error_log("No user_id provided, using default: $user_id");
    
    $studentQuery = $studentQueryBase . " WHERE s.user_id = :user_id AND s.is_active = 1";
    
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(":user_id", $user_id);
    $studentStmt->execute();
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($student) {
        $student_id = $student['student_id'];
    }
}

try {
    if (!$student || !$student_id) {
        error_log("Student not found - student: " . ($student ? "exists" : "null") . ", student_id: " . ($student_id ? $student_id : "null"));
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Student not found. Please ensure you are logged in as a student.'
        ]);
        exit();
    }

    // Fallback emergency contact values from parent linkage when student columns are unavailable/empty
    if ((empty($student['emergency_contact']) || empty($student['emergency_contact_relation']) || empty($student['emergency_contact_phone']))
        && hasTable($db, 'parents') && hasTable($db, 'student_parent')) {
        try {
            $parentQuery = "SELECT p.first_name, p.last_name, p.relation, p.phone
                            FROM student_parent sp
                            INNER JOIN parents p ON sp.parent_id = p.parent_id
                            WHERE sp.student_id = :student_id
                            ORDER BY
                                (CASE WHEN TRIM(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, ''))) = :emergency_name THEN 1 ELSE 0 END) DESC,
                                (CASE WHEN COALESCE(TRIM(p.relation), '') <> '' THEN 1 ELSE 0 END) DESC,
                                (CASE WHEN COALESCE(TRIM(p.phone), '') <> '' THEN 1 ELSE 0 END) DESC,
                                p.parent_id DESC
                            LIMIT 1";
            $parentStmt = $db->prepare($parentQuery);
            $parentStmt->bindParam(':student_id', $student_id);
            $emergencyName = trim((string)($student['emergency_contact'] ?? ''));
            $parentStmt->bindParam(':emergency_name', $emergencyName);
            $parentStmt->execute();
            $parent = $parentStmt->fetch(PDO::FETCH_ASSOC);

            if ($parent) {
                if (empty($student['emergency_contact'])) {
                    $student['emergency_contact'] = trim(($parent['first_name'] ?? '') . ' ' . ($parent['last_name'] ?? ''));
                }
                if (empty($student['emergency_contact_relation'])) {
                    $student['emergency_contact_relation'] = $parent['relation'] ?? null;
                }
                if (empty($student['emergency_contact_phone'])) {
                    $student['emergency_contact_phone'] = $parent['phone'] ?? null;
                }
            }
        } catch (Exception $e) {
            error_log("Parent fallback lookup skipped: " . $e->getMessage());
        }
    }

    // Get vitals - for now, we'll return null since vitals aren't stored in separate columns
    // In the future, vitals could be stored in a separate table or added to medical_visits
    $vitals = null;

    // Get allergies
    $allergyNameColumn = hasColumn($db, 'allergies', 'allergy_name') ? 'allergy_name' : 'allergy_text';
    $allergyRecordedColumn = hasColumn($db, 'allergies', 'recorded_at') ? 'recorded_at' : 'created_at';

    $allergiesQuery = "SELECT 
                          allergy_id,
                          {$allergyNameColumn} AS allergy_text,
                          severity,
                          {$allergyRecordedColumn} AS recorded_at
                       FROM allergies
                       WHERE student_id = :student_id
                       ORDER BY recorded_at DESC";
    
    $allergiesStmt = $db->prepare($allergiesQuery);
    $allergiesStmt->bindParam(":student_id", $student_id);
    
    try {
        $allergiesStmt->execute();
        $allergies = $allergiesStmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Allergies table error: " . $e->getMessage());
        $allergies = [];
    }
    
    // Get recent visits (activities) instead of immunizations
    $recentVisitsQuery = "SELECT 
                             visit_datetime,
                             visit_type,
                             notes as diagnosis,
                             status
                          FROM medical_visits
                          WHERE student_id = :student_id
                          ORDER BY visit_datetime DESC
                          LIMIT 10";
    
    $recentVisitsStmt = $db->prepare($recentVisitsQuery);
    $recentVisitsStmt->bindParam(":student_id", $student_id);
    $recentVisitsStmt->execute();
    $recentVisits = $recentVisitsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get medical history
     $hasLegacyMedicalHistoryColumns = hasColumn($db, 'medical_history', 'allergy_medicine');

     $medicalHistoryQuery = $hasLegacyMedicalHistoryColumns
          ? "SELECT 
                  allergy_medicine,
                  allergy_pollens,
                  allergy_food,
                  allergy_stinging_insects,
                  condition_error_refraction,
                  condition_heart_problem,
                  condition_bleeding_disorder,
                  condition_hernia,
                  condition_asthma,
                  condition_anemia,
                  condition_anxiety_depression,
                  condition_seizure,
                  surgery_hospitalization,
                  family_tuberculosis,
                  family_cancer,
                  family_stroke_cardiac,
                  family_diabetes,
                  family_hypertension,
                  family_depression,
                  family_thyroid,
                  family_phobia,
                  smoke_exposure
              FROM medical_history
              WHERE student_id = :student_id"
          : "SELECT
                  condition_asthma,
                  condition_diabetes,
                  condition_heart_problem,
                  condition_hypertension,
                  condition_seizure_disorder,
                  condition_bleeding_disorder,
                  condition_kidney_disease,
                  condition_mental_health,
                  other_conditions,
                  current_medications,
                  family_medical_history,
                  notes
              FROM medical_history
              WHERE student_id = :student_id";
    
    $medicalHistoryStmt = $db->prepare($medicalHistoryQuery);
    $medicalHistoryStmt->bindParam(":student_id", $student_id);
    
    $medicalHistory = null;
    try {
        $medicalHistoryStmt->execute();
        $historyData = $medicalHistoryStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($historyData) {
            if ($hasLegacyMedicalHistoryColumns) {
                // Convert legacy database format to frontend format
                $medicalHistory = [
                    'allergies' => [
                        'medicine' => (bool)$historyData['allergy_medicine'],
                        'pollens' => (bool)$historyData['allergy_pollens'],
                        'food' => (bool)$historyData['allergy_food'],
                        'stinging_insects' => (bool)$historyData['allergy_stinging_insects']
                    ],
                    'medical_conditions' => [
                        'error_refraction' => (bool)$historyData['condition_error_refraction'],
                        'heart_problem' => (bool)$historyData['condition_heart_problem'],
                        'bleeding_disorder' => (bool)$historyData['condition_bleeding_disorder'],
                        'hernia' => (bool)$historyData['condition_hernia'],
                        'asthma' => (bool)$historyData['condition_asthma'],
                        'anemia' => (bool)$historyData['condition_anemia'],
                        'anxiety_depression' => (bool)$historyData['condition_anxiety_depression'],
                        'seizure' => (bool)$historyData['condition_seizure']
                    ],
                    'surgery_hospitalization' => (bool)$historyData['surgery_hospitalization'],
                    'family_history' => [
                        'tuberculosis' => (bool)$historyData['family_tuberculosis'],
                        'cancer' => (bool)$historyData['family_cancer'],
                        'stroke_cardiac' => (bool)$historyData['family_stroke_cardiac'],
                        'diabetes' => (bool)$historyData['family_diabetes'],
                        'hypertension' => (bool)$historyData['family_hypertension'],
                        'depression' => (bool)$historyData['family_depression'],
                        'thyroid' => (bool)$historyData['family_thyroid'],
                        'phobia' => (bool)$historyData['family_phobia']
                    ],
                    'smoke_exposure' => (bool)$historyData['smoke_exposure']
                ];
            } else {
                // Current medical_history schema compatibility mapping
                $medicalHistory = [
                    'allergies' => [
                        'medicine' => false,
                        'pollens' => false,
                        'food' => false,
                        'stinging_insects' => false
                    ],
                    'medical_conditions' => [
                        'error_refraction' => false,
                        'heart_problem' => (bool)$historyData['condition_heart_problem'],
                        'bleeding_disorder' => (bool)$historyData['condition_bleeding_disorder'],
                        'hernia' => false,
                        'asthma' => (bool)$historyData['condition_asthma'],
                        'anemia' => false,
                        'anxiety_depression' => (bool)$historyData['condition_mental_health'],
                        'seizure' => (bool)$historyData['condition_seizure_disorder']
                    ],
                    'surgery_hospitalization' => !empty($historyData['other_conditions']),
                    'family_history' => [
                        'tuberculosis' => false,
                        'cancer' => stripos((string)$historyData['family_medical_history'], 'cancer') !== false,
                        'stroke_cardiac' => stripos((string)$historyData['family_medical_history'], 'stroke') !== false || stripos((string)$historyData['family_medical_history'], 'cardiac') !== false,
                        'diabetes' => (bool)$historyData['condition_diabetes'] || stripos((string)$historyData['family_medical_history'], 'diabetes') !== false,
                        'hypertension' => (bool)$historyData['condition_hypertension'] || stripos((string)$historyData['family_medical_history'], 'hypertension') !== false,
                        'depression' => stripos((string)$historyData['family_medical_history'], 'depression') !== false,
                        'thyroid' => stripos((string)$historyData['family_medical_history'], 'thyroid') !== false,
                        'phobia' => false
                    ],
                    'smoke_exposure' => false,
                    'notes' => $historyData['notes'] ?? null,
                    'current_medications' => $historyData['current_medications'] ?? null
                ];
            }
        }
    } catch (PDOException $e) {
        error_log("Medical history table error: " . $e->getMessage());
        $medicalHistory = null;
    }
    
    // Get last visit
    $lastVisitQuery = "SELECT 
                          visit_datetime,
                          visit_type,
                          notes as diagnosis
                       FROM medical_visits
                       WHERE student_id = :student_id
                       ORDER BY visit_datetime DESC
                       LIMIT 1";
    
    $lastVisitStmt = $db->prepare($lastVisitQuery);
    $lastVisitStmt->bindParam(":student_id", $student_id);
    $lastVisitStmt->execute();
    $lastVisit = $lastVisitStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get adviser information using proper relationships
     $adviserQuery = "SELECT 
                                u.user_id,
                                u.full_name,
                                u.phone,
                                u.email
                            FROM students s
                            LEFT JOIN sections sec_current ON s.current_section_id = sec_current.id
                            LEFT JOIN sections sec_fallback ON sec_fallback.section_name = s.section
                                AND sec_fallback.is_active = 1
                                AND sec_fallback.adviser_id IS NOT NULL
                                AND (s.current_school_year_id IS NULL OR sec_fallback.school_year_id = s.current_school_year_id)
                            LEFT JOIN grade_levels gl_fallback ON sec_fallback.grade_level_id = gl_fallback.id
                            LEFT JOIN users u ON u.user_id = COALESCE(
                                 sec_current.adviser_id,
                                 CASE WHEN gl_fallback.level_number = s.grade_level THEN sec_fallback.adviser_id ELSE NULL END
                            )
                            WHERE s.student_id = :student_id
                            AND s.is_active = 1
                            LIMIT 1";
    
    $adviserStmt = $db->prepare($adviserQuery);
    $adviserStmt->bindParam(":student_id", $student_id);
    $adviserStmt->execute();
    $adviser = $adviserStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get visit counts
    $recentVisitsQuery = "SELECT COUNT(*) as count
                         FROM medical_visits
                         WHERE student_id = :student_id
                         AND visit_datetime >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    
    $recentVisitsStmt = $db->prepare($recentVisitsQuery);
    $recentVisitsStmt->bindParam(":student_id", $student_id);
    $recentVisitsStmt->execute();
    $recentVisitsCount = $recentVisitsStmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    $totalVisitsQuery = "SELECT COUNT(*) as count
                        FROM medical_visits
                        WHERE student_id = :student_id";
    
    $totalVisitsStmt = $db->prepare($totalVisitsQuery);
    $totalVisitsStmt->bindParam(":student_id", $student_id);
    $totalVisitsStmt->execute();
    $totalVisitsCount = $totalVisitsStmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Format response for dashboard
    $response = [
        'success' => true,
        'data' => [
            'vitals' => $vitals,
            'allergies' => array_map(function($allergy) {
                return [
                    'allergy_id' => (int)$allergy['allergy_id'],
                    'allergy_text' => $allergy['allergy_text'],
                    'severity' => $allergy['severity'],
                    'recorded_at' => $allergy['recorded_at']
                ];
            }, $allergies),
            'recent_visits' => array_map(function($visit) {
                return [
                    'visit_datetime' => $visit['visit_datetime'],
                    'visit_type' => $visit['visit_type'],
                    'diagnosis' => $visit['diagnosis'],
                    'status' => $visit['status']
                ];
            }, $recentVisits),
            'medical_history' => $medicalHistory,
            'last_visit' => $lastVisit ? [
                'visit_datetime' => $lastVisit['visit_datetime'],
                'visit_type' => $lastVisit['visit_type'],
                'diagnosis' => $lastVisit['diagnosis']
            ] : null,
            'personal_info' => [
                'student_id' => (int)$student['student_id'],
                'student_number' => $student['student_number'],
                'full_name' => !empty($student['first_name']) || !empty($student['last_name']) 
                    ? trim($student['first_name'] . ' ' . ($student['middle_name'] ? $student['middle_name'] . ' ' : '') . $student['last_name'])
                    : ($student['user_full_name'] ?: 'Unknown'),
                'birth_date' => $student['birth_date'],
                'gender' => $student['gender'],
                'blood_type' => $student['blood_type'],
                'address' => $student['address'],
                'phone' => $student['user_phone'] ?? null,
                'email' => $student['user_email'] ?? null,
                'emergency_contact' => $student['emergency_contact'],
                'emergency_contact_relation' => $student['emergency_contact_relation'],
                'emergency_contact_phone' => $student['emergency_contact_phone'],
                'grade_level' => $student['grade_level'],
                'section' => $student['section'],
                'height_cm' => $student['height_cm'] ? (float)$student['height_cm'] : null,
                'weight_kg' => $student['weight_kg'] ? (float)$student['weight_kg'] : null,
                'bmi' => $student['bmi'] ? (float)$student['bmi'] : null,
                'bmi_category' => $student['bmi_category'],
                'adviser_name' => $adviser ? preg_replace('/\s+/', ' ', trim($adviser['full_name'])) : 'Not assigned',
                'adviser_contact' => $adviser ? ($adviser['phone'] ?: $adviser['email']) : 'N/A'
            ],
            'recent_visits_count' => (int)$recentVisitsCount,
            'total_visits_count' => (int)$totalVisitsCount
        ]
    ];
    
    http_response_code(200);
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching medical data: ' . $e->getMessage()
    ]);
}
?>
