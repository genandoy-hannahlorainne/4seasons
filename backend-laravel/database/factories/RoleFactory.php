<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoleFactory extends Factory
{
    protected $model = Role::class;

    public function definition(): array
    {
        return [
            'role_id' => $this->faker->unique()->numberBetween(10, 127),
            'role_name' => $this->faker->randomElement(['student', 'adviser', 'clinic_staff', 'admin']),
        ];
    }
}
