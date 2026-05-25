<?php

namespace App\Infrastructure\Sms;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Low-level HTTP client for the Semaphore SMS API.
 *
 * Responsibilities:
 *  - Authenticate requests with the configured API key
 *  - Send a single SMS message to one recipient
 *  - Return a structured result so callers can react to failures
 *    without catching exceptions
 *
 * @see https://semaphore.co/docs
 */
class SemaphoreClient
{
    private const API_BASE = 'https://api.semaphore.co/api/v4';

    public function __construct(
        private readonly string $apiKey,
        private readonly string $senderName,
    ) {}

    /**
     * Send an SMS to a single phone number.
     *
     * @param  string  $to      Recipient number (e.g. "09171234567" or "+639171234567")
     * @param  string  $message Message body (max 160 chars per segment)
     * @return array{success: bool, message_id: string|null, error: string|null}
     */
    public function send(string $to, string $message): array
    {
        $normalizedNumber = $this->normalizePhilippineNumber($to);

        if ($normalizedNumber === null) {
            Log::warning('SemaphoreClient: Invalid or unrecognized phone number format.', [
                'raw_number' => $to,
            ]);

            return [
                'success'    => false,
                'message_id' => null,
                'error'      => "Invalid phone number format: {$to}",
            ];
        }

        try {
            $response = Http::timeout(15)
                ->post(self::API_BASE . '/messages', [
                    'apikey'      => $this->apiKey,
                    'number'      => $normalizedNumber,
                    'message'     => $message,
                    'sendername'  => $this->senderName,
                ]);

            if ($response->successful()) {
                $body      = $response->json();
                $messageId = $body[0]['message_id'] ?? null;

                Log::info('SemaphoreClient: SMS sent successfully.', [
                    'to'         => $normalizedNumber,
                    'message_id' => $messageId,
                ]);

                return [
                    'success'    => true,
                    'message_id' => (string) $messageId,
                    'error'      => null,
                ];
            }

            $errorBody = $response->body();

            Log::warning('SemaphoreClient: SMS API returned non-2xx response.', [
                'status' => $response->status(),
                'body'   => $errorBody,
                'to'     => $normalizedNumber,
            ]);

            return [
                'success'    => false,
                'message_id' => null,
                'error'      => "HTTP {$response->status()}: {$errorBody}",
            ];
        } catch (\Throwable $e) {
            Log::error('SemaphoreClient: Exception while sending SMS.', [
                'to'        => $normalizedNumber,
                'exception' => $e->getMessage(),
            ]);

            return [
                'success'    => false,
                'message_id' => null,
                'error'      => $e->getMessage(),
            ];
        }
    }

    /**
     * Normalize a Philippine mobile number to the format Semaphore expects (09XXXXXXXXX).
     *
     * Accepts:
     *  - 09171234567
     *  - +639171234567
     *  - 639171234567
     *  - 9171234567
     *
     * Returns null when the number cannot be recognized as a valid PH mobile number.
     */
    private function normalizePhilippineNumber(string $number): ?string
    {
        // Strip all non-digit characters except leading +
        $cleaned = preg_replace('/[^\d+]/', '', $number);

        if ($cleaned === null || $cleaned === '') {
            return null;
        }

        // +63XXXXXXXXXX → 0XXXXXXXXXX
        if (str_starts_with($cleaned, '+63')) {
            $cleaned = '0' . substr($cleaned, 3);
        }

        // 63XXXXXXXXXX → 0XXXXXXXXXX
        if (str_starts_with($cleaned, '63') && strlen($cleaned) === 12) {
            $cleaned = '0' . substr($cleaned, 2);
        }

        // 9XXXXXXXXX (10 digits, missing leading 0) → 09XXXXXXXXX
        if (str_starts_with($cleaned, '9') && strlen($cleaned) === 10) {
            $cleaned = '0' . $cleaned;
        }

        // Final validation: must be 09XXXXXXXXX (11 digits)
        if (preg_match('/^09\d{9}$/', $cleaned)) {
            return $cleaned;
        }

        return null;
    }
}
