<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\Student;
use App\Models\Adviser;
use App\Models\ClinicStaff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthController extends BaseController
{
    /**
     * Login user and create token
     */
    public function login(Request $request)
    {
        try {
            // Validate request
            $request->validate([
                'username' => 'required|string',
                'password' => 'required|string'
            ]);

            // Find user
            $user = User::where('username', $request->username)
                       ->where('is_active', true)
                       ->whereNull('deleted_at')
                       ->first();

            // Check if user exists and password is correct
            if (!$user || !password_verify($request->password, $user->password_hash)) {
                return $this->sendError('Invalid username or password', [], 401);
            }

            // Load role relationship
            $user->load('role');
            
            if (!$user->role) {
                return $this->sendError('User role not found', [], 500);
            }

            // Validate role-specific profile exists
            $roleValidation = $this->validateRoleProfile($user);
            if (!$roleValidation['valid']) {
                return $this->sendError('Access denied: ' . $roleValidation['error'] . '. You cannot login with this account.', [], 403);
            }

            // Prepare user info (exclude password_hash)
            $userInfo = [
                'user_id' => $user->user_id,
                'username' => $user->username,
                'email' => $user->email,
                'full_name' => $user->full_name,
                'role_id' => $user->role_id,
                'role_name' => $user->role->role_name,
                'password_must_change' => (bool)$user->password_must_change
            ];

            // Fetch role-specific data
            $userInfo = $this->addRoleSpecificData($user, $userInfo);

            // Create Sanctum token
            $token = $user->createToken('auth-token', ['*'], now()->addHours(24))->plainTextToken;

            // Log activity
            $this->logActivity($user->user_id, 'Login', $request->ip());

            return $this->sendResponse([
                'user' => $userInfo,
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => 24 * 60 * 60 // 24 hours in seconds
            ], 'Login successful');

        } catch (ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Login failed', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    /**
     * Logout user and revoke token
     */
    public function logout(Request $request)
    {
        try {
            // Get the authenticated user
            $user = $request->user();
            
            if ($user) {
                // Log activity
                $this->logActivity($user->user_id, 'Logout', $request->ip());
                
                // Revoke current token
                $request->user()->currentAccessToken()->delete();
            }

            return $this->sendResponse([], 'Logout successful');

        } catch (\Exception $e) {
            return $this->sendError('Logout failed', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Refresh token
     */
    public function refresh(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return $this->sendError('Unauthorized', [], 401);
            }

            // Revoke current token
            $request->user()->currentAccessToken()->delete();

            // Create new token
            $token = $user->createToken('auth-token', ['*'], now()->addHours(24))->plainTextToken;

            return $this->sendResponse([
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => 24 * 60 * 60
            ], 'Token refreshed successfully');

        } catch (\Exception $e) {
            return $this->sendError('Token refresh failed', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get authenticated user info
     */
    public function me(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return $this->sendError('Unauthorized', [], 401);
            }

            // Load user with role
            $user->load('role');

            // Prepare user info
            $userInfo = [
                'user_id' => $user->user_id,
                'username' => $user->username,
                'email' => $user->email,
                'full_name' => $user->full_name,
                'role_id' => $user->role_id,
                'role_name' => $user->role->role_name,
                'password_must_change' => (bool)$user->password_must_change
            ];

            // Add role-specific data
            $userInfo = $this->addRoleSpecificData($user, $userInfo);

            return $this->sendResponse($userInfo, 'User info retrieved successfully');

        } catch (\Exception $e) {
            return $this->sendError('Failed to get user info', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate role-specific profile exists
     */
    private function validateRoleProfile(User $user): array
    {
        $roleName = $user->role->role_name;

        switch ($roleName) {
            case 'Student':
                $student = Student::where('user_id', $user->user_id)
                                 ->where('is_active', true)
                                 ->first();
                return [
                    'valid' => !!$student,
                    'error' => $student ? '' : 'Student profile not found or inactive'
                ];

            case 'Adviser':
                $adviser = Adviser::where('user_id', $user->user_id)
                                 ->where('is_active', true)
                                 ->first();
                return [
                    'valid' => !!$adviser,
                    'error' => $adviser ? '' : 'Adviser profile not found or inactive'
                ];

            case 'Clinic Staff':
                $staff = ClinicStaff::where('user_id', $user->user_id)
                                   ->where('is_active', true)
                                   ->whereNull('deleted_at')
                                   ->first();
                return [
                    'valid' => !!$staff,
                    'error' => $staff ? '' : 'Clinic staff profile not found or inactive'
                ];

            case 'Admin':
            case 'admin':
                return ['valid' => true, 'error' => ''];

            default:
                return ['valid' => false, 'error' => 'Invalid role'];
        }
    }

    /**
     * Add role-specific data to user info
     */
    private function addRoleSpecificData(User $user, array $userInfo): array
    {
        $roleName = $user->role->role_name;

        switch ($roleName) {
            case 'Student':
                $student = Student::where('user_id', $user->user_id)
                                 ->where('is_active', true)
                                 ->first();
                if ($student) {
                    $userInfo['student_info'] = [
                        'student_id' => $student->student_id,
                        'student_number' => $student->student_number,
                        'first_name' => $student->first_name,
                        'last_name' => $student->last_name
                    ];
                }
                break;

            case 'Adviser':
                $adviser = Adviser::where('user_id', $user->user_id)
                                 ->where('is_active', true)
                                 ->first();
                if ($adviser) {
                    $userInfo['adviser_info'] = [
                        'adviser_id' => $adviser->adviser_id,
                        'employee_id' => $adviser->employee_id,
                        'contact_phone' => $adviser->contact_phone
                    ];
                }
                break;

            case 'Clinic Staff':
                $staff = ClinicStaff::where('user_id', $user->user_id)
                                   ->where('is_active', true)
                                   ->whereNull('deleted_at')
                                   ->first();
                if ($staff) {
                    $userInfo['staff_info'] = [
                        'clinic_staff_id' => $staff->clinic_staff_id,
                        'staff_id' => $staff->staff_id,
                        'position' => $staff->position
                    ];
                } else {
                    $userInfo['staff_info'] = ['clinic_staff_id' => null];
                }
                break;

            case 'Admin':
            case 'admin':
                $userInfo['admin_info'] = [
                    'is_admin' => true
                ];
                break;
        }

        return $userInfo;
    }

    /**
     * Log user activity
     */
    private function logActivity(int $userId, string $action, string $ipAddress): void
    {
        try {
            DB::table('activity_logs')->insert([
                'user_id' => $userId,
                'action' => $action,
                'ip_address' => $ipAddress,
                'created_at' => now()
            ]);
        } catch (\Exception $e) {
            // Log activity failure shouldn't break the main flow
            \Log::warning('Failed to log activity', [
                'user_id' => $userId,
                'action' => $action,
                'error' => $e->getMessage()
            ]);
        }
    }
}