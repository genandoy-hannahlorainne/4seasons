<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DeduplicateSections extends Command
{
    protected $signature = 'db:deduplicate-sections';
    protected $description = 'Remove duplicate sections, keeping the one with an adviser assigned';

    public function handle()
    {
        // Show current duplicates first
        $duplicates = DB::select("
            SELECT section_name, grade_level_id, school_year_id, COUNT(*) as cnt
            FROM sections
            GROUP BY section_name, grade_level_id, school_year_id
            HAVING cnt > 1
        ");

        if (empty($duplicates)) {
            $this->info('No duplicate sections found.');
            return;
        }

        $this->info('Found ' . count($duplicates) . ' duplicate section groups. Cleaning up...');

        $deleted = 0;
        foreach ($duplicates as $dup) {
            // Get all rows for this duplicate group, ordered: rows WITH adviser first
            $rows = DB::table('sections')
                ->where('section_name', $dup->section_name)
                ->where('grade_level_id', $dup->grade_level_id)
                ->where('school_year_id', $dup->school_year_id)
                ->orderByRaw('adviser_id IS NULL ASC') // rows with adviser come first
                ->orderBy('id', 'asc')
                ->get();

            // Keep the first one (has adviser), delete the rest
            $keepId = $rows->first()->id;
            $deleteIds = $rows->skip(1)->pluck('id')->toArray();

            DB::table('sections')->whereIn('id', $deleteIds)->delete();
            $deleted += count($deleteIds);

            $this->line("  Kept section id={$keepId} ({$dup->section_name}), deleted ids: " . implode(', ', $deleteIds));
        }

        $this->info("Done. Removed {$deleted} duplicate section(s).");
    }
}
