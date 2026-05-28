<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Student;
use App\Models\AuditLog;
use App\Services\HashidService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
    }

    /** @test */
    public function hashid_service_can_encode_and_decode_ids()
    {
        $service = new HashidService();

        $originalId = 123;
        $encoded = $service->encode($originalId);
        $decoded = $service->decode($encoded);

        $this->assertEquals($originalId, $decoded);
        $this->assertNotEquals($originalId, $encoded);
        $this->assertIsString($encoded);
        $this->assertGreaterThanOrEqual(6, strlen($encoded));
    }

    /** @test */
    public function student_model_has_hashid_attribute()
    {
        $student = Student::factory()->create();

        $this->assertNotNull($student->hashid);
        $this->assertIsString($student->hashid);
        $this->assertGreaterThanOrEqual(6, strlen($student->hashid));
    }

    /** @test */
    public function can_find_student_by_hashid()
    {
        $student = Student::factory()->create();
        $hashid = $student->hashid;

        $found = Student::findByHashid($hashid);

        $this->assertNotNull($found);
        $this->assertEquals($student->student_id, $found->student_id);
    }

    /** @test */
    public function audit_log_records_user_actions()
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum');

        AuditLog::log(
            action: 'view',
            resourceType: 'Student',
            resourceId: 123,
            description: 'Test audit log'
        );

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->user_id,
            'action' => 'view',
            'resource_type' => 'Student',
            'resource_id' => 123,
        ]);
    }

    /** @test */
    public function rate_limiting_is_applied_to_api_routes()
    {
        $user = User::factory()->create();

        // Make 61 requests (limit is 60 per minute)
        for ($i = 0; $i < 61; $i++) {
            $response = $this->actingAs($user, 'sanctum')
                ->getJson('/api/students');

            if ($i < 60) {
                $this->assertNotEquals(429, $response->status());
            }
        }

        // 61st request should be rate limited
        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/students');

        $this->assertEquals(429, $response->status());
    }

    /** @test */
    public function audit_middleware_logs_sensitive_routes()
    {
        $user = User::factory()->create();
        $student = Student::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/students/{$student->student_id}");

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->user_id,
            'resource_type' => 'Student',
            'resource_id' => $student->student_id,
        ]);
    }
}
