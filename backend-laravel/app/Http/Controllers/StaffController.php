<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StaffController extends Controller
{
    public function getDashboard(Request $request)
    {
        try {
            $userId = $request->user_id;
            
            $staff = DB::table('clinic_staff')
                ->where('user_id', $userId)
                ->first();

            if (!$staff) {
                return response()->json([
                    'success' => false,
                    'message' => 'Staff not found'
                ], 404);
            }

            // Get recent medical visits handled by this staff
            $recentVisits = DB::table('medical_visits')
                ->join('students', 'medical_visits.student_id', '=', 'students.student_id')
                ->where('medical_visits.clinic_staff_id', $staff->clinic_staff_id)
                ->orderBy('visit_datetime', 'desc')
                ->limit(20)
                ->select(
                    'medical_visits.*',
                    'students.first_name',
                    'students.last_name',
                    'students.student_number'
                )
                ->get();

            // Get today's visits
            $todayVisits = DB::table('medical_visits')
                ->join('students', 'medical_visits.student_id', '=', 'students.student_id')
                ->whereDate('medical_visits.visit_datetime', today())
                ->orderBy('visit_datetime', 'desc')
                ->select(
                    'medical_visits.*',
                    'students.first_name',
                    'students.last_name',
                    'students.student_number'
                )
                ->get();

            // Get pending visits (Open status)
            $pendingVisits = DB::table('medical_visits')
                ->join('students', 'medical_visits.student_id', '=', 'students.student_id')
                ->where('medical_visits.status', 'Open')
                ->orderBy('visit_datetime', 'desc')
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
                    'staff_info' => $staff,
                    'recent_visits' => $recentVisits,
                    'today_visits' => $todayVisits,
                    'pending_visits' => $pendingVisits,
                    'stats' => [
                        'total_visits_handled' => $recentVisits->count(),
                        'today_visits_count' => $todayVisits->count(),
                        'pending_visits_count' => $pendingVisits->count()
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