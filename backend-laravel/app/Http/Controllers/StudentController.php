<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentController extends Controller
{
    public function getProfile(Request $request)
    {
        try {
            $userId = $request->user_id; // This would come from auth middleware
            
            $student = DB::table('students')
                ->join('users', 'students.user_id', '=', 'users.user_id')
                ->where('students.user_id', $userId)
                ->select('students.*', 'users.email', 'users.phone')
                ->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'student' => $student
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateProfile(Request $request)
    {
        try {
            $userId = $request->user_id;
            
            DB::beginTransaction();

            // Update student record
            DB::table('students')
                ->where('user_id', $userId)
                ->update([
                    'first_name' => $request->firstName,
                    'middle_name' => $request->middleName,
                    'last_name' => $request->lastName,
                    'birth_date' => $request->birthDate,
                    'gender' => $request->gender,
                    'grade_level' => $request->gradeLevel,
                    'section' => $request->section,
                    'address' => $request->address,
                    'blood_type' => $request->bloodType,
                    'emergency_contact' => $request->emergencyContact
                ]);

            // Update user record
            DB::table('users')
                ->where('user_id', $userId)
                ->update([
                    'email' => $request->email,
                    'phone' => $request->phone,
                    'full_name' => $request->firstName . ' ' . $request->lastName
                ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getMedicalData(Request $request)
    {
        try {
            $userId = $request->user_id;
            
            $student = DB::table('students')
                ->where('user_id', $userId)
                ->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found'
                ], 404);
            }

            // Get allergies
            $allergies = DB::table('allergies')
                ->where('student_id', $student->student_id)
                ->get();

            // Get immunizations
            $immunizations = DB::table('immunizations')
                ->where('student_id', $student->student_id)
                ->get();

            // Get medical visits
            $visits = DB::table('medical_visits')
                ->leftJoin('clinic_staff', 'medical_visits.clinic_staff_id', '=', 'clinic_staff.clinic_staff_id')
                ->where('medical_visits.student_id', $student->student_id)
                ->select('medical_visits.*', 'clinic_staff.position as staff_position')
                ->orderBy('visit_datetime', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'medical_data' => [
                    'allergies' => $allergies,
                    'immunizations' => $immunizations,
                    'visits' => $visits
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get medical data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getQR(Request $request)
    {
        try {
            $userId = $request->user_id;
            
            $student = DB::table('students')
                ->where('user_id', $userId)
                ->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found'
                ], 404);
            }

            // Get or create QR code
            $qrCode = DB::table('qr_codes')
                ->where('student_id', $student->student_id)
                ->first();

            if (!$qrCode) {
                // Generate new QR token
                $token = bin2hex(random_bytes(16));
                
                DB::table('qr_codes')->insert([
                    'student_id' => $student->student_id,
                    'qr_token' => $token,
                    'qr_generated_at' => now(),
                    'qr_expires_at' => now()->addYear()
                ]);

                $qrCode = DB::table('qr_codes')
                    ->where('student_id', $student->student_id)
                    ->first();
            }

            return response()->json([
                'success' => true,
                'qr_data' => [
                    'token' => $qrCode->qr_token,
                    'student_number' => $student->student_number,
                    'full_name' => $student->first_name . ' ' . $student->last_name,
                    'generated_at' => $qrCode->qr_generated_at,
                    'expires_at' => $qrCode->qr_expires_at
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get QR code',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function generateQRImage($token)
    {
        try {
            $qrCode = DB::table('qr_codes')
                ->join('students', 'qr_codes.student_id', '=', 'students.student_id')
                ->where('qr_codes.qr_token', $token)
                ->select('qr_codes.*', 'students.student_number', 'students.first_name', 'students.last_name')
                ->first();

            if (!$qrCode) {
                return response()->json([
                    'success' => false,
                    'message' => 'QR code not found'
                ], 404);
            }

            // For now, return the QR data as JSON
            // In a full implementation, you'd generate an actual QR code image
            return response()->json([
                'success' => true,
                'qr_data' => [
                    'token' => $qrCode->qr_token,
                    'student_number' => $qrCode->student_number,
                    'student_name' => $qrCode->first_name . ' ' . $qrCode->last_name,
                    'url' => url('/api/generate-qr-image/' . $token)
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate QR image',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}