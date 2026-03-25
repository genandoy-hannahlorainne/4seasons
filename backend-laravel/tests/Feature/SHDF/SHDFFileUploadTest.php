<?php

namespace Tests\Feature\SHDF;

use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\StudentParentalConsent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SHDFFileUploadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('signatures');

        // Create roles
        \App\Models\Role::factory()->create(['role_name' => 'student']);
        \App\Models\Role::factory()->create(['role_name' => 'clinic_staff']);

        SchoolYear::factory()->create(['is_current' => true]);
    }

    /** @test */
    public function it_accepts_valid_pdf_upload()
    {
        $studentRole = \App\Models\Role::where('role_name', 'student')->first();
        $student = Student::factory()->create(['gender' => 'F', 'grade_level' => 'Grade 8']);
        $user = User::factory()->create([
            'user_id' => $student->user_id,
            'role_id' => $studentRole->role_id
        ]);
        $student->update(['user_id' => $user->user_id]);

        $payload = $this->validPayload($student);
        $payload['signature'] = UploadedFile::fake()->create('signature.pdf', 100);

        $response = $this->actingAs($user)->postJson('/api/shdf', $payload);

        $response->assertStatus(200);

        $consent = StudentParentalConsent::where('student_id', $student->student_id)->first();
        $this->assertNotNull($consent->signature_file_path);
        Storage::disk('signatures')->assertExists($consent->signature_file_path);
    }

    /** @test */
    public function it_accepts_valid_png_upload()
    {
        $studentRole = \App\Models\Role::where('role_name', 'student')->first();
        $student = Student::factory()->create(['gender' => 'M', 'grade_level' => 'Grade 8']);
        $user = User::factory()->create(['role_id' => $studentRole->role_id]);
        $student->update(['user_id' => $user->user_id]);

        $payload = $this->validPayload($student);
        $payload['signature'] = UploadedFile::fake()->image('signature.png');

        $response = $this->actingAs($user)->postJson('/api/shdf', $payload);

        $response->assertStatus(200);

        $consent = StudentParentalConsent::where('student_id', $student->student_id)->first();
        $this->assertNotNull($consent->signature_file_path);
        Storage::disk('signatures')->assertExists($consent->signature_file_path);
    }

    /** @test */
    public function it_accepts_valid_jpeg_upload()
    {
        $studentRole = \App\Models\Role::where('role_name', 'student')->first();
        $student = Student::factory()->create(['gender' => 'M', 'grade_level' => 'Grade 7']);
        $user = User::factory()->create(['role_id' => $studentRole->role_id]);
        $student->update(['user_id' => $user->user_id]);

        $payload = $this->validPayload($student);
        $payload['signature'] = UploadedFile::fake()->image('signature.jpeg');

        $response = $this->actingAs($user)->postJson('/api/shdf', $payload);

        $response->assertStatus(200);
    }

    /** @test */
    public function it_rejects_oversized_file()
    {
        $studentRole = \App\Models\Role::where('role_name', 'student')->first();
        $student = Student::factory()->create(['gender' => 'M', 'grade_level' => 'Grade 8']);
        $user = User::factory()->create(['role_id' => $studentRole->role_id]);
        $student->update(['user_id' => $user->user_id]);

        $payload = $this->validPayload($student);
        // 102400 KB = 100 MB, so 102401 should fail
        $payload['signature'] = UploadedFile::fake()->create('signature.pdf', 102401);

        $response = $this->actingAs($user)->postJson('/api/shdf', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('signature');
    }

    /** @test */
    public function it_rejects_wrong_mime_type()
    {
        $studentRole = \App\Models\Role::where('role_name', 'student')->first();
        $student = Student::factory()->create(['gender' => 'M', 'grade_level' => 'Grade 8']);
        $user = User::factory()->create(['role_id' => $studentRole->role_id]);
        $student->update(['user_id' => $user->user_id]);

        $payload = $this->validPayload($student);
        $payload['signature'] = UploadedFile::fake()->create('signature.txt', 100);

        $response = $this->actingAs($user)->postJson('/api/shdf', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('signature');
    }

    /** @test */
    public function it_rejects_missing_signature()
    {
        $studentRole = \App\Models\Role::where('role_name', 'student')->first();
        $student = Student::factory()->create(['gender' => 'M', 'grade_level' => 'Grade 8']);
        $user = User::factory()->create(['role_id' => $studentRole->role_id]);
        $student->update(['user_id' => $user->user_id]);

        $payload = $this->validPayload($student);
        unset($payload['signature']);

        $response = $this->actingAs($user)->postJson('/api/shdf', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('signature');
    }

    protected function validPayload(Student $student): array
    {
        $payload = [
            'student_id' => $student->student_id,
            'parent_guardian_name' => 'Juan Dela Cruz',
            'emergency_contact' => 'Maria Dela Cruz',
            'emergency_contact_relation' => 'mother',
            'emergency_contact_phone' => '09171234567',
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
        ];

        // Add MRTD consent for Grade 7 students
        if ($student->grade_level === 'Grade 7') {
            $payload['mrtd_consent'] = 'oo';
        }

        // Add WIFA consent for female students
        if ($student->gender === 'F') {
            $payload['wifa_consent'] = 'oo';
            $payload['menarche_age'] = '12';
        }

        return $payload;
    }
}
