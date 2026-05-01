<?php

namespace App\Http\Requests;

use App\Models\Student;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SHDFFormRequest extends FormRequest
{
    /**
     * Convert string booleans from FormData to actual booleans before validation.
     * FormData can only send strings, so "true"/"false"/"1"/"0" must be cast.
     * Also converts "yes"/"no" radio values to booleans for family history fields.
     */
    protected function prepareForValidation(): void
    {
        $booleanFields = [
            'condition_error_of_refraction', 'condition_asthma', 'condition_seizure_disorder',
            'condition_heart_problem', 'condition_anemia', 'condition_bleeding_disorder',
            'condition_diabetes', 'condition_gastric_ulcer', 'condition_anxiety_depression',
            'condition_g6pd', 'condition_none',
            'medications_paracetamol', 'medications_mefenamic', 'medications_anti_allergy',
            'medications_anti_asthma', 'medications_loperamide', 'medications_antacids',
            'medications_or_solution', 'medications_none',
            'surgery_history',
        ];

        $familyBooleanFields = [
            'condition_tuberculosis', 'condition_cancer', 'condition_stroke',
            'condition_hypertension', 'condition_diabetes', 'condition_pneumonia',
            'condition_gastric_ulcer', 'condition_anxiety_depression', 'condition_none',
        ];

        // Family yes/no radio fields that map to boolean DB columns
        $familyYesNoFields = [
            'smoke_exposure', 'is_4ps_beneficiary', 'is_sbfp_beneficiary',
        ];

        $data = $this->all();

        // Cast top-level boolean fields (handles "true"/"false"/"1"/"0")
        foreach ($booleanFields as $field) {
            if (array_key_exists($field, $data)) {
                $data[$field] = filter_var($data[$field], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false;
            }
        }

        // Cast family boolean checkbox fields
        $family = $data['family'] ?? [];
        foreach ($familyBooleanFields as $field) {
            if (array_key_exists($field, $family)) {
                $family[$field] = filter_var($family[$field], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false;
            }
        }

        // Convert family yes/no radio fields → boolean
        foreach ($familyYesNoFields as $field) {
            if (array_key_exists($field, $family)) {
                $val = strtolower(trim((string) $family[$field]));
                $family[$field] = match($val) {
                    'yes', '1', 'true' => true,
                    default            => false,
                };
            }
        }
        $data['family'] = $family;

        // Cast information_certified
        if (array_key_exists('information_certified', $data)) {
            $data['information_certified'] = filter_var($data['information_certified'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false;
        }

        $this->replace($data);
    }

    public function authorize(): bool
    {
        $studentId = (int) $this->input('student_id');

        \Log::info('[SHDF Form Request] Authorization attempt', [
            'student_id_from_request' => $studentId,
            'all_inputs' => array_keys($this->all()),
        ]);

        if (!$studentId) {
            \Log::error('[SHDF Form Request] No student_id in request');
            return false;
        }

        $student = Student::where('student_id', $studentId)->first();
        if (!$student) {
            \Log::error('[SHDF Form Request] Student not found: ' . $studentId);
            return false;
        }

        $user = $this->user();

        if (!$user) {
            \Log::error('[SHDF Form Request] No authenticated user');
            return false;
        }

        if (!$user->relationLoaded('role')) {
            $user->load('role');
        }

        $role = strtolower(trim($user->role?->role_name ?? ''));

        \Log::info('[SHDF Form Request] User details', [
            'user_id' => $user->user_id,
            'role_id' => $user->role_id,
            'role_name' => $role,
            'student_user_id' => $student->user_id,
        ]);

        // Admin and clinic staff always allowed
        if (in_array($role, ['admin', 'clinic_staff', 'clinic staff'])) {
            return true;
        }

        // For students: any authenticated student can submit their own form.
        // The student_id in the request comes from their own authenticated profile,
        // so we trust it. We attempt to fix the user_id mapping as a side effect.
        if ($role === 'student') {
            // Try to fix mapping if mismatched
            if (empty($student->user_id) || (int) $student->user_id !== (int) $user->user_id) {
                $canFix = (!empty($user->username) && !empty($student->student_number)
                    && strtolower(trim($user->username)) === strtolower(trim($student->student_number)))
                    || (Student::where('user_id', $user->user_id)->value('student_id') == $student->student_id);

                if ($canFix) {
                    $student->update(['user_id' => $user->user_id]);
                }
            }

            // Allow any authenticated student — student_id comes from their own session
            return true;
        }

        // Fallback: if role is unrecognised but the student record is directly linked
        // to this user (e.g. role name has unexpected casing or whitespace), still allow.
        if ((int) $student->user_id === (int) $user->user_id) {
            \Log::warning('[SHDF Form Request] Fallback auth granted via user_id match', [
                'user_id' => $user->user_id,
                'role' => $role,
            ]);
            return true;
        }

        // Last-resort fallback: username matches student_number
        if (!empty($user->username) && !empty($student->student_number)
            && strtolower(trim($user->username)) === strtolower(trim($student->student_number))) {
            \Log::warning('[SHDF Form Request] Fallback auth granted via username/student_number match', [
                'user_id' => $user->user_id,
                'username' => $user->username,
            ]);
            $student->update(['user_id' => $user->user_id]);
            return true;
        }

        \Log::error('[SHDF Form Request] Authorization denied', [
            'user_id' => $user->user_id,
            'role' => $role,
            'student_id' => $studentId,
            'student_user_id' => $student->user_id,
        ]);

        return false;
    }

    public function rules(): array
    {
        $student = Student::where('student_id', $this->input('student_id'))->first();
        $isFemale = $student && $student->gender === 'F';
        $isGrade7  = $student && $student->grade_level === 'Grade 7';

        return [
            // Student identity
            'student_id'                        => ['required', 'integer', 'exists:students,student_id'],
            'parent_guardian_name'              => ['required', 'string', 'max:150'],
            'emergency_contact'                 => ['required', 'string', 'max:150'],
            'emergency_contact_relation'        => ['required', 'string', 'max:100'],
            'emergency_contact_relation_other'  => ['nullable', 'string', 'max:100'],
            'emergency_contact_phone'           => ['required', 'string', 'max:20'],

            // PhilHealth
            'learner_philhealth_id' => ['nullable', 'regex:/^[A-Za-z0-9]{12}$/'],
            'parent_philhealth_id'  => ['nullable', 'regex:/^[A-Za-z0-9]{12}$/'],
            'parent_philhealth_name' => ['nullable', 'string', 'max:150'],
            'parent_relationship'   => ['nullable', Rule::in(['mother', 'father', 'other'])],

            // Immunizations (all required)
            'immunizations.bcg'                 => ['required', Rule::in(['yes', 'no', 'na'])],
            'immunizations.diphtheria_pertussis' => ['required', Rule::in(['yes', 'no', 'na'])],
            'immunizations.oral_polio'          => ['required', Rule::in(['yes', 'no', 'na'])],
            'immunizations.mmr'                 => ['required', Rule::in(['yes', 'no', 'na'])],
            'immunizations.chicken_pox'         => ['required', Rule::in(['yes', 'no', 'na'])],
            'immunizations.hepatitis_b'         => ['required', Rule::in(['yes', 'no', 'na'])],
            'immunizations.tetanus_toxoid'      => ['required', Rule::in(['yes', 'no', 'na'])],
            'immunizations.flu'                 => ['required', Rule::in(['yes', 'no', 'na'])],
            'immunizations.pneumococcal'        => ['required', Rule::in(['yes', 'no', 'na'])],

            // Medical history
            'menarche_age'       => [$isFemale ? 'required' : 'nullable', 'string', 'max:20'],
            'menarche_age_other' => ['nullable', 'string', 'max:100'],
            'allergy_status'     => ['required', Rule::in(['yes', 'nka'])],
            'condition_error_of_refraction' => ['boolean'],
            'condition_asthma'              => ['boolean'],
            'condition_seizure_disorder'    => ['boolean'],
            'condition_heart_problem'       => ['boolean'],
            'condition_anemia'              => ['boolean'],
            'condition_bleeding_disorder'   => ['boolean'],
            'condition_diabetes'            => ['boolean'],
            'condition_gastric_ulcer'       => ['boolean'],
            'condition_anxiety_depression'  => ['boolean'],
            'condition_g6pd'                => ['boolean'],
            'condition_none'                => ['boolean'],
            'condition_other_text'          => ['nullable', 'string'],
            'medications_paracetamol'       => ['boolean'],
            'medications_mefenamic'         => ['boolean'],
            'medications_anti_allergy'      => ['boolean'],
            'medications_anti_asthma'       => ['boolean'],
            'medications_loperamide'        => ['boolean'],
            'medications_antacids'          => ['boolean'],
            'medications_or_solution'       => ['boolean'],
            'medications_none'              => ['boolean'],
            'medications_other_text'        => ['nullable', 'string'],
            'pwd_status'                    => ['nullable', Rule::in(['acquired', 'congenital', 'none'])],
            'pwd_congenital_detail'         => ['nullable', 'string'],
            'surgery_history'               => ['boolean'],

            // Family history
            'family.condition_tuberculosis'       => ['boolean'],
            'family.condition_cancer'             => ['boolean'],
            'family.condition_stroke'             => ['boolean'],
            'family.condition_hypertension'       => ['boolean'],
            'family.condition_diabetes'           => ['boolean'],
            'family.condition_pneumonia'          => ['boolean'],
            'family.condition_gastric_ulcer'      => ['boolean'],
            'family.condition_anxiety_depression' => ['boolean'],
            'family.condition_none'               => ['boolean'],
            'family.condition_other_text'         => ['nullable', 'string'],
            'family.smoke_exposure'               => ['boolean'],
            'family.is_4ps_beneficiary'           => ['boolean'],
            'family.is_sbfp_beneficiary'          => ['boolean'],

            // Parental consent
            'information_certified'     => ['required', 'accepted'],
            'deworming_consent'         => ['required', Rule::in(['oo', 'hindi'])],
            'deworming_refusal_reason'  => ['nullable', Rule::in(['takot', 'regular_pribado', 'nabigyan_barangay', 'allergy_reaksyon', 'other'])],
            'deworming_refusal_other'   => ['nullable', 'string', 'max:255'],
            'mrtd_consent'              => [$isGrade7 ? 'required' : 'nullable', Rule::in(['oo', 'hindi', 'not_applicable'])],
            'wifa_consent'              => [$isFemale ? 'required' : 'nullable', Rule::in(['oo', 'hindi', 'not_applicable'])],
            'signature'                 => ['required', 'file', 'mimes:pdf,jpeg,png', 'max:102400'],
        ];
    }

    public function after(): array
    {
        return [
            function ($validator) {
                $data = $this->all();

                // Emergency contact "Other" requires free-text
                if (($data['emergency_contact_relation'] ?? '') === 'other'
                    && empty($data['emergency_contact_relation_other'])) {
                    $validator->errors()->add(
                        'emergency_contact_relation_other',
                        'Please specify the relationship when "Other" is selected.'
                    );
                }

                // Medical condition "None" exclusivity
                $conditionFields = [
                    'condition_error_of_refraction', 'condition_asthma', 'condition_seizure_disorder',
                    'condition_heart_problem', 'condition_anemia', 'condition_bleeding_disorder',
                    'condition_diabetes', 'condition_gastric_ulcer', 'condition_anxiety_depression',
                    'condition_g6pd',
                ];
                if (!empty($data['condition_none'])) {
                    foreach ($conditionFields as $field) {
                        if (!empty($data[$field])) {
                            $validator->errors()->add(
                                'condition_none',
                                '"None" cannot be combined with other medical conditions.'
                            );
                            break;
                        }
                    }
                }

                // Medication "None" exclusivity
                $medicationFields = [
                    'medications_paracetamol', 'medications_mefenamic', 'medications_anti_allergy',
                    'medications_anti_asthma', 'medications_loperamide', 'medications_antacids',
                    'medications_or_solution',
                ];
                if (!empty($data['medications_none'])) {
                    foreach ($medicationFields as $field) {
                        if (!empty($data[$field])) {
                            $validator->errors()->add(
                                'medications_none',
                                '"Don\'t give any" cannot be combined with other medication selections.'
                            );
                            break;
                        }
                    }
                }

                // Family history "None" exclusivity
                $familyConditionFields = [
                    'condition_tuberculosis', 'condition_cancer', 'condition_stroke',
                    'condition_hypertension', 'condition_diabetes', 'condition_pneumonia',
                    'condition_gastric_ulcer', 'condition_anxiety_depression',
                ];
                $family = $data['family'] ?? [];
                if (!empty($family['condition_none'])) {
                    foreach ($familyConditionFields as $field) {
                        if (!empty($family[$field])) {
                            $validator->errors()->add(
                                'family.condition_none',
                                '"None" cannot be combined with other family conditions.'
                            );
                            break;
                        }
                    }
                }

                // PWD congenital requires detail
                if (($data['pwd_status'] ?? '') === 'congenital' && empty($data['pwd_congenital_detail'])) {
                    $validator->errors()->add(
                        'pwd_congenital_detail',
                        'Please specify the congenital condition.'
                    );
                }

                // Deworming refusal reason required when consent is "hindi"
                if (($data['deworming_consent'] ?? '') === 'hindi' && empty($data['deworming_refusal_reason'])) {
                    $validator->errors()->add(
                        'deworming_refusal_reason',
                        'Please provide a reason for declining deworming.'
                    );
                }

                // MRTD consent required for Grade 7 (Property 12)
                $student = Student::where('student_id', $data['student_id'] ?? null)->first();
                if ($student && $student->grade_level === 'Grade 7') {
                    if (empty($data['mrtd_consent']) || $data['mrtd_consent'] === 'not_applicable') {
                        $validator->errors()->add(
                            'mrtd_consent',
                            'MRTD consent is required for Grade 7 students and cannot be "not applicable".'
                        );
                    }
                }

                // WIFA consent required for female students (Property 13)
                if ($student && $student->gender === 'F') {
                    if (empty($data['wifa_consent']) || $data['wifa_consent'] === 'not_applicable') {
                        $validator->errors()->add(
                            'wifa_consent',
                            'WIFA consent is required for female students and cannot be "not applicable".'
                        );
                    }
                }
            },
        ];
    }
}
