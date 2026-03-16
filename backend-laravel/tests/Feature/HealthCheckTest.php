<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HealthCheckTest extends TestCase
{
    public function test_health_check_endpoint_returns_success()
    {
        $response = $this->get('/api/health');

        $response->assertStatus(200)
                ->assertJson([
                    'status' => 'ok'
                ])
                ->assertJsonStructure([
                    'status',
                    'timestamp',
                    'database'
                ]);
    }
}