<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Section;
use App\Models\User;
use Illuminate\Support\Facades\DB;

$currentSchoolYearId = DB::table('school_years')->where('is_current', true)->value('id');

$sections = Section::with(['gradeLevel', 'schoolYear'])
    ->withCount(['students' => function($q) {
        $q->where('is_active', true);
    }])
    ->where('is_active', true)
    ->where('school_year_id', $currentSchoolYearId)
    ->orderBy('grade_level_id')
    ->orderBy('section_number')
    ->get()
    ->map(function($section) {
        $adviser = null;
        if ($section->adviser_id) {
            $adviserUser = User::find($section->adviser_id);
            $adviser = $adviserUser?->full_name;
        }
        return [
            'id'                 => $section->id,
            'section_name'       => $section->section_name,
            'adviser_name'       => $adviser,
            'capacity'           => $section->capacity,
            'current_enrollment' => $section->students_count ?? 0,
            'level_name'         => $section->gradeLevel->level_name ?? null,
        ];
    });

echo json_encode($sections, JSON_PRETTY_PRINT);
