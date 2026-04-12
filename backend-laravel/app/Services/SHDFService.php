<?php

namespace App\Services;

use App\Models\MedicalHistory;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\StudentFamilyHistory;
use App\Models\StudentImmunization;
use App\Models\StudentParentalConsent;
use App\Models\StudentPhilhealth;
use App\Models\StudentSHDFStatus;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SHDFService
{
    /**
     * Submit basic info (Stage 1) - Required for QR code
     */
    public function submitBasicInfo(array $validated): array
    {
        return DB::transaction(function () use ($validated) {
            $studentId = $validated['student_id'];
            $schoolYear = SchoolYear::where('is_current', true)->firstOrFail();

            // Update student basic info
            $updateData = [
                'parent_guardian_name' => $validated['parent_guardian_name'],
                'emergency_contact' => $validated['emergency_contact'],
                'emergency_contact_relation' => $validated['emergency_contact_relation'],
                'emergency_contact_phone' => $validated['emergency_contact_phone'],
                'height_cm' => $validated['height_cm'] ?? null,
                'weight_kg' => $validated['weight_kg'] ?? null,
                'blood_type' => $validated['blood_type'] ?? null,
            ];
            
            // Only add emergency_contact_relation_other if column exists
            if (Schema::hasColumn('students', 'emergency_contact_relation_other')) {
                $updateData['emergency_contact_relation_other'] = $validated['emergency_contact_relation_other'] ?? null;
            }
            
            Student::where('student_id', $studentId)->update($updateData);

            // Calculate BMI if height and weight provided
            if (isset($validated['height_cm']) && isset($validated['weight_kg'])) {
                $student = Student::where('student_id', $studentId)->first();
                $bmi = $student->calculateBmi();
                $student->update(['bmi' => $bmi]);
            }

            // Update or create SHDF status
            $status = StudentSHDFStatus::updateOrCreate(
                [
                    'student_id' => $studentId,
                    'school_year_id' => $schoolYear->id,
                ],
                [
                    'basic_completed' => true,
                    'basic_completed_at' => now(),
                    'comprehensive_deadline' => now()->addDays(7), // 7 days to complete
                ]
            );

            // Generate QR code if it doesn't exist and table exists
            if (Schema::hasTable('qr_codes')) {
                $qrExists = DB::table('qr_codes')->where('student_id', $studentId)->exists();
                if (!$qrExists) {
                    DB::table('qr_codes')->insert([
                        'student_id' => $studentId,
                        'qr_token' => \Illuminate\Support\Str::uuid()->toString(),
                        'qr_generated_at' => now(),
                        'qr_expires_at' => null,
                    ]);
                }
            }

            return [
                'success' => true,
                'message' => 'Basic information saved successfully. You can now generate your QR code.',
                'status' => $status,
                'can_generate_qr' => true,
                'comprehensive_deadline' => $status->comprehensive_deadline,
            ];
        });
    }

    /**
     * Submit comprehensive info (Stage 2) - Full SHDF
     */
    public function submitComprehensive(array $validated, ?UploadedFile $signature): array
    {
        return DB::transaction(function () use ($validated, $signature) {
            $studentId = $validated['student_id'];
            $schoolYear = SchoolYear::where('is_current', true)->firstOrFail();
            $schoolYearId = $schoolYear->id;

            // Check if basic info is completed
            $status = StudentSHDFStatus::where('student_id', $studentId)
                ->where('school_year_id', $schoolYearId)
                ->first();

            if (!$status || !$status->basic_completed) {
                throw new \Exception('Please complete basic information first.');
            }

            // Update PhilHealth
            StudentPhilhealth::updateOrCreate(
                ['student_id' => $studentId],
                [
                    'learner_philhealth_id' => $validated['learner_philhealth_id'] ?? null,
                    'parent_philhealth_id' => $validated['parent_philhealth_id'] ?? null,
                    'parent_philhealth_name' => $validated['parent_philhealth_name'] ?? null,
                    'parent_relationship' => $validated['parent_relationship'] ?? null,
                ]
            );

            // Update Immunizations
            StudentImmunization::updateOrCreate(
                ['student_id' => $studentId],
                array_merge(['student_id' => $studentId], $validated['immunizations'] ?? [])
            );

            // Update Medical history
            MedicalHistory::updateOrCreate(
                ['student_id' => $studentId],
                [
                    'menarche_age' => $validated['menarche_age'] ?? null,
                    'menarche_age_other' => $validated['menarche_age_other'] ?? null,
                    'allergy_status' => $validated['allergy_status'] ?? null,
                    'condition_error_of_refraction' => $validated['condition_error_of_refraction'] ?? false,
                    'condition_asthma' => $validated['condition_asthma'] ?? false,
                    'condition_seizure_disorder' => $validated['condition_seizure_disorder'] ?? false,
                    'condition_heart_problem' => $validated['condition_heart_problem'] ?? false,
                    'condition_anemia' => $validated['condition_anemia'] ?? false,
                    'condition_bleeding_disorder' => $validated['condition_bleeding_disorder'] ?? false,
                    'condition_diabetes' => $validated['condition_diabetes'] ?? false,
                    'condition_gastric_ulcer' => $validated['condition_gastric_ulcer'] ?? false,
                    'condition_anxiety_depression' => $validated['condition_anxiety_depression'] ?? false,
                    'condition_g6pd' => $validated['condition_g6pd'] ?? false,
                    'condition_none' => $validated['condition_none'] ?? false,
                    'condition_other_text' => $validated['condition_other_text'] ?? null,
                    'medications_paracetamol' => $validated['medications_paracetamol'] ?? false,
                    'medications_mefenamic' => $validated['medications_mefenamic'] ?? false,
                    'medications_anti_allergy' => $validated['medications_anti_allergy'] ?? false,
                    'medications_anti_asthma' => $validated['medications_anti_asthma'] ?? false,
                    'medications_loperamide' => $validated['medications_loperamide'] ?? false,
                    'medications_antacids' => $validated['medications_antacids'] ?? false,
                    'medications_or_solution' => $validated['medications_or_solution'] ?? false,
                    'medications_none' => $validated['medications_none'] ?? false,
                    'medications_other_text' => $validated['medications_other_text'] ?? null,
                    'pwd_status' => $validated['pwd_status'] ?? null,
                    'pwd_congenital_detail' => $validated['pwd_congenital_detail'] ?? null,
                    'surgery_history' => $validated['surgery_history'] ?? false,
                ]
            );

            // Update Family history
            $family = $validated['family'] ?? [];
            StudentFamilyHistory::updateOrCreate(
                ['student_id' => $studentId],
                array_merge(['student_id' => $studentId], $family)
            );

            // Update Parental consent + signature
            $existing = StudentParentalConsent::where('student_id', $studentId)
                ->where('school_year_id', $schoolYearId)
                ->first();

            if ($existing && $existing->signature_file_path) {
                Storage::disk('signatures')->delete($existing->signature_file_path);
            }

            $ext = $signature->getClientOriginalExtension();
            $path = $signature->storeAs(
                "signatures/{$studentId}/{$schoolYearId}",
                Str::uuid() . '.' . $ext,
                'signatures'
            );

            StudentParentalConsent::updateOrCreate(
                ['student_id' => $studentId, 'school_year_id' => $schoolYearId],
                [
                    'information_certified' => true,
                    'deworming_consent' => $validated['deworming_consent'],
                    'deworming_refusal_reason' => $validated['deworming_refusal_reason'] ?? null,
                    'deworming_refusal_other' => $validated['deworming_refusal_other'] ?? null,
                    'mrtd_consent' => $validated['mrtd_consent'] ?? 'not_applicable',
                    'wifa_consent' => $validated['wifa_consent'] ?? 'not_applicable',
                    'signature_file_path' => $path,
                    'signature_file_type' => $ext,
                    'submitted_at' => now(),
                ]
            );

            // Update status to comprehensive completed
            $status->update([
                'comprehensive_completed' => true,
                'comprehensive_completed_at' => now(),
            ]);

            return [
                'success' => true,
                'message' => 'SHDF form completed successfully. You are now fully compliant.',
                'status' => $status,
                'is_fully_compliant' => true,
            ];
        });
    }

    /**
     * Create or update the full SHDF record (legacy method - combines both stages)
     */
    public function upsert(array $validated, ?UploadedFile $signature): array
    {
        return DB::transaction(function () use ($validated, $signature) {
            $studentId   = $validated['student_id'];
            $schoolYear  = SchoolYear::where('is_current', true)->firstOrFail();
            $schoolYearId = $schoolYear->id;

            // 1. Update student parent/guardian name
            $updateData = [
                'parent_guardian_name'       => $validated['parent_guardian_name'],
                'emergency_contact'          => $validated['emergency_contact'],
                'emergency_contact_relation' => $validated['emergency_contact_relation'],
                'emergency_contact_phone'    => $validated['emergency_contact_phone'],
            ];
            
            // Only add emergency_contact_relation_other if column exists
            if (Schema::hasColumn('students', 'emergency_contact_relation_other')) {
                $updateData['emergency_contact_relation_other'] = $validated['emergency_contact_relation_other'] ?? null;
            }
            
            Student::where('student_id', $studentId)->update($updateData);

            // 2. PhilHealth
            StudentPhilhealth::updateOrCreate(
                ['student_id' => $studentId],
                [
                    'learner_philhealth_id'  => $validated['learner_philhealth_id'] ?? null,
                    'parent_philhealth_id'   => $validated['parent_philhealth_id'] ?? null,
                    'parent_philhealth_name' => $validated['parent_philhealth_name'] ?? null,
                    'parent_relationship'    => $validated['parent_relationship'] ?? null,
                ]
            );

            // 3. Immunizations
            StudentImmunization::updateOrCreate(
                ['student_id' => $studentId],
                array_merge(['student_id' => $studentId], $validated['immunizations'] ?? [])
            );

            // 4. Medical history (additive columns only)
            MedicalHistory::updateOrCreate(
                ['student_id' => $studentId],
                [
                    'menarche_age'                  => $validated['menarche_age'] ?? null,
                    'menarche_age_other'             => $validated['menarche_age_other'] ?? null,
                    'allergy_status'                 => $validated['allergy_status'] ?? null,
                    'condition_error_of_refraction'  => $validated['condition_error_of_refraction'] ?? false,
                    'condition_asthma'               => $validated['condition_asthma'] ?? false,
                    'condition_seizure_disorder'     => $validated['condition_seizure_disorder'] ?? false,
                    'condition_heart_problem'        => $validated['condition_heart_problem'] ?? false,
                    'condition_anemia'               => $validated['condition_anemia'] ?? false,
                    'condition_bleeding_disorder'    => $validated['condition_bleeding_disorder'] ?? false,
                    'condition_diabetes'             => $validated['condition_diabetes'] ?? false,
                    'condition_gastric_ulcer'        => $validated['condition_gastric_ulcer'] ?? false,
                    'condition_anxiety_depression'   => $validated['condition_anxiety_depression'] ?? false,
                    'condition_g6pd'                 => $validated['condition_g6pd'] ?? false,
                    'condition_none'                 => $validated['condition_none'] ?? false,
                    'condition_other_text'           => $validated['condition_other_text'] ?? null,
                    'medications_paracetamol'        => $validated['medications_paracetamol'] ?? false,
                    'medications_mefenamic'          => $validated['medications_mefenamic'] ?? false,
                    'medications_anti_allergy'       => $validated['medications_anti_allergy'] ?? false,
                    'medications_anti_asthma'        => $validated['medications_anti_asthma'] ?? false,
                    'medications_loperamide'         => $validated['medications_loperamide'] ?? false,
                    'medications_antacids'           => $validated['medications_antacids'] ?? false,
                    'medications_or_solution'        => $validated['medications_or_solution'] ?? false,
                    'medications_none'               => $validated['medications_none'] ?? false,
                    'medications_other_text'         => $validated['medications_other_text'] ?? null,
                    'pwd_status'                     => $validated['pwd_status'] ?? null,
                    'pwd_congenital_detail'          => $validated['pwd_congenital_detail'] ?? null,
                    'surgery_history'                => $validated['surgery_history'] ?? false,
                ]
            );

            // 5. Family history
            $family = $validated['family'] ?? [];
            StudentFamilyHistory::updateOrCreate(
                ['student_id' => $studentId],
                array_merge(['student_id' => $studentId], $family)
            );

            // 6. Parental consent + signature file
            $existing = StudentParentalConsent::where('student_id', $studentId)
                ->where('school_year_id', $schoolYearId)
                ->first();

            // Delete old signature if updating
            if ($existing && $existing->signature_file_path) {
                Storage::disk('signatures')->delete($existing->signature_file_path);
            }

            // Store new signature
            $ext  = $signature->getClientOriginalExtension();
            $path = $signature->storeAs(
                "signatures/{$studentId}/{$schoolYearId}",
                Str::uuid() . '.' . $ext,
                'signatures'
            );

            StudentParentalConsent::updateOrCreate(
                ['student_id' => $studentId, 'school_year_id' => $schoolYearId],
                [
                    'information_certified'    => true,
                    'deworming_consent'        => $validated['deworming_consent'],
                    'deworming_refusal_reason' => $validated['deworming_refusal_reason'] ?? null,
                    'deworming_refusal_other'  => $validated['deworming_refusal_other'] ?? null,
                    'mrtd_consent'             => $validated['mrtd_consent'] ?? 'not_applicable',
                    'wifa_consent'             => $validated['wifa_consent'] ?? 'not_applicable',
                    'signature_file_path'      => $path,
                    'signature_file_type'      => $ext,
                    'submitted_at'             => now(),
                ]
            );

            // Update SHDF status - mark both stages as complete
            StudentSHDFStatus::updateOrCreate(
                ['student_id' => $studentId, 'school_year_id' => $schoolYearId],
                [
                    'basic_completed' => true,
                    'basic_completed_at' => now(),
                    'comprehensive_completed' => true,
                    'comprehensive_completed_at' => now(),
                ]
            );

            return $this->getRecord($studentId, $schoolYearId);
        });
    }

    /**
     * Fetch the composite SHDF record for a student and school year.
     */
    public function getRecord(int $studentId, int $schoolYearId): array
    {
        $student = Student::with([
            'philhealth',
            'immunization',
            'medicalHistory',
            'familyHistory',
        ])->where('student_id', $studentId)->firstOrFail();

        $consent = StudentParentalConsent::where('student_id', $studentId)
            ->where('school_year_id', $schoolYearId)
            ->first();

        $status = StudentSHDFStatus::where('student_id', $studentId)
            ->where('school_year_id', $schoolYearId)
            ->first();

        return [
            'student'         => $student,
            'philhealth'      => $student->philhealth,
            'immunization'    => $student->immunization,
            'medical_history' => $student->medicalHistory,
            'family_history'  => $student->familyHistory,
            'parental_consent' => $consent,
            'status'          => $status,
            'can_generate_qr' => $status ? $status->canGenerateQRCode() : false,
            'is_fully_compliant' => $status ? $status->isFullyCompliant() : false,
        ];
    }

    /**
     * Get SHDF completion status for a student
     */
    public function getStatus(int $studentId): array
    {
        $schoolYear = SchoolYear::where('is_current', true)->first();

        if (!$schoolYear) {
            \Log::warning('[SHDF Status] No current school year found for student: ' . $studentId);
            return [
                'basic_completed' => false,
                'comprehensive_completed' => false,
                'can_generate_qr' => false,
                'is_fully_compliant' => false,
            ];
        }

        $status = StudentSHDFStatus::where('student_id', $studentId)
            ->where('school_year_id', $schoolYear->id)
            ->first();

        if (!$status) {
            \Log::info('[SHDF Status] No status record found for student: ' . $studentId . ' in school year: ' . $schoolYear->id);
            return [
                'basic_completed' => false,
                'comprehensive_completed' => false,
                'can_generate_qr' => false,
                'is_fully_compliant' => false,
                'comprehensive_deadline' => null,
                'is_overdue' => false,
            ];
        }

        \Log::info('[SHDF Status] Found status for student: ' . $studentId . ' | basic_completed: ' . ($status->basic_completed ? 'true' : 'false') . ' | comprehensive_completed: ' . ($status->comprehensive_completed ? 'true' : 'false'));

        return [
            'basic_completed' => $status->basic_completed,
            'comprehensive_completed' => $status->comprehensive_completed,
            'can_generate_qr' => $status->canGenerateQRCode(),
            'is_fully_compliant' => $status->isFullyCompliant(),
            'comprehensive_deadline' => $status->comprehensive_deadline,
            'is_overdue' => $status->isOverdue(),
            'is_deadline_approaching' => $status->isDeadlineApproaching(),
        ];
    }
}
