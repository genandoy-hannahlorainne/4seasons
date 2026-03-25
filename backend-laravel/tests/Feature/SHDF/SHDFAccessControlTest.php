<?php

namespace Tests\Feature\SHDF;

use App\Models\Role;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SHDFAccessControlTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        SchoolYear::factory()->create(['is_current' => true]);
    }

    /** @test */
    public function it_rejects_unauthenticated_request()
    {
        $student = Student::factory()->create();

        $response = $this->getJson("/api/shdf/{$student->student_id}");

        $response->assertStatus(401);
    }

    /** @test */
    public function clinic_staff_can_view_any_student_shdf()
    {
        $clinicRole = Role::factory()->create(['role_name' => 'clinic_staff']);
        $clinicUser = User::factory()->create(['role_id' => $clinicRole->role_id]);
        $student = Student::factory()->create();

        $response = $this->actingAs($clinicUser)->getJson("/api/shdf/{$student->student_id}");

        $response->assertStatus(200);
    }

    /** @test */
    public function adviser_can_view_own_section_student()
    {
        $adviserRole = Role::factory()->create(['role_name' => 'adviser']);
        $adviserUser = User::factory()->create(['role_id' => $adviserRole->role_id]);
        $student = Student::factory()->create(['current_adviser_id' => $adviserUser->user_id]);

        $response = $this->actingAs($adviserUser)->getJson("/api/shdf/{$student->student_id}");

        $response->assertStatus(200);
    }

    /** @test */
    public function adviser_cannot_view_other_section_student()
    {
        $adviserRole = Role::factory()->create(['role_name' => 'adviser']);
        $adviserUser = User::factory()->create(['role_id' => $adviserRole->role_id]);
        $otherAdviser = User::factory()->create(['role_id' => $adviserRole->role_id]);
        $student = Student::factory()->create(['current_adviser_id' => $otherAdviser->user_id]);

        $response = $this->actingAs($adviserUser)->getJson("/api/shdf/{$student->student_id}");

        $response->assertStatus(403);
    }

    /** @test */
    public function student_can_view_own_shdf()
    {
        $studentRole = Role::factory()->create(['role_name' => 'student']);
        $user = User::factory()->create(['role_id' => $studentRole->role_id]);
        $student = Student::factory()->create(['user_id' => $user->user_id]);

        $response = $this->actingAs($user)->getJson("/api/shdf/{$student->student_id}");

        $response->assertStatus(200);
    }

    /** @test */
    public function student_cannot_view_another_students_shdf()
    {
        $studentRole = Role::factory()->create(['role_name' => 'student']);
        $user = User::factory()->create(['role_id' => $studentRole->role_id]);
        $ownStudent = Student::factory()->create(['user_id' => $user->user_id]);
        $otherStudent = Student::factory()->create();

        $response = $this->actingAs($user)->getJson("/api/shdf/{$otherStudent->student_id}");

        $response->assertStatus(403);
    }
}
