<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Username and password are required',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            // Get user from database
            $user = DB::table('users')
                ->join('roles', 'users.role_id', '=', 'roles.role_id')
                ->where('users.username', $request->username)
                ->where('users.is_active', 1)
                ->whereNull('users.deleted_at')
                ->select('users.*', 'roles.role_name')
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid username or password'
                ], 401);
            }

            // Verify password
            if (!Hash::check($request->password, $user->password_hash)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid username or password'
                ], 401);
            }

            // Get role-specific data
            $roleData = null;
            switch ($user->role_name) {
                case 'Student':
                    $roleData = DB::table('students')
                        ->where('user_id', $user->user_id)
                        ->first();
                    break;
                case 'Adviser':
                    $roleData = DB::table('advisers')
                        ->where('user_id', $user->user_id)
                        ->first();
                    break;
                case 'Clinic Staff':
                    $roleData = DB::table('clinic_staff')
                        ->where('user_id', $user->user_id)
                        ->first();
                    break;
                case 'Parent':
                    $roleData = DB::table('parents')
                        ->where('user_id', $user->user_id)
                        ->first();
                    break;
            }

            // Log activity
            DB::table('activity_logs')->insert([
                'user_id' => $user->user_id,
                'action' => 'login',
                'details' => 'User logged in successfully',
                'ip_address' => $request->ip(),
                'created_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'user_id' => $user->user_id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'full_name' => $user->full_name,
                    'role_name' => $user->role_name,
                    'role_data' => $roleData
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Login failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'role' => 'required|string',
            'firstName' => 'required|string',
            'lastName' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            DB::beginTransaction();

            $role = strtolower($request->role);
            
            // Get role_id
            $roleRecord = DB::table('roles')
                ->where('role_name', 'LIKE', $role . '%')
                ->first();

            if (!$roleRecord) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid role'
                ], 400);
            }

            // Determine username based on role
            $username = '';
            if ($role === 'student') {
                $username = $request->studentNumber;
            } elseif ($role === 'adviser') {
                $username = strtolower($request->firstName . '.' . $request->lastName);
            } else {
                $username = strtolower($request->email);
            }

            // Check if username exists
            $existingUser = DB::table('users')
                ->where('username', $username)
                ->first();

            if ($existingUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Username already exists'
                ], 400);
            }

            // Create user
            $userId = DB::table('users')->insertGetId([
                'role_id' => $roleRecord->role_id,
                'username' => $username,
                'password_hash' => Hash::make($request->password),
                'email' => $request->email,
                'phone' => $request->contactNumber ?? null,
                'full_name' => $request->firstName . ' ' . $request->lastName,
                'created_at' => now(),
                'is_active' => 1
            ]);

            // Create role-specific record
            if ($role === 'student') {
                DB::table('students')->insert([
                    'user_id' => $userId,
                    'student_number' => $request->studentNumber,
                    'first_name' => $request->firstName,
                    'middle_name' => $request->middleName ?? null,
                    'last_name' => $request->lastName,
                    'birth_date' => $request->birthday ?? null,
                    'gender' => $request->gender ?? 'Other',
                    'created_at' => now(),
                    'is_active' => 1
                ]);
            } elseif ($role === 'adviser') {
                DB::table('advisers')->insert([
                    'user_id' => $userId,
                    'first_name' => $request->firstName,
                    'last_name' => $request->lastName,
                    'contact_phone' => $request->contactNumber ?? null,
                    'created_at' => now(),
                    'is_active' => 1
                ]);
            }

            // Log activity
            DB::table('activity_logs')->insert([
                'user_id' => $userId,
                'action' => 'register',
                'details' => 'New user registered',
                'ip_address' => $request->ip(),
                'created_at' => now()
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Registration successful',
                'username' => $username
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer',
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $user = DB::table('users')
                ->where('user_id', $request->user_id)
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            if (!Hash::check($request->current_password, $user->password_hash)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect'
                ], 401);
            }

            DB::table('users')
                ->where('user_id', $request->user_id)
                ->update([
                    'password_hash' => Hash::make($request->new_password)
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Password change failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}