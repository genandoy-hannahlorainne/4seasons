<?php

return [
    'api_key' => env('GROQ_API_KEY'),
    'model' => env('GROQ_MODEL', 'llama-3.1-8b-instant'),
    'base_url' => env('GROQ_BASE_URL', 'https://api.groq.com/openai/v1'),
    'timeout' => (int) env('GROQ_TIMEOUT', 15),
    'temperature' => (float) env('GROQ_TEMPERATURE', 0.7),
    'max_tokens' => (int) env('GROQ_MAX_TOKENS', 180),
];
