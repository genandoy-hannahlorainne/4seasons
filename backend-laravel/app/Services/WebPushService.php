<?php

namespace App\Services;

use App\Models\PushSubscription;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Sends Web Push notifications using the VAPID protocol.
 *
 * We implement VAPID signing manually so we don't need the
 * minishlink/web-push package (which requires ext-gmp).
 */
class WebPushService
{
    private string $vapidPublicKey;
    private string $vapidPrivateKey;
    private string $vapidSubject;

    public function __construct()
    {
        $this->vapidPublicKey  = config('webpush.vapid_public_key', '');
        $this->vapidPrivateKey = config('webpush.vapid_private_key', '');
        $this->vapidSubject    = config('webpush.vapid_subject', 'mailto:admin@studentcare.site');
    }

    /**
     * Send a push notification to all subscriptions of a user.
     */
    public function sendToUser(int $userId, array $payload): void
    {
        $subscriptions = PushSubscription::where('user_id', $userId)->get();

        foreach ($subscriptions as $subscription) {
            $this->send($subscription, $payload);
        }
    }

    /**
     * Send a push notification to a single subscription.
     */
    public function send(PushSubscription $subscription, array $payload): void
    {
        if (empty($this->vapidPublicKey) || empty($this->vapidPrivateKey)) {
            Log::warning('WebPush: VAPID keys not configured. Skipping push notification.');
            return;
        }

        try {
            $body = json_encode($payload);
            $endpoint = $subscription->endpoint;

            // Build VAPID JWT
            $vapidHeaders = $this->buildVapidHeaders($endpoint);

            $headers = array_merge($vapidHeaders, [
                'Content-Type'     => 'application/json',
                'Content-Encoding' => 'aes128gcm',
                'TTL'              => '86400',
            ]);

            // If we have encryption keys, encrypt the payload
            if ($subscription->p256dh_key && $subscription->auth_key) {
                [$encryptedBody, $encryptionHeaders] = $this->encryptPayload(
                    $body,
                    $subscription->p256dh_key,
                    $subscription->auth_key
                );
                $headers = array_merge($headers, $encryptionHeaders);
                $body = $encryptedBody;
            }

            $response = Http::withHeaders($headers)
                ->withBody($body, 'application/octet-stream')
                ->post($endpoint);

            if ($response->status() === 410 || $response->status() === 404) {
                // Subscription expired — remove it
                $subscription->delete();
                Log::info("WebPush: Removed expired subscription for user {$subscription->user_id}");
            } elseif (!$response->successful()) {
                Log::warning("WebPush: Push failed for user {$subscription->user_id}", [
                    'status'   => $response->status(),
                    'endpoint' => substr($endpoint, 0, 60) . '...',
                ]);
            }
        } catch (\Throwable $e) {
            Log::error("WebPush: Exception sending push to user {$subscription->user_id}: " . $e->getMessage());
        }
    }

