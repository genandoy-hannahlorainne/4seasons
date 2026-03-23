<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class StudentTest extends TestCase
{
    public function test_unauthenticated_user_cannot_access_students(): void
    {
        $response = $this->getJson('/api/students');

        $response->assertStatus(401);
    }
}
