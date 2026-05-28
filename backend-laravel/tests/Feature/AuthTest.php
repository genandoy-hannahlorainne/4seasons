<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        User::factory()->create([
            'username'      => 'testuser',
            'password_hash' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'username' => 'testuser',
            'password' => 'password123',
        ]);

        // Session-based login: expect user data and a Set-Cookie header (no bearer token)
        $response->assertStatus(200)
                 ->assertJsonStructure(['data' => ['user']]);

        // Response should not include a client-side bearer token anymore
        $this->assertArrayNotHasKey('token', $response->json('data'));

        // Ensure a session cookie was set on login (Set-Cookie header present)
        $this->assertTrue(
            $response->headers->has('set-cookie'),
            'Login response did not include Set-Cookie header'
        );
    }

    public function test_user_cannot_login_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/login', [
            'username' => 'nonexistent',
            'password'  => 'wrongpassword',
        ]);

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_access_me_route(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
                         ->getJson('/api/me');

        $response->assertStatus(200)
                 ->assertJsonPath('data.username', $user->username);
    }

    public function test_unauthenticated_user_cannot_access_protected_routes(): void
    {
        $response = $this->getJson('/api/me');

        $response->assertStatus(401);
    }
}
