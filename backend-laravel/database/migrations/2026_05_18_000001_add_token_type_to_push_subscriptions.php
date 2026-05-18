<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('push_subscriptions', function (Blueprint $table) {
            if (!Schema::hasColumn('push_subscriptions', 'token_type')) {
                $table->string('token_type', 16)->default('vapid')->after('endpoint');
            }
        });

        if (Schema::hasColumn('push_subscriptions', 'token_type')) {
            DB::table('push_subscriptions')
                ->whereNull('p256dh_key')
                ->whereNull('auth_key')
                ->where('endpoint', 'not like', 'https://%')
                ->update(['token_type' => 'fcm']);
        }
    }

    public function down(): void
    {
        Schema::table('push_subscriptions', function (Blueprint $table) {
            if (Schema::hasColumn('push_subscriptions', 'token_type')) {
                $table->dropColumn('token_type');
            }
        });
    }
};
