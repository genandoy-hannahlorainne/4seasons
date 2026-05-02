<?php

namespace App\Services;

use App\Mail\UserAccountCreated;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class MailService
{
    /**
     * Send the "Account Created" notification email.
     *
     * @param string|null $recipientEmail
     * @param array $userData
     * @param string $tempPassword
     * @param string $role
     * @return bool
     */
    public static function sendAccountCreatedEmail(?string $recipientEmail, array $userData, string $tempPassword, string $role): bool
    {
        if (empty($recipientEmail)) {
            return false;
        }

        try {
            Mail::to($recipientEmail)->send(new UserAccountCreated($userData, $tempPassword, $role));
            return true;
        } catch (\Exception $e) {
            Log::warning('Failed to send account creation email: ' . $e->getMessage(), [
                'recipient' => $recipientEmail,
                'role' => $role,
            ]);
            return false;
        }
    }
}
