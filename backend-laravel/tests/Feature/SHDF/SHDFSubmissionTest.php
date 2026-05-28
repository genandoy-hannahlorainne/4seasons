<?php

namespace Tests\Feature\SHDF;

use App\Models\MedicalHistory;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\StudentFamilyHistory;
use App\Models\StudentImmunization;
use App\Models\StudentParentalConsent;
use App\Models\StudentPhilhealth;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SHDFSubmissionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
        Storage::fake('signatures');
    }

    #[Test]
    public function it_submits_complete_valid_shdf_payload()
    {
        $schoolYear = SchoolYear::factory()->create(['is_current' => true]);
        $student = Student::factory()->create(['gender' => 'F', 'grade_level' => 'Grade 7']);
        $user = User::factory()->create();
        $student->update(['user_id' => $user->user_id]);

        $payload = $this->validPayload($student->student_id);
        $payload['signature'] = UploadedFile::fake()->create('signature.pdf', 100);

        $response = $this->actingAs($user)->postJson('/api/shdf', $payload);

        $response->assertStatus(200);

        // Assert student table updated
        $this->assertDatabaseHas('students', [
            'student_id' => $student->student_id,
            'parent_guardian_name' => 'Juan Dela Cruz',
        ]);

        // Assert PhilHealth record
        $this->assertDatabaseHas('student_philhealth', [
            'student_id' => $student->student_id,
            'learner_philhealth_id' => 'ABC123456789',
        ]);

        // Assert immunization record
        $this->assertDatabaseHas('student_immunizations', [
            'student_id' => $student->student_id,
            'bcg' => 'yes',
        ]);

        // Assert medical history
        $this->assertDatabaseHas('medical_history', [
            'student_id' => $student->student_id,
            'allergy_status' => 'nka',
        ]);

        // Assert family history
        $this->assertDatabaseHas('student_family_history', [
            'student_id' => $student->student_id,
            'condition_diabetes' => true,
        ]);

        // Assert parental consent with submitted_at
        $consent = StudentParentalConsent::where('student_id', $student->student_id)
            ->where('school_year_id', $schoolYear->id)
            ->first();

        $this->assertNotNull($consent);
        $this->assertNotNull($consent->submitted_at);
        $this->assertEquals('oo', $consent->deworming_consent);
    }

    #[Test]
    public function it_upserts_on_duplicate_submission()
    {
        $schoolYear = SchoolYear::factory()->create(['is_current' => true]);
        $student = Student::factory()->create(['gender' => 'M', 'grade_level' => 'Grade 8']);
        $user = User::factory()->create();
        $student->update(['user_id' => $user->user_id]);

        // First submission
        $payload1 = $this->validPayload($student->student_id);
        $payload1['signature'] = UploadedFile::fake()->create('sig1.pdf', 100);
        $payload1['deworming_consent'] = 'oo';

        $this->actingAs($user)->postJson('/api/shdf', $payload1);

        // Second submission with different data
        $payload2 = $this->validPayload($student->student_id);
        $payload2['signature'] = UploadedFile::fake()->create('sig2.pdf', 100);
        $payload2['deworming_consent'] = 'hindi';
        $payload2['deworming_refusal_reason'] = 'takot';

        $this->actingAs($user)->postJson('/api/shdf', $payload2);

        // Assert only one parental consent record exists
        $count = StudentParentalConsent::where('student_id', $student->student_id)
            ->where('school_year_id', $schoolYear->id)
            ->count();

        $this->assertEquals(1, $count);

        // Assert updated values
        $consent = StudentParentalConsent::where('student_id', $student->student_id)
            ->where('school_year_id', $schoolYear->id)
            ->first();

        $this->assertEquals('hindi', $consent->deworming_consent);
        $this->assertEquals('takot', $consent->deworming_refusal_reason);
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
            'parent_philhealth_id' => 'XYZ987654321',
            'parent_philhealth_name' => 'Juan Dela Cruz',
            'parent_relationship' => 'father',
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
            'menarche_age' => '12',
            'allergy_status' => 'nka',
            'condition_none' => true,
            'medications_none' => true,
            'pwd_status' => 'none',
            'surgery_history' => false,
            'family' => [
                'condition_diabetes' => true,
                'condition_hypertension' => false,
                'condition_none' => false,
                'smoke_exposure' => false,
                'is_4ps_beneficiary' => false,
                'is_sbfp_beneficiary' => true,
            ],
            'information_certified' => true,
            'deworming_consent' => 'oo',
            'mrtd_consent' => 'oo',
            'wifa_consent' => 'oo',
        ];
    }
}
