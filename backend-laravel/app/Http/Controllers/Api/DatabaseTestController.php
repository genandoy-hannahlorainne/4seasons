<?php

namespace App\Http\Controllers\Api;

use App\Models\Role;
use App\Models\User;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DatabaseTestController extends BaseController
{
    /**
     * Test database connectivity and basic queries
     */
    public function testConnection()
    {
        try {
            // Test basic connection
            DB::connection()->getPdo();
            
            // Test basic queries with error handling
            $roleCount = 0;
            $userCount = 0;
            $studentCount = 0;
            $roles = [];
            $sampleUser = null;
            
            try {
                $roleCount = Role::count();
            } catch (\Exception $e) {
                // Role model might have issues
            }
            
            try {
                $userCount = User::count();
            } catch (\Exception $e) {
                // User model might have issues
            }
            
            try {
                $studentCount = Student::count();
            } catch (\Exception $e) {
                // Student model might have issues
            }
            
            try {
                $roles = Role::all();
            } catch (\Exception $e) {
                // Role query might have issues
            }
            
            try {
                $sampleUser = User::first();
            } catch (\Exception $e) {
                // User query might have issues
            }
            
            return $this->sendResponse([
                'database_connection' => 'successful',
                'counts' => [
                    'roles' => $roleCount,
                    'users' => $userCount,
                    'students' => $studentCount
                ],
                'roles' => $roles,
                'sample_user' => $sampleUser,
                'timestamp' => now()->toISOString()
            ], 'Database connection test successful');
            
        } catch (\Exception $e) {
            return $this->sendError('Database connection failed', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }
    
    /**
     * Test model relationships
     */
    public function testRelationships()
    {
        try {
            // Test User -> Role relationship
            $userWithRole = User::with('role')->first();
            
            // Test Student -> User relationship
            $studentWithUser = Student::with('user')->first();
            
            // Test Student -> Medical History relationship
            $studentWithMedicalHistory = Student::with('medicalHistory')->first();
            
            return $this->sendResponse([
                'user_with_role' => $userWithRole,
                'student_with_user' => $studentWithUser,
                'student_with_medical_history' => $studentWithMedicalHistory,
                'timestamp' => now()->toISOString()
            ], 'Model relationships test successful');
            
        } catch (\Exception $e) {
            return $this->sendError('Model relationships test failed', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }
}