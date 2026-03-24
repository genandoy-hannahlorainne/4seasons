<?php

namespace Database\Factories;

use App\Models\SchoolYear;
use Illuminate\Database\Eloquent\Factories\Factory;

class SchoolYearFactory extends Factory
{
    protected $model = SchoolYear::class;

    public function definition(): array
    {
        $year = now()->year;
        return [
            'year_name' => $year . '-' . ($year + 1),
            'start_date' => now()->startOfYear(),
            'end_date' => now()->endOfYear(),
            'is_current' => false,
            'is_active' => true,
        ];
    }
}
