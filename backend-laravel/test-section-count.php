<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$section = App\Models\Section::find(87);
echo "Section ID: " . $section->id . "\n";
echo "Section Name: " . $section->section_name . "\n";
echo "Students count (direct): " . $section->students()->where('is_active', true)->count() . "\n";

$sectionWithCount = App\Models\Section::withCount(['students' => function($q) {
    $q->where('is_active', true);
}])->find(87);
echo "Students count (withCount): " . $sectionWithCount->students_count . "\n";
