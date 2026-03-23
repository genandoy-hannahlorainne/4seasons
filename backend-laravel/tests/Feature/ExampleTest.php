<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_health_endpoint_is_reachable(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200);
    }
}
