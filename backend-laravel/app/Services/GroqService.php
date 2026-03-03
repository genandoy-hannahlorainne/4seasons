<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GroqService
{
    private string $apiKey;
    private string $model;
    private string $baseUrl;
    private int $timeout;
    private float $temperature;
    private int $maxTokens;

    public function __construct()
    {
        $this->apiKey = (string) config('groq.api_key', '');
        $this->model = (string) config('groq.model', 'llama-3.1-8b-instant');
        $this->baseUrl = rtrim((string) config('groq.base_url', 'https://api.groq.com/openai/v1'), '/');
        $this->timeout = (int) config('groq.timeout', 15);
        $this->temperature = (float) config('groq.temperature', 0.7);
        $this->maxTokens = (int) config('groq.max_tokens', 180);
    }

    /**
     * Generic chat completion request to Groq.
     */
    public function chatCompletion(array $messages, array $overrides = []): array
    {
        if (empty($this->apiKey)) {
            return [
                'success' => false,
                'message' => 'Groq API key is not configured',
                'data' => null,
            ];
        }

        $payload = [
            'model' => $overrides['model'] ?? $this->model,
            'messages' => $messages,
            'temperature' => $overrides['temperature'] ?? $this->temperature,
            'max_tokens' => $overrides['max_tokens'] ?? $this->maxTokens,
        ];

        try {
            $response = Http::timeout($this->timeout)
                ->withToken($this->apiKey)
                ->acceptJson()
                ->post($this->baseUrl . '/chat/completions', $payload);

            if (!$response->successful()) {
                Log::warning('Groq API request failed', [
                    'status' => $response->status(),
                    'body' => $response->json() ?? $response->body(),
                ]);

                return [
                    'success' => false,
                    'message' => 'Groq API request failed',
                    'data' => [
                        'status' => $response->status(),
                        'response' => $response->json() ?? $response->body(),
                    ],
                ];
            }

            $data = $response->json();
            $content = $data['choices'][0]['message']['content'] ?? null;

            if (!$content) {
                return [
                    'success' => false,
                    'message' => 'Groq response has no content',
                    'data' => $data,
                ];
            }

            return [
                'success' => true,
                'message' => 'Groq response generated successfully',
                'data' => [
                    'content' => trim((string) $content),
                    'raw' => $data,
                ],
            ];
        } catch (\Throwable $e) {
            Log::error('Groq API exception', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'message' => 'Groq API exception: ' . $e->getMessage(),
                'data' => null,
            ];
        }
    }

    /**
     * Generate short motivational narrative for a badge unlock.
     */
    public function generateBadgeNarrative(string $studentName, string $badgeName, int $streakDays): array
    {
        $systemPrompt = 'You are a school clinic assistant writing short congratulatory badge messages for students. Always make the message sound like it comes from the clinic team. Explicitly congratulate the student for not visiting the clinic today. Avoid medical advice or diagnosis. Keep tone positive and encouraging.';

        $userPrompt = "Generate one short badge narrative (40-70 words) for a student who just unlocked a streak badge. "
            . "Student: {$studentName}. Badge: {$badgeName}. Streak days: {$streakDays}. "
            . 'The paragraph must mention that the clinic congratulates the student for having no clinic visit today. '
            . 'Output only the paragraph text, no quotes, no markdown.';

        $result = $this->chatCompletion([
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userPrompt],
        ], [
            'temperature' => 0.75,
            'max_tokens' => 140,
        ]);

        if (!$result['success']) {
            return [
                'success' => false,
                'message' => $result['message'],
                'data' => [
                    'narrative' => $this->fallbackNarrative($studentName, $badgeName, $streakDays),
                    'source' => 'fallback',
                ],
            ];
        }

        return [
            'success' => true,
            'message' => 'Badge narrative generated successfully',
            'data' => [
                'narrative' => $result['data']['content'],
                'source' => 'groq',
            ],
        ];
    }

    private function fallbackNarrative(string $studentName, string $badgeName, int $streakDays): string
    {
        return "From the school clinic team, congratulations {$studentName}! You earned the {$badgeName} badge with {$streakDays} streak days, and we are proud that you did not need to visit the clinic today. Keep taking good care of yourself and continue this strong, healthy routine.";
    }
}