    /**
     * Build VAPID Authorization and Crypto-Key headers.
     */
    private function buildVapidHeaders(string $endpoint): array
    {
        $parsed   = parse_url($endpoint);
        $audience = $parsed['scheme'] . '://' . $parsed['host'];

        $header = $this->base64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => 'ES256']));
        $claims = $this->base64UrlEncode(json_encode([
            'aud' => $audience,
            'exp' => time() + 43200, // 12 hours
            'sub' => $this->vapidSubject,
        ]));

        $signingInput = $header . '.' . $claims;
        $signature    = $this->signWithEcPrivateKey($signingInput, $this->vapidPrivateKey);

        $jwt = $signingInput . '.' . $signature;

        return [
            'Authorization' => "vapid t={$jwt}, k={$this->vapidPublicKey}",
        ];
    }

    /**
     * Sign data with an EC private key (P-256).
     * The private key should be a base64url-encoded raw 32-byte scalar.
     */
    private function signWithEcPrivateKey(string $data, string $privateKeyBase64Url): string
    {
        $rawKey = $this->base64UrlDecode($privateKeyBase64Url);

        // Build SEC1 ECPrivateKey DER (RFC 5915) — minimal form without public key
        // SEQUENCE {
        //   INTEGER 1                  (version)
        //   OCTET STRING <32 bytes>    (privateKey)
        //   [0] OID 1.2.840.10045.3.1.7  (namedCurve = P-256)
        // }
        $oidP256   = "\x06\x08\x2a\x86\x48\xce\x3d\x03\x01\x07"; // OID P-256
        $namedCurve = "\xa0\x0a\x30\x08" . $oidP256;              // [0] SEQUENCE { OID }
        $version    = "\x02\x01\x01";                              // INTEGER 1
        $privOctet  = "\x04\x20" . $rawKey;                        // OCTET STRING (32 bytes)

        $inner = $version . $privOctet . $namedCurve;
        $der   = "\x30" . chr(strlen($inner)) . $inner;            // SEQUENCE { ... }

        $pem = "-----BEGIN EC PRIVATE KEY-----\n"
            . chunk_split(base64_encode($der), 64, "\n")
            . "-----END EC PRIVATE KEY-----";

        $privateKey = openssl_pkey_get_private($pem);
        if (!$privateKey) {
            // Collect OpenSSL errors for better diagnostics
            $errs = [];
            while ($e = openssl_error_string()) {
                $errs[] = $e;
            }
            throw new \RuntimeException('WebPush: Failed to load EC private key. Check VAPID_PRIVATE_KEY. OpenSSL: ' . implode(' | ', $errs));
        }

        openssl_sign($data, $derSignature, $privateKey, OPENSSL_ALGO_SHA256);

        // Convert DER signature to raw r||s (64 bytes) for JWT
        return $this->base64UrlEncode($this->derToRaw($derSignature));
    }

    /**
     * Convert DER-encoded ECDSA signature to raw r||s format.
     */
    private function derToRaw(string $der): string
    {
        // DER: 30 len 02 rLen r 02 sLen s
        $offset = 2; // skip SEQUENCE tag + length
        $offset++; // skip INTEGER tag
        $rLen = ord($der[$offset++]);
        $r = substr($der, $offset, $rLen);
        $offset += $rLen;
        $offset++; // skip INTEGER tag
        $sLen = ord($der[$offset++]);
        $s = substr($der, $offset, $sLen);

        // Pad/trim to 32 bytes each
        $r = str_pad(ltrim($r, "\x00"), 32, "\x00", STR_PAD_LEFT);
        $s = str_pad(ltrim($s, "\x00"), 32, "\x00", STR_PAD_LEFT);

        return $r . $s;
    }

    /**
     * Encrypt the push payload using AES-128-GCM (RFC 8291 / aes128gcm).
     * Returns [encryptedBody, headers].
     */
    private function encryptPayload(string $plaintext, string $p256dhBase64Url, string $authBase64Url): array
    {
        $recipientPublicKey = $this->base64UrlDecode($p256dhBase64Url);
        $authSecret         = $this->base64UrlDecode($authBase64Url);

        // Generate ephemeral EC key pair
        $ephemeralKey = openssl_pkey_new([
            'curve_name'       => 'prime256v1',
            'private_key_type' => OPENSSL_KEYTYPE_EC,
        ]);
        $ephemeralDetails = openssl_pkey_get_details($ephemeralKey);

        // Get raw ephemeral public key (uncompressed, 65 bytes)
        $ephemeralPublicKeyRaw = $this->ecKeyToRaw($ephemeralDetails);

        // Compute ECDH shared secret
        $recipientKey = $this->rawPublicKeyToPem($recipientPublicKey);
        openssl_dh_compute_key($sharedSecret, $recipientKey, $ephemeralKey);

        // HKDF to derive content encryption key and nonce (RFC 8291)
        $salt = random_bytes(16);

        $prk = $this->hkdf($authSecret, $sharedSecret, "WebPush: auth\x00", 32);
        $keyInfo   = "Content-Encoding: aes128gcm\x00" . "\x00\x01" . $recipientPublicKey . $ephemeralPublicKeyRaw;
        $nonceInfo = "Content-Encoding: nonce\x00"     . "\x00\x01" . $recipientPublicKey . $ephemeralPublicKeyRaw;

        $contentKey   = $this->hkdf($salt, $prk, $keyInfo, 16);
        $contentNonce = $this->hkdf($salt, $prk, $nonceInfo, 12);

        // Pad plaintext (add \x02 delimiter, no padding for simplicity)
        $paddedPlaintext = $plaintext . "\x02";

        // Encrypt with AES-128-GCM
        $tag       = '';
        $encrypted = openssl_encrypt($paddedPlaintext, 'aes-128-gcm', $contentKey, OPENSSL_RAW_DATA, $contentNonce, $tag, '', 16);

        // Build aes128gcm content (salt || rs || keyid_len || keyid || ciphertext || tag)
        $rs = pack('N', strlen($paddedPlaintext) + 16 + 1); // record size
        $keyIdLen = pack('C', strlen($ephemeralPublicKeyRaw));
        $body = $salt . $rs . $keyIdLen . $ephemeralPublicKeyRaw . $encrypted . $tag;

        return [$body, ['Content-Encoding' => 'aes128gcm']];
    }

    private function ecKeyToRaw(array $details): string
    {
        // OpenSSL gives us x and y as binary strings
        $x = $details['ec']['x'];
        $y = $details['ec']['y'];
        // Pad to 32 bytes each
        $x = str_pad($x, 32, "\x00", STR_PAD_LEFT);
        $y = str_pad($y, 32, "\x00", STR_PAD_LEFT);
        return "\x04" . $x . $y; // uncompressed point
    }

    private function rawPublicKeyToPem(string $rawKey): \OpenSSLAsymmetricKey
    {
        // Build SubjectPublicKeyInfo DER for P-256
        $oid = "\x06\x08\x2a\x86\x48\xce\x3d\x03\x01\x07"; // P-256 OID
        $ecOid = "\x06\x07\x2a\x86\x48\xce\x3d\x02\x01";   // EC OID
        $algId = "\x30\x13" . $ecOid . "\x30\x08" . $oid;
        $bitString = "\x03" . chr(strlen($rawKey) + 1) . "\x00" . $rawKey;
        $spki = "\x30" . chr(strlen($algId) + strlen($bitString)) . $algId . $bitString;

        $pem = "-----BEGIN PUBLIC KEY-----\n"
            . chunk_split(base64_encode($spki), 64, "\n")
            . "-----END PUBLIC KEY-----";

        return openssl_pkey_get_public($pem);
    }

    /**
     * HKDF-SHA256 key derivation.
     */
    private function hkdf(string $salt, string $ikm, string $info, int $length): string
    {
        $prk = hash_hmac('sha256', $ikm, $salt, true);
        $t   = '';
        $okm = '';
        for ($i = 1; strlen($okm) < $length; $i++) {
            $t    = hash_hmac('sha256', $t . $info . chr($i), $prk, true);
            $okm .= $t;
        }
        return substr($okm, 0, $length);
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
    }
}
