<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Checking actual status values in database:\n";

$statusValues = DB::select("SELECT DISTINCT status FROM medical_visits WHERE status IS NOT NULL");

echo "Status values found:\n";
foreach ($statusValues as $status) {
    echo "  - " . $status->status . "\n";
}

echo "\nStatus counts:\n";
$counts = DB::select("SELECT status, COUNT(*) as count FROM medical_visits GROUP BY status");
foreach ($counts as $count) {
    echo "  - " . ($count->status ?? 'NULL') . ": " . $count->count . "\n";
}

echo "\nAll columns in medical_visits table:\n";
$tableInfo = DB::select("DESCRIBE medical_visits");
foreach ($tableInfo as $column) {
    echo "  - " . $column->Field . " (" . $column->Type . ")\n";
}