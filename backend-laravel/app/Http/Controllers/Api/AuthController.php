<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\Student;
use App\Models\Adviser;
use App\Models\ClinicStaff;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
            if (!$user || !Hash::check($request->password, $user->password_hash)) {
                return $this->sendError('Invalid username or password', [], 401);
            }

            // Load role relationship
            $user->load('role');

            if  (!$user->role) {
                return $this->sendError('User role not found', [], 500);
            }

            // Validate role-specific profile exists
            $roleValidation =   $this->validateRoleProfile($user);
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

            // Create Sanctum token — expiry driven by security settings
            $sessionMinutes = \App\Models\SystemSetting::get('security', 'session_timeout_minutes', 1440);
            $token = $user->createToken('auth-token', ['*'], now()->addMinutes((int) $sessionMinutes))->plainTextToken;

            // Log activity
            $this->logActivity($user->user_id, 'Login', $request->ip());

            return $this->sendResponse([
                'user' => $userInfo,
                'token' => $token,
                'token_type' => 'Bearer',
                'expires_in' => $sessionMinutes * 60
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
     * Force change password for users who must change their password
     */
    public function forceChangePassword(Request $request)
    {
        try {
            // Validate request
            $minLength = \App\Models\SystemSetting::get('security', 'password_min_length', 6);
            $request->validate([
                'current_password' => 'required|string',
                'new_password'     => "required|string|min:{$minLength}|confirmed"
            ]);

            $user = $request->user();

            if (!$user) {
                return $this->sendError('Unauthorized', [], 401);
            }

            // Verify current password
            if (!Hash::check($request->current_password, $user->password_hash)) {
                return $this->sendError('Current password is incorrect', [], 400);
            }

            // Check if new password is different from current
            if (Hash::check($request->new_password, $user->password_hash)) {
                return $this->sendError('New password must be different from current password', [], 400);
            }

            // Update password and remove force change flag
            $user->update([
                'password_hash' => Hash::make($request->new_password),
                'password_must_change' => false,
                'password_changed_at' => now()
            ]);

            // Log activity
            $this->logActivity($user->user_id, 'Password Changed (Forced)', $request->ip());

            return $this->sendResponse([
                'message' => 'Password changed successfully'
            ], 'Password updated successfully');

        } catch (ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to change password', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Request password change (for non-admin users)
     */
    public function requestPasswordChange(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return $this->sendError('Unauthorized', [], 401);
            }

            $request->validate([
                'reason' => 'nullable|string|max:500',
                'new_password' => 'required|string|min:6|max:50'
            ]);

            // Create notification for admin
            \App\Models\Notification::create([
                'user_id' => $user->user_id,
                'channel' => 'System',
                'message' => "{$user->first_name} {$user->last_name} ({$user->role->role_name}) has requested a password change.",
                'status' => 'Pending',
                'priority' => 'normal',
                'notification_type' => 'password_change_request',
                'request_data' => [
                    'user_id' => $user->user_id,
                    'username' => $user->username,
                    'full_name' => trim($user->first_name . ' ' . $user->last_name),
                    'role' => $user->role->role_name,
                    'reason' => $request->reason ?? 'No reason provided',
                    'new_password' => $request->new_password,
                    'requested_at' => now()->toISOString()
                ]
            ]);

            return $this->sendResponse([
                'message' => 'Password change request submitted successfully. An admin will process your request.'
            ], 'Request submitted successfully');

        } catch (ValidationException $e) {
            return $this->sendValidationError($e->errors());
        } catch (\Exception $e) {
            return $this->sendError('Failed to submit password change request', [
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

                if (!$student) {
                    $student = $this->ensureStudentProfile($user);
                }

                return [
                    'valid' => !!$student,
                    'error' => $student ? '' : 'Student profile not found or inactive'
                ];

            case 'Adviser':
                $adviser = Adviser::where('user_id', $user->user_id)
                                 ->where('is_active', true)
                                 ->first();
                return [
                    'valid' => true,
                    'error' => $adviser ? '' : ''
                ];

            case 'Clinic Staff':
                $staff = ClinicStaff::where('user_id', $user->user_id)
                                   ->where('is_active', true)
                                   ->whereNull('deleted_at')
                                   ->first();
                return [
                    'valid' => true,
                    'error' => $staff ? '' : ''
                ];

            case 'Admin':
            case 'admin':
                return ['valid' => true, 'error' => ''];

            default:
                return ['valid' => false, 'error' => 'Invalid role'];
        }
    }

    private function ensureStudentProfile(User $user): ?Student
    {
        try {
            $nextStudentId = ((int) Student::max('student_id')) + 1;
            $studentNumber = 'AUTO-' . str_pad((string) $user->user_id, 6, '0', STR_PAD_LEFT);

            $existingNumber = Student::where('student_number', $studentNumber)->first();
            if ($existingNumber) {
                $studentNumber = 'AUTO-' . str_pad((string) $user->user_id, 6, '0', STR_PAD_LEFT) . '-' . now()->format('His');
            }

            $name = trim((string) ($user->full_name ?? ''));
            $parts = preg_split('/\s+/', $name);
            $firstName = $parts[0] ?? 'Student';
            $lastName = count($parts) > 1 ? $parts[count($parts) - 1] : 'User';

            return Student::create([
                'student_id' => $nextStudentId,
                'student_number' => $studentNumber,
                'user_id' => $user->user_id,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'gender' => 'Other',
                'is_active' => true,
            ]);
        } catch (\Throwable $e) {
            return null;
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
                        'staff_id'        => $staff->staff_id,
                        'staff_code'      => $staff->staff_code,
                        'position'        => $staff->position
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
    private function logActivity(int $userId, string $action, ?string $ipAddress): void
    {
        try {
            DB::table('activity_logs')->insert([
                'user_id' => $userId,
                'action' => $action,
                'ip_address' => $ipAddress ?? 'unknown',
                'created_at' => now()
            ]);
        } catch (\Exception $e) {
            // Log activity failure shouldn't break the main flow
            Log::warning('Failed to log activity', [
                'user_id' => $userId,
                'action' => $action,
                'error' => $e->getMessage()
            ]);
        }
    }
}
