<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

// Simple test route
Route::get('/simple', function () {
    return response()->json(['message' => 'Simple route working']);
});

// Medical record route
Route::get('/medical', function (Request $request) {
    try {
        $userId = $request->query('user_id', 19);
        
        $student = DB::table('students')->where('user_id', $userId)->first();
        
        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'personal_info' => [
                    'student_id' => $student->student_id,
                    'student_number' => $student->student_number,
                    'full_name' => trim($student->first_name . ' ' . ($student->middle_name ? $student->middle_name . ' ' : '') . $student->last_name),
                    'birth_date' => $student->birth_date,
                    'gender' => $student->gender,
                    'blood_type' => $student->blood_type,
                    'address' => $student->address,
                    'emergency_contact' => $student->emergency_contact,
                    'grade_level' => $student->grade_level,
                    'section' => $student->section
                ],
                'allergies' => [],
                'recent_visits_count' => 0,
                'total_visits_count' => 0
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
});