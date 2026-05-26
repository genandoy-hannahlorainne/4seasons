<?php

namespace App\Providers;

use App\Infrastructure\Sms\SemaphoreClient;
use App\Models\Student;
use App\Policies\SHDFPolicy;
use App\Services\SmsService;
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
        // Bind SemaphoreClient as a singleton so the HTTP client is reused
        // across multiple SMS sends within the same request lifecycle.
        $this->app->singleton(SemaphoreClient::class, function () {
            return new SemaphoreClient(
                apiKey:     config('services.semaphore.api_key', ''),
                senderName: config('services.semaphore.sender_name', 'SEMAPHORE'),
            );
        });

        // SmsService depends on SemaphoreClient — the container resolves it automatically.
        $this->app->singleton(SmsService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        date_default_timezone_set(config('app.timezone', 'Asia/Manila'));

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
