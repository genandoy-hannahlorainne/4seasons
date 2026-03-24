<?php

namespace App\Services;

/**
 * Simple Hashids implementation for obfuscating integer IDs
 * Based on Hashids algorithm without external dependencies
 */
class HashidService
{
    private string $salt;
    private int $minLength;
    private string $alphabet;

    public function __construct()
    {
        $this->salt = config('app.key');
        $this->minLength = 6;
        $this->alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    }

    /**
     * Encode an integer ID to a hash string
     */
    public function encode(int $id): string
    {
        if ($id < 0) {
            throw new \InvalidArgumentException('ID must be a positive integer');
        }

        $hash = '';
        $alphabet = $this->shuffleAlphabet($this->alphabet, $this->salt);
        $alphabetLength = strlen($alphabet);

        do {
            $hash = $alphabet[$id % $alphabetLength] . $hash;
            $id = (int)($id / $alphabetLength);
        } while ($id > 0);

        // Pad to minimum length
        while (strlen($hash) < $this->minLength) {
            $hash = $alphabet[0] . $hash;
        }

        return $hash;
    }

    /**
     * Decode a hash string back to integer ID
     */
    public function decode(string $hash): ?int
    {
        if (empty($hash)) {
            return null;
        }

        $alphabet = $this->shuffleAlphabet($this->alphabet, $this->salt);
        $alphabetLength = strlen($alphabet);
        $hashLength = strlen($hash);
        $id = 0;

        for ($i = 0; $i < $hashLength; $i++) {
            $position = strpos($alphabet, $hash[$i]);
            if ($position === false) {
                return null;
            }
            $id = $id * $alphabetLength + $position;
        }

        return $id;
    }

    /**
     * Shuffle alphabet based on salt for consistent encoding/decoding
     */
    private function shuffleAlphabet(string $alphabet, string $salt): string
    {
        $saltLength = strlen($salt);
        if ($saltLength === 0) {
            return $alphabet;
        }

        $alphabetArray = str_split($alphabet);
        $alphabetLength = count($alphabetArray);

        for ($i = $alphabetLength - 1, $v = 0, $p = 0; $i > 0; $i--, $v++) {
            $v %= $saltLength;
            $int = ord($salt[$v]);
            $p += $int;
            $j = ($int + $v + $p) % $i;

            $temp = $alphabetArray[$j];
            $alphabetArray[$j] = $alphabetArray[$i];
            $alphabetArray[$i] = $temp;
        }

        return implode('', $alphabetArray);
    }
}
