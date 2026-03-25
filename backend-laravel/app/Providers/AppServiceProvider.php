<?php

namespace App\Providers;

use App\Models\Student;
use App\Policies\SHDFPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register SHDF policy
        Gate::policy(Student::class, SHDFPolicy::class);

        // Custom route model binding for Student
        Route::bind('student', function ($value) {
            // First try to find by student_id (primary key)
            $student = Student::where('student_id', $value)->first();

            // If not found, try to find by user_id (for backward compatibility)
            if (!$student) {
                $student = Student::where('user_id', $value)->first();
            }

            // If still not found, throw ModelNotFoundException
            if (!$student) {
                throw new \Illuminate\Database\Eloquent\ModelNotFoundException();
            }

            return $student;
        });
    }
}
