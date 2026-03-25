<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        // Try to find an existing role, or create one using the factory
        $role = Role::first();
        if (!$role) {
            $role = Role::factory()->create(['role_name' => 'Admin']);
        }

        return [
            'role_id'              => $role->role_id,
            'username'             => fake()->unique()->userName(),
            'email'                => fake()->unique()->safeEmail(),
            'full_name'            => fake()->name(),
            'password_hash'        => static::$password ??= Hash::make('password'),
            'is_active'            => true,
            'password_must_change' => false,
        ];
    }

    public function admin(): static
    {
        return $this->state(function () {
            $role = Role::where('role_name', 'Admin')->first();
            if (!$role) {
                $role = Role::factory()->create(['role_name' => 'Admin']);
            }
            return ['role_id' => $role->role_id];
        });
    }

    public function mustChangePassword(): static
    {
        return $this->state(fn () => ['password_must_change' => true]);
    }
}
