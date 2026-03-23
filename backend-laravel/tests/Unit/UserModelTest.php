<?php

namespace Tests\Unit;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserModelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RoleSeeder::class);
    }

    public function test_user_has_role_relationship(): void
    {
        $role = Role::where('role_name', 'Admin')->first();
        $user = User::factory()->create(['role_id' => $role->role_id]);

        $this->assertInstanceOf(Role::class, $user->role);
        $this->assertEquals('Admin', $user->role->role_name);
    }

    public function test_user_full_name_is_stored_correctly(): void
    {
        $user = User::factory()->create(['full_name' => 'Juan dela Cruz']);

        $this->assertEquals('Juan dela Cruz', $user->full_name);
    }

    public function test_user_password_hash_is_hidden(): void
    {
        $user = User::factory()->create();

        $this->assertArrayNotHasKey('password_hash', $user->toArray());
    }

    public function test_user_is_active_by_default(): void
    {
        $user = User::factory()->create();

        $this->assertTrue($user->is_active);
    }
}
