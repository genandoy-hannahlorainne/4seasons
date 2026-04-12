<?php

namespace Database\Factories;

use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

class StudentFactory extends Factory
{
    protected $model = Student::class;

    public function definition(): array
    {
        return [
            'student_number' => '13' . $this->faker->unique()->numerify('##########'),
            'user_id' => null,
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'middle_name' => $this->faker->lastName(),
            'gender' => $this->faker->randomElement(['M', 'F']),
            'birth_date' => $this->faker->date(),
            'grade_level' => $this->faker->randomElement(['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']),
            'section' => $this->faker->randomElement(['A', 'B', 'C']),
            'current_adviser_id' => null,
            'parent_guardian_name' => null,
            'emergency_contact' => null,
            'emergency_contact_relation' => null,
            'emergency_contact_phone' => null,
            'is_active' => true,
        ];
    }
}
