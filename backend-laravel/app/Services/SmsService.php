<?php

namespace App\Services;

use App\Infrastructure\Sms\SemaphoreClient;
use App\Models\MedicalVisit;
use App\Models\Student;
use Illuminate\Support\Facades\Log;

/**
 * High-level SMS service.
 *
 * Responsibilities:
 *  - Compose human-readable SMS messages for clinic events
 *  - Resolve the correct recipient number from a Student record
 *  - Delegate the actual HTTP call to SemaphoreClient
 *  - Guard against missing configuration or missing contact numbers
 *    so callers never need to handle those edge cases
 */
class SmsService
{
    public function __construct(
        private readonly SemaphoreClient $client,
    ) {}

    /**
     * Send an emergency-visit SMS notification to the student's emergency contact.
     *
     * This method is intentionally non-throwing — a failed SMS must never
     * roll back a medical visit or surface a 500 to the clinic staff.
     *
     * @param  MedicalVisit  $visit   The newly created visit (student relationship must be loaded)
     * @param  Student       $student The student associated with the visit
     * @return bool                   True when the SMS was accepted by the API
     */
    public function notifyEmergencyContact(MedicalVisit $visit, Student $student): bool
    {
        if (!config('services.semaphore.enabled', false)) {
            Log::info('SmsService: SMS notifications are disabled (SEMAPHORE_ENABLED=false). Skipping.');
            return false;
        }

        $recipientPhone = $this->resolveRecipientPhone($student);

        if ($recipientPhone === null) {
            Log::warning('SmsService: No emergency contact phone found for student. SMS skipped.', [
                'student_id' => $student->student_id,
            ]);
            return false;
        }

        $message = $this->buildEmergencyVisitMessage($visit, $student);

        $result = $this->client->send($recipientPhone, $message);

        if ($result['success']) {
            Log::info('SmsService: Emergency contact notified via SMS.', [
                'student_id'  => $student->student_id,
                'visit_id'    => $visit->visit_id,
                'message_id'  => $result['message_id'],
                'recipient'   => $recipientPhone,
            ]);
        } else {
            Log::error('SmsService: Failed to send emergency contact SMS.', [
                'student_id' => $student->student_id,
                'visit_id'   => $visit->visit_id,
                'error'      => $result['error'],
            ]);
        }

        return $result['success'];
    }

    /**
     * Compose the SMS body for an emergency clinic visit.
     *
     * Kept under 160 characters when possible so it fits in a single SMS segment.
     */
    private function buildEmergencyVisitMessage(MedicalVisit $visit, Student $student): string
    {
        $studentName   = trim($student->first_name . ' ' . $student->last_name);
        $contactName   = $student->emergency_contact ?? 'Guardian';
        $complaint     = $visit->chief_complaint ?? 'unspecified complaint';
        $visitTime     = $visit->visit_datetime
            ? $visit->visit_datetime->timezone('Asia/Manila')->format('M j, Y g:i A')
            : now()->timezone('Asia/Manila')->format('M j, Y g:i A');
        $schoolName    = config('app.name', 'School Clinic');

        return "Dear {$contactName}, your student {$studentName} had an EMERGENCY clinic visit on {$visitTime}. "
             . "Reason: {$complaint}. Please contact {$schoolName} immediately for more information.";
    }

    /**
     * Resolve the best available phone number to send the SMS to.
     *
     * Priority:
     *  1. emergency_contact_phone  (dedicated emergency contact number)
     *  2. phone                    (student's own phone, as a last resort)
     */
    private function resolveRecipientPhone(Student $student): ?string
    {
        $emergencyPhone = trim((string) ($student->emergency_contact_phone ?? ''));
        if ($emergencyPhone !== '') {
            return $emergencyPhone;
        }

        $studentPhone = trim((string) ($student->phone ?? ''));
        if ($studentPhone !== '') {
            return $studentPhone;
        }

        return null;
    }
}
