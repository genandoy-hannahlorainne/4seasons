<?php

namespace Tests\Feature\SHDF;

use App\Models\Role;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SHDFValidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
        Storage::fake('signatures');
        SchoolYear::factory()->create(['is_current' => true]);
    }

    /** @test */
    public function it_rejects_missing_required_fields()
    {
        $clinicRole = Role::where('role_name', 'Clinic Staff')->first();
        $user = User::factory()->create(['role_id' => $clinicRole->role_id]);
        $student = Student::factory()->create();

        $requiredFields = [
            'student_id',
            'parent_guardian_name',
            'emergency_contact',
            'emergency_contact_relation',
            'emergency_contact_phone',
            'allergy_status',
            'information_certified',
            'deworming_consent',
            'signature',
        ];

        foreach ($requiredFields as $field) {
            $payload = $this->validPayload($student->student_id);
            unset($payload[$field]);

            $response = $this->actingAs($user)->postJson('/api/shdf', $payload);
            $response->assertStatus(422);
            $response->assertJsonValidationErrors($field);
        }
    }

    /** @test */
    public function it_rejects_medical_condition_none_with_other_conditions()
    {
        $student = Student::factory()->create();
        $user = User::factory()->create();
        $student->update(['user_id' => $user->user_id]);

        $payload = $this->validPayload($student->student_id);
        $payload['condition_none'] = true;
        $payload['condition_asthma'] = true;

        $response = $this->actingAs($user)->postJson('/api/shdf', $payload);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors('condition_none');
    }

    /** @test */
    public function it_rejects_medication_none_with_other_medications()
    {
        $student = Student::factory()->create();
        $user = User::factory()->create();
        $student->update(['user_id' => $user->user_id]);

        $payload = $this->validPayload($student->student_id);
        $payload['medications_none'] = true;
        $payload['medications_paracetamol'] = true;

        $response = $this->actingAs($user)->postJson('/api/shdf', $payload);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors('medications_none');
    }

    /** @test */
    public function it_rejects_family_condition_none_with_other_conditions()
    {
        $student = Student::factory()->create();
        $user = User::factory()->create();
        $student->update(['user_id' => $user->user_id]);

        $payload = $this->validPayload($student->student_id);
        $payload['family']['condition_none'] = true;
        $payload['family']['condition_diabetes'] = true;

        $response = $this->actingAs($user)->postJson('/api/shdf', $payload);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors('family.condition_none');
    }

    /** @test */
    public function it_rejects_emergency_contact_other_without_free_text()
    {
        $student = Student::factory()->create();
        $user = User::factory()->create();
        $student->update(['user_id' => $user->user_id]);

        $payload = $this->validPayload($student->student_id);
        $payload['emergency_contact_relation'] = 'other';
        $payload['emergency_contact_relation_other'] = '';

        $response = $this->actingAs($user)->postJson('/api/shdf', $payload);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors('emergency_contact_relation_other');
    }

    /** @test */
    public function it_rejects_pwd_congenital_without_detail()
    {
        $student = Student::factory()->create();
        $user = User::factory()->create();
        $student->update(['user_id' => $user->user_id]);

        $payload = $this->validPayload($student->student_id);
        $payload['pwd_status'] = 'congenital';
        $payload['pwd_congenital_detail'] = '';

        $response = $this->actingAs($user)->postJson('/api/shdf', $payload);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors('pwd_congenital_detail');
    }

    /** @test */
    public function it_rejects_deworming_hindi_without_refusal_reason()
    {
        $student = Student::factory()->create();
        $user = User::factory()->create();
        $student->update(['user_id' => $user->user_id]);

        $payload = $this->validPayload($student->student_id);
        $payload['deworming_consent'] = 'hindi';
        $payload['deworming_refusal_reason'] = '';

        $response = $this->actingAs($user)->postJson('/api/shdf', $payload);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors('deworming_refusal_reason');
    }

    /** @test */
    public function it_requires_mrtd_consent_for_grade_7()
    {
        $student = Student::factory()->create(['grade_level' => 'Grade 7']);
        $user = User::factory()->create();
        $student->update(['user_id' => $user->user_id]);

        $payload = $this->validPayload($student->student_id);
        unset($payload['mrtd_consent']);

        $response = $this->actingAs($user)->postJson('/api/shdf', $payload);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors('mrtd_consent');
    }

    /** @test */
    public function it_does_not_require_mrtd_consent_for_other_grades()
    {
        $student = Student::factory()->create(['grade_level' => 'Grade 8', 'gender' => 'M']);
        $clinicRole = Role::where('role_name', 'Clinic Staff')->first();
        $user = User::factory()->create(['role_id' => $clinicRole->role_id]);

        $payload = $this->validPayload($student->student_id);
        unset($payload['mrtd_consent']);

        $response = $this->actingAs($user)->postJson('/api/shdf', $payload);
        $response->assertStatus(200);
    }

    /** @test */
    public function it_requires_wifa_consent_for_female_students()
    {
        $student = Student::factory()->create(['gender' => 'F']);
        $user = User::factory()->create();
        $student->update(['user_id' => $user->user_id]);

        $payload = $this->validPayload($student->student_id);
        unset($payload['wifa_consent']);

        $response = $this->actingAs($user)->postJson('/api/shdf', $payload);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors('wifa_consent');
    }

    /** @test */
    public function it_does_not_require_wifa_consent_for_male_students()
    {
        $student = Student::factory()->create(['gender' => 'M']);
        $user = User::factory()->create();
        $student->update(['user_id' => $user->user_id]);

        $payload = $this->validPayload($student->student_id);
        unset($payload['wifa_consent']);

        $response = $this->actingAs($user)->postJson('/api/shdf', $payload);
        $response->assertStatus(200);
    }

    protected function validPayload(int $studentId): array
    {
        return [
            'student_id' => $studentId,
            'parent_guardian_name' => 'Juan Dela Cruz',
            'emergency_contact' => 'Maria Dela Cruz',
            'emergency_contact_relation' => 'mother',
            'emergency_contact_phone' => '09171234567',
            'learner_philhealth_id' => 'ABC123456789',
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
            'signature' => UploadedFile::fake()->create('signature.pdf', 100),
        ];
    }
}
