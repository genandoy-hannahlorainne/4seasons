<?php

namespace Tests\Feature\SHDF;

use App\Models\ClinicStaff;
use App\Models\Role;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\StudentParentalConsent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Property-based tests for SHDF feature.
 * Each test runs multiple iterations with randomized data.
 */
class SHDFPropertyTest extends TestCase
{
    use RefreshDatabase;

    private const ITERATIONS = 10;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
        Storage::fake('signatures');

        // Create current school year
        SchoolYear::factory()->create(['is_current' => true]);
    }

    /**
     * Property 1: Required field rejection
     * Validates: Requirements 1.3, 1.4, 1.5, 6.1, 6.10
     * Note: student_id is excluded because unsetting it causes 403 (authorization failure)
     * before validation runs. student_id validation is tested elsewhere.
     */
    public function test_property_required_field_rejection(): void
    {
        $requiredFields = [
            'parent_guardian_name',
            'emergency_contact',
            'emergency_contact_relation',
            'emergency_contact_phone',
            'immunizations.bcg',
            'immunizations.diphtheria_pertussis',
            'immunizations.oral_polio',
            'immunizations.mmr',
            'immunizations.chicken_pox',
            'immunizations.hepatitis_b',
            'immunizations.tetanus_toxoid',
            'immunizations.flu',
            'immunizations.pneumococcal',
            'allergy_status',
            'information_certified',
            'deworming_consent',
            'signature',
        ];

        for ($i = 0; $i < min(self::ITERATIONS, count($requiredFields) * 5); $i++) {
            // Create student with user account so authorization passes
            $studentRole = Role::where('role_name', 'Student')->first();
            $user = User::factory()->create(['role_id' => $studentRole->role_id]);
            $student = Student::factory()->create(['user_id' => $user->user_id]);

            $payload = $this->generateValidPayload($student);

            // Randomly omit one required field
            $fieldToOmit = $requiredFields[array_rand($requiredFields)];
            $this->unsetNestedKey($payload, $fieldToOmit);

            $response = $this->actingAs($user)->postJson('/api/shdf', $payload);

            $response->assertStatus(422);
            $this->assertArrayHasKey('errors', $response->json());
        }
    }

    /**
     * Property 3: PhilHealth ID format
     * Validates: Requirements 2.5
     */
    public function test_property_philhealth_id_format(): void
    {
        $student = Student::factory()->create();
        $user = User::factory()->create(['role_id' => Role::where('role_name', 'Clinic Staff')->first()->role_id]);

        for ($i = 0; $i < self::ITERATIONS; $i++) {
            $payload = $this->generateValidPayload($student);

            // Generate random PhilHealth ID
            $length = rand(1, 20);
            $hasInvalidChars = rand(0, 1);

            if ($length === 12 && !$hasInvalidChars) {
                // Valid: exactly 12 alphanumeric
                $payload['learner_philhealth_id'] = $this->randomAlphanumeric(12);
                $response = $this->actingAs($user)->postJson('/api/shdf', $payload);
                $response->assertStatus(200);
            } else {
                // Invalid: wrong length or invalid characters
                if ($hasInvalidChars) {
                    $payload['learner_philhealth_id'] = $this->randomAlphanumeric(11) . '@';
                } else {
                    $payload['learner_philhealth_id'] = $this->randomAlphanumeric($length);
                }

                if ($length !== 12 || $hasInvalidChars) {
                    $response = $this->actingAs($user)->postJson('/api/shdf', $payload);
                    $response->assertStatus(422);
                }
            }
        }
    }

    /**
     * Property 4: Immunization status required and enum-constrained
     * Validates: Requirements 3.1, 3.2, 3.3
     */
    public function test_property_immunization_enum(): void
    {
        $student = Student::factory()->create();
        $user = User::factory()->create(['role_id' => Role::where('role_name', 'Clinic Staff')->first()->role_id]);

        $vaccines = ['bcg', 'diphtheria_pertussis', 'oral_polio', 'mmr', 'chicken_pox',
                     'hepatitis_b', 'tetanus_toxoid', 'flu', 'pneumococcal'];
        $validValues = ['yes', 'no', 'na'];
        $invalidValues = ['', 'unknown', 'maybe', '1', '0', null];

        for ($i = 0; $i < self::ITERATIONS; $i++) {
            $payload = $this->generateValidPayload($student);

            // Randomly pick a vaccine and set invalid value
            $vaccine = $vaccines[array_rand($vaccines)];
            $invalidValue = $invalidValues[array_rand($invalidValues)];

            $payload['immunizations'][$vaccine] = $invalidValue;

            $response = $this->actingAs($user)->postJson('/api/shdf', $payload);
            $response->assertStatus(422);
        }
    }

    /**
     * Properties 7, 8, 9: Condition/Medication/Family "None" exclusivity
     * Validates: Requirements 4.8, 4.9, 5.5
     */
    public function test_property_none_exclusivity(): void
    {
        $student = Student::factory()->create();
        $user = User::factory()->create(['role_id' => Role::where('role_name', 'Clinic Staff')->first()->role_id]);

        $testCases = [
            'medical_conditions' => [
                'none_key' => 'condition_none',
                'other_keys' => ['condition_asthma', 'condition_diabetes', 'condition_anemia'],
            ],
            'medications' => [
                'none_key' => 'medications_none',
                'other_keys' => ['medications_paracetamol', 'medications_mefenamic', 'medications_anti_allergy'],
            ],
            'family_conditions' => [
                'none_key' => 'family.condition_none',
                'other_keys' => ['family.condition_tuberculosis', 'family.condition_cancer', 'family.condition_stroke'],
            ],
        ];

        foreach ($testCases as $case) {
            for ($i = 0; $i < 10; $i++) {
                $payload = $this->generateValidPayload($student);

                // Set "none" to true
                $this->setNestedKey($payload, $case['none_key'], true);

                // Randomly set one or more other conditions to true
                $otherKey = $case['other_keys'][array_rand($case['other_keys'])];
                $this->setNestedKey($payload, $otherKey, true);

                $response = $this->actingAs($user)->postJson('/api/shdf', $payload);
                $response->assertStatus(422);
            }
        }
    }

    /**
     * Property 14: Signature file validation
     * Validates: Requirements 6.8, 6.10, 6.11, 6.12
     */
    public function test_property_signature_file_validation(): void
    {
        $student = Student::factory()->create();
        $user = User::factory()->create(['role_id' => Role::where('role_name', 'Clinic Staff')->first()->role_id]);

        $validMimes = ['pdf', 'jpeg', 'png'];
        $invalidMimes = ['txt', 'doc', 'gif', 'bmp'];
        $maxSize = 102400; // 100 MB in KB

        for ($i = 0; $i < 30; $i++) {
            $payload = $this->generateValidPayload($student, false);

            $isValid = rand(0, 1);

            if ($isValid) {
                $mime = $validMimes[array_rand($validMimes)];
                $size = rand(1, $maxSize);
                $payload['signature'] = UploadedFile::fake()->create("signature.{$mime}", $size);

                $response = $this->actingAs($user)->postJson('/api/shdf', $payload);
                $response->assertStatus(200);
            } else {
                // Invalid: wrong MIME or oversized
                if (rand(0, 1)) {
                    $mime = $invalidMimes[array_rand($invalidMimes)];
                    $payload['signature'] = UploadedFile::fake()->create("signature.{$mime}", 100);
                } else {
                    $mime = $validMimes[array_rand($validMimes)];
                    $payload['signature'] = UploadedFile::fake()->create("signature.{$mime}", $maxSize + 1000);
                }

                $response = $this->actingAs($user)->postJson('/api/shdf', $payload);
                $response->assertStatus(422);
            }
        }
    }

    /**
     * Property 16: SHDF submission round-trip
     * Validates: Requirements 7.1, 7.4
     */
    public function test_property_submission_round_trip(): void
    {
        $user = User::factory()->create(['role_id' => Role::where('role_name', 'Clinic Staff')->first()->role_id]);

        for ($i = 0; $i < 20; $i++) {
            $student = Student::factory()->create();
            $payload = $this->generateValidPayload($student);

            // Submit
            $response = $this->actingAs($user)->postJson('/api/shdf', $payload);
            $response->assertStatus(200);

            // Fetch
            $fetchResponse = $this->actingAs($user)->getJson("/api/shdf/{$student->student_id}");
            $fetchResponse->assertStatus(200);

            $fetched = $fetchResponse->json();

            // Assert key fields match
            $this->assertEquals($payload['parent_guardian_name'], $fetched['student']['parent_guardian_name']);
            $this->assertEquals($payload['allergy_status'], $fetched['medical_history']['allergy_status']);
            $this->assertEquals($payload['deworming_consent'], $fetched['parental_consent']['deworming_consent']);
        }
    }

    /**
     * Property 18: Upsert — no duplicate per student and school year
     * Validates: Requirements 7.3
     */
    public function test_property_upsert_uniqueness(): void
    {
        $user = User::factory()->create(['role_id' => Role::where('role_name', 'Clinic Staff')->first()->role_id]);

        for ($i = 0; $i < 20; $i++) {
            $student = Student::factory()->create();

            // Submit first time
            $payload1 = $this->generateValidPayload($student);
            $payload1['parent_guardian_name'] = 'First Guardian';
            $this->actingAs($user)->postJson('/api/shdf', $payload1);

            // Submit second time with different data
            $payload2 = $this->generateValidPayload($student);
            $payload2['parent_guardian_name'] = 'Second Guardian';
            $this->actingAs($user)->postJson('/api/shdf', $payload2);

            // Assert only one parental consent record exists
            $schoolYear = SchoolYear::where('is_current', true)->first();
            $count = StudentParentalConsent::where('student_id', $student->student_id)
                ->where('school_year_id', $schoolYear->id)
                ->count();

            $this->assertEquals(1, $count);

            // Assert the latest data is stored
            $student->refresh();
            $this->assertEquals('Second Guardian', $student->parent_guardian_name);
        }
    }

    /**
     * Property 20: Clinic staff can view any student's SHDF
     * Validates: Requirements 8.1
     */
    public function test_property_clinic_staff_access(): void
    {
        $clinicRole = Role::where('role_name', 'Clinic Staff')->first();

        for ($i = 0; $i < 20; $i++) {
            $clinicUser = User::factory()->create(['role_id' => $clinicRole->role_id]);
            $student = Student::factory()->create();

            $this->assertTrue($clinicUser->can('view', $student));
            $this->assertTrue($clinicUser->can('submit', $student));
        }
    }

    /**
     * Property 21: Adviser access scoped to own section
     * Validates: Requirements 8.2, 8.4
     */
    public function test_property_adviser_access(): void
    {
        $adviserRole = Role::where('role_name', 'adviser')->first();

        for ($i = 0; $i < 20; $i++) {
            $adviser = User::factory()->create(['role_id' => $adviserRole->role_id]);

            // Own section student
            $ownStudent = Student::factory()->create(['current_adviser_id' => $adviser->user_id]);
            $this->assertTrue($adviser->can('view', $ownStudent));

            // Other section student
            $otherStudent = Student::factory()->create(['current_adviser_id' => 999]);
            $this->assertFalse($adviser->can('view', $otherStudent));
        }
    }

    /**
     * Property 22: Student access scoped to own record
     * Validates: Requirements 8.3, 8.4
     */
    public function test_property_student_access(): void
    {
        $studentRole = Role::where('role_name', 'Student')->first();

        for ($i = 0; $i < 20; $i++) {
            $user = User::factory()->create(['role_id' => $studentRole->role_id]);

            // Own record
            $ownStudent = Student::factory()->create(['user_id' => $user->user_id]);
            $this->assertTrue($user->can('view', $ownStudent));
            $this->assertTrue($user->can('submit', $ownStudent));

            // Other student's record
            $otherUser = User::factory()->create(['role_id' => $studentRole->role_id]);
            $otherStudent = Student::factory()->create(['user_id' => $otherUser->user_id]);
            $this->assertFalse($user->can('view', $otherStudent));
            $this->assertFalse($user->can('submit', $otherStudent));
        }
    }

    // Helper methods

    private function generateValidPayload(Student $student, bool $includeSignature = true): array
    {
        $payload = [
            'student_id' => $student->student_id,
            'parent_guardian_name' => fake()->name(),
            'emergency_contact' => fake()->name(),
            'emergency_contact_relation' => 'mother',
            'emergency_contact_phone' => fake()->phoneNumber(),
            'learner_philhealth_id' => $this->randomAlphanumeric(12),
            'parent_philhealth_id' => $this->randomAlphanumeric(12),
            'parent_philhealth_name' => fake()->name(),
            'parent_relationship' => 'mother',
            'immunizations' => [
                'bcg' => 'yes',
                'diphtheria_pertussis' => 'yes',
                'oral_polio' => 'yes',
                'mmr' => 'yes',
                'chicken_pox' => 'no',
                'hepatitis_b' => 'yes',
                'tetanus_toxoid' => 'yes',
                'flu' => 'na',
                'pneumococcal' => 'na',
            ],
            'menarche_age' => $student->gender === 'F' ? '12' : null,
            'allergy_status' => 'nka',
            'condition_none' => true,
            'medications_none' => true,
            'pwd_status' => 'none',
            'surgery_history' => false,
            'family' => [
                'condition_none' => true,
                'smoke_exposure' => false,
                'is_4ps_beneficiary' => false,
                'is_sbfp_beneficiary' => false,
            ],
            'information_certified' => true,
            'deworming_consent' => 'oo',
            'mrtd_consent' => $student->grade_level === 'Grade 7' ? 'oo' : 'not_applicable',
            'wifa_consent' => $student->gender === 'F' ? 'oo' : 'not_applicable',
        ];

        if ($includeSignature) {
            $payload['signature'] = UploadedFile::fake()->create('signature.pdf', 1000);
        }

        return $payload;
    }

    private function randomAlphanumeric(int $length): string
    {
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        $result = '';
        for ($i = 0; $i < $length; $i++) {
            $result .= $chars[rand(0, strlen($chars) - 1)];
        }
        return $result;
    }

    private function unsetNestedKey(array &$array, string $key): void
    {
        if (str_contains($key, '.')) {
            $parts = explode('.', $key);
            $current = &$array;
            $lastKey = array_pop($parts);
            foreach ($parts as $part) {
                if (!isset($current[$part])) {
                    return;
                }
                $current = &$current[$part];
            }
            unset($current[$lastKey]);
        } else {
            unset($array[$key]);
        }
    }

    private function setNestedKey(array &$array, string $key, $value): void
    {
        if (str_contains($key, '.')) {
            $parts = explode('.', $key);
            $current = &$array;
            $lastKey = array_pop($parts);
            foreach ($parts as $part) {
                if (!isset($current[$part])) {
                    $current[$part] = [];
                }
                $current = &$current[$part];
            }
            $current[$lastKey] = $value;
        } else {
            $array[$key] = $value;
        }
    }
}
