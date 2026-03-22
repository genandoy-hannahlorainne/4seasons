<?php

namespace App\Http\Controllers\Api;

use App\Models\Student;
use App\Models\GradeLevel;
use App\Models\Section;
use App\Models\SchoolYear;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GradePromotionController extends BaseController
{
    // Grade 7→8→9→10→11→12→graduated
    private const PROMOTION_MAP = [7 => 8, 8 => 9, 9 => 10, 10 => 11, 11 => 12, 12 => null];

    /**
     * GET /admin/promotion/summary
     * Returns how many active students are in each grade for the current school year,
     * plus capacity info for the target school year's sections.
     */
    public function summary(Request $request)
    {
        try {
            $currentYearId = $request->query('current_school_year_id');
            $targetYearId  = $request->query('target_school_year_id');

            if (!$currentYearId) {
                return $this->sendError('current_school_year_id is required', [], 422);
            }

            // Students per grade in the current school year
            // Also include students with NULL school year (legacy/unassigned) when querying
            $summary = DB::table('students')
                ->join('grade_levels', 'students.current_grade_level_id', '=', 'grade_levels.id')
                ->where('students.is_active', true)
                ->whereIn('students.enrollment_status', ['active', 'promoted'])
                ->where(function ($q) use ($currentYearId) {
                    $q->where('students.current_school_year_id', $currentYearId)
                      ->orWhereNull('students.current_school_year_id');
                })
                ->select(
                    'grade_levels.id as grade_level_id',
                    'grade_levels.level_name',
                    'grade_levels.level_number',
                    DB::raw('COUNT(students.student_id) as total_students')
                )
                ->groupBy('grade_levels.id', 'grade_levels.level_name', 'grade_levels.level_number')
                ->orderBy('grade_levels.level_number')
                ->get();

            // Target year section capacity (only if target year provided)
            $targetSections = [];
            $adviserStatus  = null;

            if ($targetYearId) {
                $targetSections = DB::table('sections')
                    ->join('grade_levels', 'sections.grade_level_id', '=', 'grade_levels.id')
                    ->where('sections.school_year_id', $targetYearId)
                    ->where('sections.is_active', true)
                    ->select(
                        'grade_levels.level_number',
                        'grade_levels.level_name',
                        DB::raw('COUNT(sections.id) as total_sections'),
                        DB::raw('SUM(sections.capacity) as total_capacity'),
                        DB::raw('SUM(sections.current_enrollment) as current_enrollment'),
                        DB::raw('SUM(CASE WHEN sections.adviser_id IS NOT NULL THEN 1 ELSE 0 END) as sections_with_advisers'),
                        DB::raw('SUM(CASE WHEN sections.adviser_id IS NULL THEN 1 ELSE 0 END) as sections_without_advisers')
                    )
                    ->groupBy('grade_levels.id', 'grade_levels.level_number', 'grade_levels.level_name')
                    ->orderBy('grade_levels.level_number')
                    ->get();

                $totalSections           = $targetSections->sum('total_sections');
                $sectionsWithAdvisers    = $targetSections->sum('sections_with_advisers');
                $sectionsWithoutAdvisers = $targetSections->sum('sections_without_advisers');

                $adviserStatus = [
                    'total_sections'           => $totalSections,
                    'sections_with_advisers'   => $sectionsWithAdvisers,
                    'sections_without_advisers'=> $sectionsWithoutAdvisers,
                    'all_assigned'             => $sectionsWithoutAdvisers === 0,
                ];
            }

            // Students that need manual handling (inactive, transferred, dropped)
            $manualCases = DB::table('students')
                ->join('grade_levels', 'students.current_grade_level_id', '=', 'grade_levels.id')
                ->where('students.is_active', true)
                ->whereNotIn('students.enrollment_status', ['active', 'promoted'])
                ->where(function ($q) use ($currentYearId) {
                    $q->where('students.current_school_year_id', $currentYearId)
                      ->orWhereNull('students.current_school_year_id');
                })
                ->select(
                    'students.student_id',
                    'students.first_name',
                    'students.last_name',
                    'students.enrollment_status',
                    'grade_levels.level_name'
                )
                ->get();

            return $this->sendResponse([
                'summary'                   => $summary,
                'target_sections'           => $targetSections,
                'adviser_assignment_status' => $adviserStatus,
                'manual_cases'              => $manualCases,
            ], 'Promotion summary loaded');

        } catch (\Exception $e) {
            Log::error('Promotion summary error', ['error' => $e->getMessage()]);
            return $this->sendError('Failed to load promotion summary', $e->getMessage());
        }
    }

    /**
     * POST /admin/promotion/copy-sections
     * Copies all sections from source school year to target school year.
     * Resets enrollment counts and clears adviser assignments.
     */
    public function copySections(Request $request)
    {
        $request->validate([
            'source_school_year_id' => 'required|integer|exists:school_years,id',
            'target_school_year_id' => 'required|integer|exists:school_years,id',
        ]);

        $sourceId = $request->source_school_year_id;
        $targetId = $request->target_school_year_id;

        if ($sourceId === $targetId) {
            return $this->sendError('Source and target school years must be different', [], 422);
        }

        try {
            DB::beginTransaction();

            $sourceSections = DB::table('sections')
                ->where('school_year_id', $sourceId)
                ->where('is_active', true)
                ->get();

            if ($sourceSections->isEmpty()) {
                return $this->sendError('No sections found in the source school year', [], 422);
            }

            $now = now();
            $copied = 0;
            $skipped = 0;

            foreach ($sourceSections as $section) {
                // Skip if already exists in target year
                $exists = DB::table('sections')
                    ->where('school_year_id', $targetId)
                    ->where('grade_level_id', $section->grade_level_id)
                    ->where('section_name', $section->section_name)
                    ->exists();

                if ($exists) {
                    $skipped++;
                    continue;
                }

                DB::table('sections')->insert([
                    'section_name'       => $section->section_name,
                    'section_number'     => $section->section_number,
                    'grade_level_id'     => $section->grade_level_id,
                    'school_year_id'     => $targetId,
                    'adviser_id'         => null, // advisers must be re-assigned
                    'capacity'           => $section->capacity,
                    'current_enrollment' => 0,
                    'is_active'          => true,
                    'created_at'         => $now,
                    'updated_at'         => $now,
                ]);

                $copied++;
            }

            DB::commit();

            return $this->sendResponse([
                'copied'  => $copied,
                'skipped' => $skipped,
                'total'   => $sourceSections->count(),
            ], "Copied {$copied} sections to target school year. {$skipped} already existed.");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Copy sections failed', ['error' => $e->getMessage()]);
            return $this->sendError('Failed to copy sections', $e->getMessage());
        }
    }

    /**
     * POST /admin/promotion/bulk
     * Promotes all active students from current school year to target school year.
     * - Grade 7-11: move to next grade, assign to first available section in target year
     * - Grade 12: mark as graduated, deactivate
     */
    public function bulk(Request $request)
    {
        $request->validate([
            'current_school_year_id' => 'required|integer|exists:school_years,id',
            'target_school_year_id'  => 'required|integer|exists:school_years,id',
        ]);

        $currentYearId = $request->current_school_year_id;
        $targetYearId  = $request->target_school_year_id;

        if ($currentYearId === $targetYearId) {
            return $this->sendError('Current and target school years must be different', [], 422);
        }

        try {
            DB::beginTransaction();

            // Pre-load grade levels keyed by level_number
            $gradeLevels = GradeLevel::where('is_active', true)
                ->get()
                ->keyBy('level_number');

            // Pre-load target year sections grouped by grade_level_id
            // Pick the section with the most available capacity first
            $targetSections = Section::where('school_year_id', $targetYearId)
                ->where('is_active', true)
                ->orderByRaw('(capacity - current_enrollment) DESC')
                ->get()
                ->groupBy('grade_level_id');

            // Get all active students in current school year
            $students = Student::where('current_school_year_id', $currentYearId)
                ->where('is_active', true)
                ->whereIn('enrollment_status', ['active', 'promoted'])
                ->with('currentGradeLevel')
                ->get();

            $promotedCount  = 0;
            $graduatedCount = 0;
            $failedCount    = 0;
            $now            = now();

            foreach ($students as $student) {
                $currentLevelNumber = $student->currentGradeLevel?->level_number;

                if (!$currentLevelNumber || !isset(self::PROMOTION_MAP[$currentLevelNumber])) {
                    $failedCount++;
                    continue;
                }

                $nextLevelNumber = self::PROMOTION_MAP[$currentLevelNumber];

                // Grade 12 → graduated
                if ($nextLevelNumber === null) {
                    $student->update([
                        'enrollment_status'   => 'graduated',
                        'is_active'           => false,
                        'last_promotion_date' => $now,
                        'promotion_date'      => $now,
                    ]);
                    $graduatedCount++;
                    continue;
                }

                // Find next grade level
                $nextGradeLevel = $gradeLevels[$nextLevelNumber] ?? null;
                if (!$nextGradeLevel) {
                    $failedCount++;
                    continue;
                }

                // Find a section in the target year for the next grade
                $availableSections = $targetSections[$nextGradeLevel->id] ?? collect();
                $targetSection     = $availableSections->first(
                    fn($s) => $s->current_enrollment < $s->capacity
                );

                // Update student
                $student->update([
                    'current_grade_level_id' => $nextGradeLevel->id,
                    'current_section_id'     => $targetSection?->id,
                    'current_adviser_id'     => $targetSection?->adviser_id,
                    'current_school_year_id' => $targetYearId,
                    'grade_level'            => $nextGradeLevel->level_name,
                    'section'                => $targetSection?->section_name,
                    'enrollment_status'      => 'active',
                    'last_promotion_date'    => $now,
                    'promotion_date'         => $now,
                ]);

                // Increment section enrollment
                if ($targetSection) {
                    $targetSection->increment('current_enrollment');
                }

                $promotedCount++;
            }

            DB::commit();

            return $this->sendResponse([
                'promoted_count'  => $promotedCount,
                'graduated_count' => $graduatedCount,
                'failed_count'    => $failedCount,
                'total_processed' => $promotedCount + $graduatedCount + $failedCount,
            ], 'Bulk promotion completed successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bulk promotion failed', ['error' => $e->getMessage()]);
            return $this->sendError('Bulk promotion failed', $e->getMessage());
        }
    }
}
