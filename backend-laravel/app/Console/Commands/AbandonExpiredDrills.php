<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\EmergencyDrill;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class AbandonExpiredDrills extends Command
{
    protected $signature = 'drills:abandon-expired';
    protected $description = 'Mark planned drills as abandoned if their 5-minute start window has passed';

    public function handle(): void
    {
        $cutoff = Carbon::now()->subMinutes(5);

        $this->info('Checking for expired drills...');
        $this->info('Cutoff time: ' . $cutoff->toDateTimeString());

        // Debug: show all planned drills with scheduled_at
        $allPlanned = EmergencyDrill::where('status', 'planned')
            ->whereNotNull('scheduled_at')
            ->get(['id', 'drill_name', 'scheduled_at']);

        $this->info('Planned drills with schedule: ' . $allPlanned->count());
        foreach ($allPlanned as $d) {
            $this->info("  #{$d->id} {$d->drill_name} scheduled: {$d->scheduled_at}");
        }

        $expired = EmergencyDrill::where('status', 'planned')
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<', $cutoff)
            ->get();

        if ($expired->isEmpty()) {
            $this->info('No expired drills found.');
            return;
        }

        foreach ($expired as $drill) {
            $drill->update(['status' => 'abandoned']);
            Log::info('Drill auto-abandoned', [
                'drill_id'     => $drill->id,
                'drill_name'   => $drill->drill_name,
                'scheduled_at' => $drill->scheduled_at->toDateTimeString(),
            ]);
            $this->info("Abandoned drill #{$drill->id}: {$drill->drill_name}");
        }

        $this->info("Total abandoned: {$expired->count()}");
    }
}
