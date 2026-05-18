<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

/**
 * Resolves Firebase service account credentials without fragile .env JSON parsing.
 * Prefer FCM_SERVICE_ACCOUNT_PATH (file mount) in production Docker.
 */
class FcmCredentialsResolver
{
    public function resolveJson(): ?string
    {
        $path = trim((string) config('webpush.fcm_service_account_path', ''));
        if ($path !== '' && is_readable($path)) {
            $contents = file_get_contents($path);
            if ($contents !== false && trim($contents) !== '') {
                return $contents;
            }
            Log::error("FCM: Cannot read service account file at {$path}");
        }

        $json = trim((string) config('webpush.fcm_service_account_json', ''));
        if ($json !== '') {
            return $json;
        }

        $clientEmail = trim((string) config('webpush.fcm_client_email', ''));
        $privateKey  = trim((string) config('webpush.fcm_private_key', ''));

        if ($clientEmail === '' || $privateKey === '') {
            return null;
        }

        return json_encode([
            'type'                        => 'service_account',
            'project_id'                  => config('webpush.fcm_project_id', ''),
            'client_email'                => $clientEmail,
            'private_key'                 => str_replace('\\n', "\n", $privateKey),
            'token_uri'                   => 'https://oauth2.googleapis.com/token',
            'auth_uri'                    => 'https://accounts.google.com/o/oauth2/auth',
            'auth_provider_x509_cert_url' => 'https://www.googleapis.com/oauth2/v1/certs',
        ]);
    }

    public function resolveCredentials(): ?array
    {
        $json = $this->resolveJson();
        if ($json === null) {
            return null;
        }

        $credentials = json_decode($json, true);
        if (!is_array($credentials)) {
            Log::error('FCM: Service account JSON is invalid');
            return null;
        }

        return $credentials;
    }
}
