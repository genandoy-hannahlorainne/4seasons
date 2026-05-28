<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class PasswordChangeEnforcementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
    }

    public function test_user_with_must_change_password_is_blocked_from_protected_routes(): void
    {
        $user = User::factory()->mustChangePassword()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/students');

        $response->assertStatus(403)
            ->assertJsonPath('code', 'PASSWORD_CHANGE_REQUIRED');
    }

    public function test_user_with_must_change_password_can_access_force_change_endpoint(): void
    {
        $user = User::factory()->mustChangePassword()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/force-change-password', [
                'current_password' => 'password',
                'new_password' => 'new-password-123',
                'new_password_confirmation' => 'new-password-123',
            ]);

        $response->assertStatus(200);
    }

    public function test_multi_role_middleware_allows_any_listed_role(): void
    {
        Route::middleware(['api', 'auth:sanctum', 'role:admin,adviser,clinic_staff'])
            ->get('/api/test-multi-role', fn () => response()->json(['ok' => true]));

        $adviser = User::factory()->create(['role_id' => 3]);

        $this->actingAs($adviser, 'sanctum')
            ->getJson('/api/test-multi-role')
            ->assertStatus(200)
            ->assertJsonPath('ok', true);
    }

    public function test_multi_role_middleware_denies_unlisted_role(): void
    {
        Route::middleware(['api', 'auth:sanctum', 'role:admin,adviser,clinic_staff'])
            ->get('/api/test-multi-role-deny', fn () => response()->json(['ok' => true]));

        $student = User::factory()->create(['role_id' => 2]);

        $this->actingAs($student, 'sanctum')
            ->getJson('/api/test-multi-role-deny')
            ->assertStatus(403);
    }
}
