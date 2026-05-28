<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminPasswordChangeRequestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
    }

    public function test_admin_can_approve_password_change_request_even_when_request_data_is_missing_user_id(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create([
            'password_hash' => Hash::make('old-password'),
        ]);

        $notification = Notification::create([
            'user_id' => $user->user_id,
            'channel' => 'System',
            'message' => 'Password change request',
            'status' => 'Pending',
            'priority' => 'normal',
            'notification_type' => 'password_change_request',
            'request_data' => [
                'username' => $user->username,
                'full_name' => $user->full_name,
                'new_password' => 'new-password-123',
            ],
        ]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/admin/notifications/{$notification->notification_id}/approve-password-change");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.username', $user->username);

        $this->assertTrue(Hash::check('new-password-123', $user->fresh()->password_hash));
        $this->assertDatabaseHas('notifications', [
            'notification_id' => $notification->notification_id,
            'status' => 'Sent',
        ]);
    }
}