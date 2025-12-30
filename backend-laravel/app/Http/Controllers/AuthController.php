<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'username' => 'required|string',
                'password' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Username and password are required'
                ], 400);
            }

            // Get user with role information
            $user = DB::table('users')
                ->join('roles', 'users.role_id', '=', 'roles.role_id')
                ->where('users.username', $request->username)
                ->where('users.is_active', 1)
                ->whereNull('users.deleted_at')
                ->select(
                    'users.user_id',
                    'users.username',
                    'users.password_hash',
                    'users.email',
                    'users.full_name',
                    'users.role_id',
                    'roles.role_name'
                )
                ->first();

            if (!$user || !Hash::check($request->password, $user->password_hash)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid username or password'
                ], 401);
            }

            // Get role-specific information
            $userInfo = [
                'user_id' => $user->user_id,
                'username' => $user->username,
                'email' => $user->email,
                'full_name' => $user->full_name,
                'role_id' => $user->role_id,
                'role_name' => $user->role_name
            ];

            // Fetch role-specific data
            if ($user->role_name === 'Student') {
                $studentInfo = DB::table('students')
                    ->where('user_id', $user->user_id)
                    ->where('is_active', 1)
                    ->select('student_id', 'student_number', 'first_name', 'last_name')
                    ->first();
                if ($studentInfo) {
                    $userInfo['student_info'] = $studentInfo;
                }
            } elseif ($user->role_name === 'Adviser') {
                $adviserInfo = DB::table('advisers')
                    ->where('user_id', $user->user_id)
                    ->where('is_active', 1)
                    ->select('adviser_id', 'first_name', 'last_name', 'employee_number')
                    ->first();
                if ($adviserInfo) {
                    $userInfo['adviser_info'] = $adviserInfo;
                }
            } elseif ($user->role_name === 'Clinic Staff') {
                $staffInfo = DB::table('clinic_staff')
                    ->where('user_id', $user->user_id)
                    ->where('is_active', 1)
                    ->select('clinic_staff_id', 'staff_code', 'position')
                    ->first();
                if ($staffInfo) {
                    $userInfo['staff_info'] = $staffInfo;
                }
            }

            // Log activity
            DB::table('activity_logs')->insert([
                'user_id' => $user->user_id,
                'action' => 'Login',
                'ip_address' => $request->ip(),
                'created_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'user' => $userInfo
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
        // Step 1: Basic validation
        if (empty($request->role) || empty($request->password) || empty($request->firstName) || empty($request->lastName)) {
            return response()->json([
                'success' => false,
                'message' => 'Missing required fields: role, password, firstName, lastName'
            ], 400);
        }

        // Step 2: Test database connection
        try {
            DB::connection()->getPdo();
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Database connection failed: ' . $e->getMessage()
            ], 500);
        }

        // Step 3: Check roles
        try {
            $roleMap = [
                'student' => 'Student',
                'adviser' => 'Adviser', 
                'clinic-staff' => 'Clinic Staff'
            ];

            if (!isset($roleMap[$request->role])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid role: ' . $request->role
                ], 400);
            }

            $roleName = $roleMap[$request->role];
            $role = DB::table('roles')->where('role_name', $roleName)->first();

            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => 'Role not found in database: ' . $roleName
                ], 400);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error checking roles: ' . $e->getMessage()
            ], 500);
        }

        // Step 4: Create username
        try {
            if ($request->role === 'student' && !empty($request->studentNumber)) {
                $username = $request->studentNumber;
            } else {
                $username = strtolower($request->firstName . '.' . $request->lastName);
            }

            // Check if username exists
            $existingUser = DB::table('users')->where('username', $username)->first();
            if ($existingUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Username already exists: ' . $username
                ], 400);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error checking username: ' . $e->getMessage()
            ], 500);
        }

        // Step 5: Insert user
        try {
            DB::beginTransaction();

            $fullName = trim($request->firstName . ' ' . ($request->middleName ?? '') . ' ' . $request->lastName);

            $userId = DB::table('users')->insertGetId([
                'role_id' => $role->role_id,
                'username' => $username,
                'password_hash' => Hash::make($request->password),
                'email' => $request->email,
                'phone' => $request->contactNumber,
                'full_name' => $fullName,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            if (!$userId) {
                throw new \Exception('Failed to create user');
            }

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error creating user: ' . $e->getMessage()
            ], 500);
        }

        // Step 6: Insert role-specific data
        try {
            if ($request->role === 'student') {
                if (empty($request->studentNumber)) {
                    throw new \Exception('Student number is required for students');
                }

                // Fix gender mapping
                $gender = 'Other'; // Default
                if (!empty($request->gender)) {
                    $genderLower = strtolower($request->gender);
                    if ($genderLower === 'male') {
                        $gender = 'M';
                    } elseif ($genderLower === 'female') {
                        $gender = 'F';
                    } else {
                        $gender = 'Other';
                    }
                }

                DB::table('students')->insert([
                    'user_id' => $userId,
                    'student_number' => $request->studentNumber,
                    'first_name' => $request->firstName,
                    'middle_name' => $request->middleName ?? null,
                    'last_name' => $request->lastName,
                    'birth_date' => $request->birthday ?? null,
                    'gender' => $gender,
                    'created_at' => now()
                ]);

            } elseif ($request->role === 'adviser') {
                DB::table('advisers')->insert([
                    'user_id' => $userId,
                    'first_name' => $request->firstName,
                    'last_name' => $request->lastName,
                    'contact_phone' => $request->contactNumber ?? null,
                    'created_at' => now()
                ]);

            } elseif ($request->role === 'clinic-staff') {
                DB::table('clinic_staff')->insert([
                    'user_id' => $userId,
                    'position' => 'Staff',
                    'created_at' => now()
                ]);
            }

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error creating role-specific data: ' . $e->getMessage()
            ], 500);
        }

        // Step 7: Log activity
        try {
            DB::table('activity_logs')->insert([
                'user_id' => $userId,
                'action' => 'Registration',
                'ip_address' => $request->ip(),
                'created_at' => now()
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Registration successful',
                'username' => $username,
                'user_id' => $userId
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error logging activity: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getProfile(Request $request)
    {
        try {
            $userId = $request->user_id;

            if (!$userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID is required'
                ], 400);
            }

            // Get user with role information
            $user = DB::table('users')
                ->join('roles', 'users.role_id', '=', 'roles.role_id')
                ->where('users.user_id', $userId)
                ->where('users.is_active', 1)
                ->whereNull('users.deleted_at')
                ->select(
                    'users.user_id',
                    'users.username',
                    'users.email',
                    'users.phone',
                    'users.full_name',
                    'users.role_id',
                    'roles.role_name'
                )
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            $profile = [
                'user_id' => $user->user_id,
                'username' => $user->username,
                'email' => $user->email,
                'phone' => $user->phone,
                'full_name' => $user->full_name,
                'role_id' => $user->role_id,
                'role_name' => $user->role_name
            ];

            // Get role-specific information
            if ($user->role_name === 'Student') {
                $studentInfo = DB::table('students')
                    ->where('user_id', $user->user_id)
                    ->where('is_active', 1)
                    ->first();
                if ($studentInfo) {
                    $profile['student_info'] = $studentInfo;
                }
            } elseif ($user->role_name === 'Adviser') {
                $adviserInfo = DB::table('advisers')
                    ->where('user_id', $user->user_id)
                    ->where('is_active', 1)
                    ->first();
                if ($adviserInfo) {
                    $profile['adviser_info'] = $adviserInfo;
                }
            } elseif ($user->role_name === 'Clinic Staff') {
                $staffInfo = DB::table('clinic_staff')
                    ->where('user_id', $user->user_id)
                    ->where('is_active', 1)
                    ->first();
                if ($staffInfo) {
                    $profile['staff_info'] = $staffInfo;
                }
            }

            return response()->json([
                'success' => true,
                'profile' => $profile
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function changePassword(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|integer',
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:6',
                'confirm_password' => 'required|string|same:new_password'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 400);
            }

            // Get user
            $user = DB::table('users')
                ->where('user_id', $request->user_id)
                ->where('is_active', 1)
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Verify current password
            if (!Hash::check($request->current_password, $user->password_hash)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect'
                ], 400);
            }

            // Update password
            DB::table('users')
                ->where('user_id', $request->user_id)
                ->update([
                    'password_hash' => Hash::make($request->new_password),
                    'updated_at' => now()
                ]);

            // Log activity
            DB::table('activity_logs')->insert([
                'user_id' => $request->user_id,
                'action' => 'Password Change',
                'ip_address' => $request->ip(),
                'created_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to change password',
                'error' => $e->getMessage()
            ], 500);
        }
    }