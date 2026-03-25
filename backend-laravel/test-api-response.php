<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\GradeLevel;
use Illuminate\Support\Facades\DB;

$currentSchoolYearId = DB::table('school_years')->where('is_current', true)->value('id');

$gradeLevels = GradeLevel::with(['sections' => function($query) use ($currentSchoolYearId) {
    $query->where('is_active', true)
          ->when($currentSchoolYearId, fn($q) => $q->where('school_year_id', $currentSchoolYearId))
          ->withCount(['students' => function($q) {
              $q->where('is_active', true);
          }])
          ->orderBy('section_number');
}])
->where('is_active', true)
->orderBy('level_number')
->get()
->map(function($gradeLevel) {
    return [
        'id'               => $gradeLevel->id,
        'level_number'     => $gradeLevel->level_number,
        'level_name'       => $gradeLevel->level_name,
        'sections'         => $gradeLevel->sections->map(function($section) {
            return [
                'id'                 => $section->id,
                'section_name'       => $section->section_name,
                'capacity'           => $section->capacity,
                'current_enrollment' => $section->students_count ?? 0,
            ];
        })
    ];
});

echo json_encode($gradeLevels, JSON_PRETTY_PRINT);
