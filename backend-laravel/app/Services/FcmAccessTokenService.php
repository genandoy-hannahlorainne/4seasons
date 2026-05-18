<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FcmAccessTokenService
{
    private ?string $accessToken = null;
    private int $accessTokenExpiry = 0;

    public function getAccessToken(): ?string
    {
        if ($this->accessToken && time() < $this->accessTokenExpiry - 60) {
            return $this->accessToken;
        }

        $serviceAccountJson = config('webpush.fcm_service_account_json');
        if (empty($serviceAccountJson)) {
            Log::error('FCM: FCM_SERVICE_ACCOUNT_JSON not configured');
            return null;
        }

        $credentials = json_decode($serviceAccountJson, true);
        if (!$credentials) {
            Log::error('FCM: Failed to parse FCM_SERVICE_ACCOUNT_JSON');
            return null;
        }

        $clientEmail = $credentials['client_email'] ?? '';
        $privateKey  = $credentials['private_key']  ?? '';

        if (empty($clientEmail) || empty($privateKey)) {
            Log::error('FCM: Service account credentials incomplete');
            return null;
        }

        try {
            $now    = time();
            $header = $this->base64UrlEncode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
            $claims = $this->base64UrlEncode(json_encode([
                'iss'   => $clientEmail,
                'sub'   => $clientEmail,
                'scope' => 'https://www.googleapis.com/auth/cloud-platform',
                'aud'   => 'https://oauth2.googleapis.com/token',
                'iat'   => $now,
                'exp'   => $now + 3600,
            ]));

            $signingInput       = "{$header}.{$claims}";
            $privateKeyResource = openssl_pkey_get_private($privateKey);

            if (!$privateKeyResource) {
                Log::error('FCM: Failed to load private key');
                return null;
            }

            openssl_sign($signingInput, $signature, $privateKeyResource, 'SHA256');
            $jwt = "{$signingInput}." . $this->base64UrlEncode($signature);

            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion'  => $jwt,
            ]);

            if ($response->successful()) {
                $this->accessToken       = $response->json('access_token');
                $this->accessTokenExpiry = time() + ($response->json('expires_in') ?? 3600);
                return $this->accessToken;
            }

            Log::error('FCM: Token exchange failed: ' . $response->body());
            return null;
        } catch (\Throwable $e) {
            Log::error('FCM: Access token exception: ' . $e->getMessage());
            return null;
        }
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
