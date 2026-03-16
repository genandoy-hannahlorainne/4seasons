<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Student;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_authenticated_user_can_view_students()
    {
        $user = User::factory()->create();
        Student::factory()->count(3)->create();

        $response = $this->actingAs($user, 'sanctum')
                        ->getJson('/api/students');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id',
                            'student_id',
                            'first_name',
                            'last_name',
                            'email'
                        ]
                    ]
                ]);
    }

    public function test_authenticated_user_can_view_single_student()
    {
        $user = User::factory()->create();
        $student = Student::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
                        ->getJson("/api/students/{$student->id}");

        $response->assertStatus(200)
                ->assertJson([
                    'id' => $student->id,
                    'student_id' => $student->student_id,
                ]);
    }

    public function test_unauthenticated_user_cannot_access_students()
    {
        $response = $this->getJson('/api/students');

        $response->assertStatus(401);
    }
}