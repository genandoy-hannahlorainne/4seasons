<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Auto-abandon planned drills whose 30-minute start window has passed — runs every minute
Schedule::command('drills:abandon-expired')->everyMinute();
