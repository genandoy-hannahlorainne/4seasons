<?php

use Illuminate\Support\Facades\Route;
use App\Models\Adviser;
use App\Models\User;

Route::get('/test-adviser-data', function () {
    $advisers = Adviser::with('user')->get();

    $result = [];
    foreach ($advisers as $adviser) {
        $result[] = [
            'adviser_id' => $adviser->adviser_id,
            'user_id' => $adviser->user_id,
            'employee_id' => $adviser->employee_id,
            'birth_date' => $adviser->birth_date,
            'user_name' => $adviser->user ? $adviser->user->full_name : 'No user',
        ];
    }

    return response()->json([
        'success' => true,
        'count' => count($result),
        'advisers' => $result
    ]);
});
