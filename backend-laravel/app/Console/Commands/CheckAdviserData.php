<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Adviser;

class CheckAdviserData extends Command
{
    protected $signature = 'check:adviser-data';
    protected $description = 'Check adviser employee_id and birth_date data';

    public function handle()
    {
        $this->info('Checking Adviser Data...');

        $advisers = Adviser::with('user')->get();

        $this->info("Total Advisers: " . $advisers->count());

        foreach ($advisers as $adviser) {
            $this->line('---');
            $this->line('Adviser ID: ' . $adviser->adviser_id);
            $this->line('User ID: ' . $adviser->user_id);
            $this->line('User Name: ' . ($adviser->user ? $adviser->user->full_name : 'No user'));
            $this->line('Employee ID: ' . ($adviser->employee_id ?? 'NULL'));
            $this->line('Birth Date: ' . ($adviser->birth_date ?? 'NULL'));
        }

        return 0;
    }
}
