<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the unique index first (MySQL cannot index full TEXT columns)
        Schema::table('push_subscriptions', function (Blueprint $table) {
            $table->dropUnique('push_subscriptions_user_endpoint_unique');
        });

        // Widen endpoint to TEXT to accommodate long FCM tokens (700-1000+ chars)
        Schema::table('push_subscriptions', function (Blueprint $table) {
            $table->text('endpoint')->change();
        });

        // Re-add unique index using a prefix (191 chars = safe for utf8mb4)
        DB::statement('ALTER TABLE push_subscriptions ADD UNIQUE INDEX push_subscriptions_user_endpoint_unique (user_id, endpoint(191))');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE push_subscriptions DROP INDEX push_subscriptions_user_endpoint_unique');

        Schema::table('push_subscriptions', function (Blueprint $table) {
            $table->string('endpoint', 512)->change();
        });

        Schema::table('push_subscriptions', function (Blueprint $table) {
            $table->unique(['user_id', 'endpoint'], 'push_subscriptions_user_endpoint_unique');
        });
    }
};
