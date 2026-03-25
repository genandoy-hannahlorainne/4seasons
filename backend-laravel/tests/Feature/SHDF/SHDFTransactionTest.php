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
use App\Services\SHDFService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SHDFTransactionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
        Storage::fake('signatures');
    }

    /** @test */
    public function it_rolls_back_on_database_failure()
    {
        $schoolYear = SchoolYear::factory()->create(['is_current' => true]);
        $student = Student::factory()->create();
        $user = User::factory()->create();
        $student->update(['user_id' => $user->user_id]);

        // Mock a DB failure by forcing an exception during transaction
        DB::shouldReceive('transaction')
            ->once()
            ->andThrow(new \Exception('Simulated DB failure'));

        $payload = $this->validPayload($student->student_id);
        $payload['signature'] = UploadedFile::fake()->create('signature.pdf', 100);

        $response = $this->actingAs($user)->postJson('/api/shdf', $payload);

        $response->assertStatus(500);

        // Assert no partial rows exist in any SHDF table
        $this->assertDatabaseMissing('student_philhealth', [
            'student_id' => $student->student_id,
        ]);

        $this->assertDatabaseMissing('student_immunizations', [
            'student_id' => $student->student_id,
        ]);

        $this->assertDatabaseMissing('student_family_history', [
            'student_id' => $student->student_id,
        ]);

        $this->assertDatabaseMissing('student_parental_consent', [
            'student_id' => $student->student_id,
        ]);
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
        ];
    }
}
