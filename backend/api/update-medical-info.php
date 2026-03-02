<?php
require_once '../cors.php';
require_once '../config/database.php';
require_once '../middleware/auth.php';

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit();
}

$database = new Database();
$db = $database->getConnection();

function hasColumn(PDO $db, string $table, string $column): bool {
    $stmt = $db->prepare("SHOW COLUMNS FROM `{$table}` LIKE :column");
    $stmt->bindValue(':column', $column);
    $stmt->execute();
    return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
}

// Authenticate user
$auth = new Auth($database);
$requesting_user_id = $auth->userId();

// Get JSON input
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

error_log("=== UPDATE MEDICAL INFO ===");
error_log("Raw input: " . $rawInput);
error_log("Parsed input: " . json_encode($input));

if (!$input) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON input'
    ]);
    exit();
}

try {
    // Get the user_id to update (from request or use current user)
    $target_user_id = isset($input['user_id']) ? intval($input['user_id']) : $requesting_user_id;
    
    error_log("Target user_id: " . $target_user_id);
    error_log("Requesting user_id: " . $requesting_user_id);
    
    // Authorization: User can only update their own info, or admin can update anyone
    if ($requesting_user_id !== $target_user_id && !$auth->hasRole('Admin')) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Forbidden: You can only update your own medical information'
        ]);
        exit();
    }
    
    // Get student ID from user_id
    $studentQuery = "SELECT student_id FROM students WHERE user_id = :user_id AND is_active = 1";
    $studentStmt = $db->prepare($studentQuery);
    $studentStmt->bindParam(":user_id", $target_user_id, PDO::PARAM_INT);
    $studentStmt->execute();
    $student = $studentStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$student) {
        error_log("❌ Student not found for user_id: " . $target_user_id);
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Student not found'
        ]);
        exit();
    }
    
    $student_id = $student['student_id'];
    error_log("✅ Found student_id: " . $student_id);
    
    // Handle medical_history update
    if (isset($input['medical_history'])) {
        $medicalHistory = $input['medical_history'];
        error_log("Processing medical history: " . json_encode($medicalHistory));
        $isLegacyMedicalHistory = hasColumn($db, 'medical_history', 'allergy_medicine');

        if ($isLegacyMedicalHistory) {
            $allergyMedicine = isset($medicalHistory['allergies']['medicine']) ? ($medicalHistory['allergies']['medicine'] ? 1 : 0) : 0;
            $allergyPollens = isset($medicalHistory['allergies']['pollens']) ? ($medicalHistory['allergies']['pollens'] ? 1 : 0) : 0;
            $allergyFood = isset($medicalHistory['allergies']['food']) ? ($medicalHistory['allergies']['food'] ? 1 : 0) : 0;
            $allergyStingingInsects = isset($medicalHistory['allergies']['stinging_insects']) ? ($medicalHistory['allergies']['stinging_insects'] ? 1 : 0) : 0;

            $conditionErrorRefraction = isset($medicalHistory['medical_conditions']['error_refraction']) ? ($medicalHistory['medical_conditions']['error_refraction'] ? 1 : 0) : 0;
            $conditionHeartProblem = isset($medicalHistory['medical_conditions']['heart_problem']) ? ($medicalHistory['medical_conditions']['heart_problem'] ? 1 : 0) : 0;
            $conditionBleedingDisorder = isset($medicalHistory['medical_conditions']['bleeding_disorder']) ? ($medicalHistory['medical_conditions']['bleeding_disorder'] ? 1 : 0) : 0;
            $conditionHernia = isset($medicalHistory['medical_conditions']['hernia']) ? ($medicalHistory['medical_conditions']['hernia'] ? 1 : 0) : 0;
            $conditionAsthma = isset($medicalHistory['medical_conditions']['asthma']) ? ($medicalHistory['medical_conditions']['asthma'] ? 1 : 0) : 0;
            $conditionAnemia = isset($medicalHistory['medical_conditions']['anemia']) ? ($medicalHistory['medical_conditions']['anemia'] ? 1 : 0) : 0;
            $conditionAnxietyDepression = isset($medicalHistory['medical_conditions']['anxiety_depression']) ? ($medicalHistory['medical_conditions']['anxiety_depression'] ? 1 : 0) : 0;
            $conditionSeizure = isset($medicalHistory['medical_conditions']['seizure']) ? ($medicalHistory['medical_conditions']['seizure'] ? 1 : 0) : 0;

            $surgeryHospitalization = isset($medicalHistory['surgery_hospitalization']) ? ($medicalHistory['surgery_hospitalization'] ? 1 : 0) : 0;

            $familyTuberculosis = isset($medicalHistory['family_history']['tuberculosis']) ? ($medicalHistory['family_history']['tuberculosis'] ? 1 : 0) : 0;
            $familyCancer = isset($medicalHistory['family_history']['cancer']) ? ($medicalHistory['family_history']['cancer'] ? 1 : 0) : 0;
            $familyStrokeCardiac = isset($medicalHistory['family_history']['stroke_cardiac']) ? ($medicalHistory['family_history']['stroke_cardiac'] ? 1 : 0) : 0;
            $familyDiabetes = isset($medicalHistory['family_history']['diabetes']) ? ($medicalHistory['family_history']['diabetes'] ? 1 : 0) : 0;
            $familyHypertension = isset($medicalHistory['family_history']['hypertension']) ? ($medicalHistory['family_history']['hypertension'] ? 1 : 0) : 0;
            $familyDepression = isset($medicalHistory['family_history']['depression']) ? ($medicalHistory['family_history']['depression'] ? 1 : 0) : 0;
            $familyThyroid = isset($medicalHistory['family_history']['thyroid']) ? ($medicalHistory['family_history']['thyroid'] ? 1 : 0) : 0;
            $familyPhobia = isset($medicalHistory['family_history']['phobia']) ? ($medicalHistory['family_history']['phobia'] ? 1 : 0) : 0;

            $smokeExposure = isset($medicalHistory['smoke_exposure']) ? ($medicalHistory['smoke_exposure'] ? 1 : 0) : 0;

            $updateQuery = "INSERT INTO medical_history (
                            student_id,
                            allergy_medicine, allergy_pollens, allergy_food, allergy_stinging_insects,
                            condition_error_refraction, condition_heart_problem, condition_bleeding_disorder,
                            condition_hernia, condition_asthma, condition_anemia, condition_anxiety_depression,
                            condition_seizure, surgery_hospitalization,
                            family_tuberculosis, family_cancer, family_stroke_cardiac, family_diabetes,
                            family_hypertension, family_depression, family_thyroid, family_phobia,
                            smoke_exposure
                            ) VALUES (
                            :student_id,
                            :allergy_medicine, :allergy_pollens, :allergy_food, :allergy_stinging_insects,
                            :condition_error_refraction, :condition_heart_problem, :condition_bleeding_disorder,
                            :condition_hernia, :condition_asthma, :condition_anemia, :condition_anxiety_depression,
                            :condition_seizure, :surgery_hospitalization,
                            :family_tuberculosis, :family_cancer, :family_stroke_cardiac, :family_diabetes,
                            :family_hypertension, :family_depression, :family_thyroid, :family_phobia,
                            :smoke_exposure
                            )
                            ON DUPLICATE KEY UPDATE
                            allergy_medicine = VALUES(allergy_medicine),
                            allergy_pollens = VALUES(allergy_pollens),
                            allergy_food = VALUES(allergy_food),
                            allergy_stinging_insects = VALUES(allergy_stinging_insects),
                            condition_error_refraction = VALUES(condition_error_refraction),
                            condition_heart_problem = VALUES(condition_heart_problem),
                            condition_bleeding_disorder = VALUES(condition_bleeding_disorder),
                            condition_hernia = VALUES(condition_hernia),
                            condition_asthma = VALUES(condition_asthma),
                            condition_anemia = VALUES(condition_anemia),
                            condition_anxiety_depression = VALUES(condition_anxiety_depression),
                            condition_seizure = VALUES(condition_seizure),
                            surgery_hospitalization = VALUES(surgery_hospitalization),
                            family_tuberculosis = VALUES(family_tuberculosis),
                            family_cancer = VALUES(family_cancer),
                            family_stroke_cardiac = VALUES(family_stroke_cardiac),
                            family_diabetes = VALUES(family_diabetes),
                            family_hypertension = VALUES(family_hypertension),
                            family_depression = VALUES(family_depression),
                            family_thyroid = VALUES(family_thyroid),
                            family_phobia = VALUES(family_phobia),
                            smoke_exposure = VALUES(smoke_exposure),
                            updated_at = NOW()";

            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->bindParam(':student_id', $student_id);
            $updateStmt->bindParam(':allergy_medicine', $allergyMedicine);
            $updateStmt->bindParam(':allergy_pollens', $allergyPollens);
            $updateStmt->bindParam(':allergy_food', $allergyFood);
            $updateStmt->bindParam(':allergy_stinging_insects', $allergyStingingInsects);
            $updateStmt->bindParam(':condition_error_refraction', $conditionErrorRefraction);
            $updateStmt->bindParam(':condition_heart_problem', $conditionHeartProblem);
            $updateStmt->bindParam(':condition_bleeding_disorder', $conditionBleedingDisorder);
            $updateStmt->bindParam(':condition_hernia', $conditionHernia);
            $updateStmt->bindParam(':condition_asthma', $conditionAsthma);
            $updateStmt->bindParam(':condition_anemia', $conditionAnemia);
            $updateStmt->bindParam(':condition_anxiety_depression', $conditionAnxietyDepression);
            $updateStmt->bindParam(':condition_seizure', $conditionSeizure);
            $updateStmt->bindParam(':surgery_hospitalization', $surgeryHospitalization);
            $updateStmt->bindParam(':family_tuberculosis', $familyTuberculosis);
            $updateStmt->bindParam(':family_cancer', $familyCancer);
            $updateStmt->bindParam(':family_stroke_cardiac', $familyStrokeCardiac);
            $updateStmt->bindParam(':family_diabetes', $familyDiabetes);
            $updateStmt->bindParam(':family_hypertension', $familyHypertension);
            $updateStmt->bindParam(':family_depression', $familyDepression);
            $updateStmt->bindParam(':family_thyroid', $familyThyroid);
            $updateStmt->bindParam(':family_phobia', $familyPhobia);
            $updateStmt->bindParam(':smoke_exposure', $smokeExposure);
        } else {
            $conditionAsthma = isset($medicalHistory['medical_conditions']['asthma']) ? ($medicalHistory['medical_conditions']['asthma'] ? 1 : 0) : 0;
            $conditionDiabetes = isset($medicalHistory['family_history']['diabetes']) ? ($medicalHistory['family_history']['diabetes'] ? 1 : 0) : 0;
            $conditionHeartProblem = isset($medicalHistory['medical_conditions']['heart_problem']) ? ($medicalHistory['medical_conditions']['heart_problem'] ? 1 : 0) : 0;
            $conditionHypertension = isset($medicalHistory['family_history']['hypertension']) ? ($medicalHistory['family_history']['hypertension'] ? 1 : 0) : 0;
            $conditionSeizureDisorder = isset($medicalHistory['medical_conditions']['seizure']) ? ($medicalHistory['medical_conditions']['seizure'] ? 1 : 0) : 0;
            $conditionBleedingDisorder = isset($medicalHistory['medical_conditions']['bleeding_disorder']) ? ($medicalHistory['medical_conditions']['bleeding_disorder'] ? 1 : 0) : 0;
            $conditionKidneyDisease = 0;
            $conditionMentalHealth = isset($medicalHistory['medical_conditions']['anxiety_depression']) ? ($medicalHistory['medical_conditions']['anxiety_depression'] ? 1 : 0) : 0;

            $otherConditions = [];
            if (!empty($medicalHistory['medical_conditions']['error_refraction'])) $otherConditions[] = 'Error of refraction';
            if (!empty($medicalHistory['medical_conditions']['hernia'])) $otherConditions[] = 'Hernia';
            if (!empty($medicalHistory['medical_conditions']['anemia'])) $otherConditions[] = 'Anemia';
            if (!empty($medicalHistory['surgery_hospitalization'])) $otherConditions[] = 'Surgery/Hospitalization history';

            $familyHistoryText = [];
            if (!empty($medicalHistory['family_history']['tuberculosis'])) $familyHistoryText[] = 'Tuberculosis';
            if (!empty($medicalHistory['family_history']['cancer'])) $familyHistoryText[] = 'Cancer';
            if (!empty($medicalHistory['family_history']['stroke_cardiac'])) $familyHistoryText[] = 'Stroke/Cardiac';
            if (!empty($medicalHistory['family_history']['depression'])) $familyHistoryText[] = 'Depression';
            if (!empty($medicalHistory['family_history']['thyroid'])) $familyHistoryText[] = 'Thyroid';
            if (!empty($medicalHistory['family_history']['phobia'])) $familyHistoryText[] = 'Phobia';

            $allergyNotes = [];
            if (!empty($medicalHistory['allergies']['medicine'])) $allergyNotes[] = 'Medicine allergy';
            if (!empty($medicalHistory['allergies']['pollens'])) $allergyNotes[] = 'Pollen allergy';
            if (!empty($medicalHistory['allergies']['food'])) $allergyNotes[] = 'Food allergy';
            if (!empty($medicalHistory['allergies']['stinging_insects'])) $allergyNotes[] = 'Stinging insects allergy';

            $notes = [];
            if (!empty($medicalHistory['smoke_exposure'])) $notes[] = 'Smoke exposure';
            if (!empty($allergyNotes)) $notes[] = implode(', ', $allergyNotes);

            $updateQuery = "INSERT INTO medical_history (
                            student_id,
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
                        ) VALUES (
                            :student_id,
                            :condition_asthma,
                            :condition_diabetes,
                            :condition_heart_problem,
                            :condition_hypertension,
                            :condition_seizure_disorder,
                            :condition_bleeding_disorder,
                            :condition_kidney_disease,
                            :condition_mental_health,
                            :other_conditions,
                            :current_medications,
                            :family_medical_history,
                            :notes
                        )
                        ON DUPLICATE KEY UPDATE
                            condition_asthma = VALUES(condition_asthma),
                            condition_diabetes = VALUES(condition_diabetes),
                            condition_heart_problem = VALUES(condition_heart_problem),
                            condition_hypertension = VALUES(condition_hypertension),
                            condition_seizure_disorder = VALUES(condition_seizure_disorder),
                            condition_bleeding_disorder = VALUES(condition_bleeding_disorder),
                            condition_kidney_disease = VALUES(condition_kidney_disease),
                            condition_mental_health = VALUES(condition_mental_health),
                            other_conditions = VALUES(other_conditions),
                            current_medications = VALUES(current_medications),
                            family_medical_history = VALUES(family_medical_history),
                            notes = VALUES(notes),
                            updated_at = NOW()";

            $updateStmt = $db->prepare($updateQuery);
            $currentMedications = null;
            $otherConditionsText = empty($otherConditions) ? null : implode('; ', $otherConditions);
            $familyHistory = empty($familyHistoryText) ? null : implode(', ', $familyHistoryText);
            $notesText = empty($notes) ? null : implode('; ', $notes);

            $updateStmt->bindParam(':student_id', $student_id);
            $updateStmt->bindParam(':condition_asthma', $conditionAsthma);
            $updateStmt->bindParam(':condition_diabetes', $conditionDiabetes);
            $updateStmt->bindParam(':condition_heart_problem', $conditionHeartProblem);
            $updateStmt->bindParam(':condition_hypertension', $conditionHypertension);
            $updateStmt->bindParam(':condition_seizure_disorder', $conditionSeizureDisorder);
            $updateStmt->bindParam(':condition_bleeding_disorder', $conditionBleedingDisorder);
            $updateStmt->bindParam(':condition_kidney_disease', $conditionKidneyDisease);
            $updateStmt->bindParam(':condition_mental_health', $conditionMentalHealth);
            $updateStmt->bindParam(':other_conditions', $otherConditionsText);
            $updateStmt->bindParam(':current_medications', $currentMedications);
            $updateStmt->bindParam(':family_medical_history', $familyHistory);
            $updateStmt->bindParam(':notes', $notesText);
        }

        if ($updateStmt->execute()) {
            error_log("✅ Medical history updated successfully");
            $auth->logActivity('Update Medical History', 'Updated medical history for student ID: ' . $student_id);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Medical history updated successfully'
            ]);
        } else {
            error_log("❌ Failed to update medical history");
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update medical history'
            ]);
        }
    } else {
        error_log("❌ No medical_history data provided");
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'No medical history data provided'
        ]);
    }
    
} catch (Exception $e) {
    error_log("❌ Exception: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error updating medical information: ' . $e->getMessage()
    ]);
}
?>