<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateVapidKeys extends Command
{
    protected $signature   = 'webpush:vapid';
    protected $description = 'Generate VAPID key pair for Web Push notifications';

    public function handle(): int
    {
        $key = openssl_pkey_new([
            'curve_name'       => 'prime256v1',
            'private_key_type' => OPENSSL_KEYTYPE_EC,
        ]);

        if (!$key) {
            $this->error('Failed to generate EC key pair. Ensure OpenSSL is available.');
            return self::FAILURE;
        }

        $details = openssl_pkey_get_details($key);

        // Raw private key (32 bytes)
        openssl_pkey_export($key, $pem);
        preg_match('/-----BEGIN EC PRIVATE KEY-----(.+?)-----END EC PRIVATE KEY-----/s', $pem, $m);
        $der        = base64_decode(trim($m[1]));
        // Private key scalar is at offset 7, length 32 in SEC1 DER
        $privateRaw = substr($der, 7, 32);

        // Uncompressed public key (65 bytes: 0x04 || x || y)
        $x = str_pad($details['ec']['x'], 32, "\x00", STR_PAD_LEFT);
        $y = str_pad($details['ec']['y'], 32, "\x00", STR_PAD_LEFT);
        $publicRaw  = "\x04" . $x . $y;

        $publicKey  = $this->base64UrlEncode($publicRaw);
        $privateKey = $this->base64UrlEncode($privateRaw);

        $this->info('VAPID keys generated successfully!');
        $this->newLine();
        $this->line('Add these to your <comment>.env</comment> file:');
        $this->newLine();
        $this->line("VAPID_PUBLIC_KEY={$publicKey}");
        $this->line("VAPID_PRIVATE_KEY={$privateKey}");
        $this->line('VAPID_SUBJECT=mailto:admin@studentcare.site');
        $this->newLine();
        $this->comment('Also copy VAPID_PUBLIC_KEY to your Angular environment files.');

        return self::SUCCESS;
    }

    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
