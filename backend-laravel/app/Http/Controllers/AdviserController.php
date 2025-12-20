<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdviserController extends Controller
{
    public function getDashboard(Request $request)
    {
        try {
            $userId = $request->user_id;
            
            $adviser = DB::table('advisers')
                ->where('user_id', $userId)
                ->first();

            if (!$adviser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Adviser not found'
                ], 404);
            }

            // Get assigned students
            $students = DB::table('student_adviser')
                ->join('students', 'student_adviser.student_id', '=', 'students.student_id')
                ->join('users', 'students.user_id', '=', 'users.user_id')
                ->where('student_adviser.adviser_id', $adviser->adviser_id)
                ->select(
                    'students.*',
                    'users.email',
                    'users.phone',
                    'student_adviser.assigned_date'
                )
                ->get();

            // Get recent medical visits for assigned students
            $studentIds = $students->pluck('student_id');
            
            $recentVisits = DB::table('medical_visits')
                ->join('students', 'medical_visits.student_id', '=', 'students.student_id')
                ->whereIn('medical_visits.student_id', $studentIds)
                ->orderBy('visit_datetime', 'desc')
                ->limit(10)
                ->select(
                    'medical_visits.*',
                    'students.first_name',
                    'students.last_name',
                    'students.student_number'
                )
                ->get();

            return response()->json([
                'success' => true,
                'dashboard_data' => [
                    'adviser_info' => $adviser,
                    'assigned_students' => $students,
                    'recent_visits' => $recentVisits,
                    'stats' => [
                        'total_students' => $students->count(),
                        'recent_visits_count' => $recentVisits->count()
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get dashboard data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}