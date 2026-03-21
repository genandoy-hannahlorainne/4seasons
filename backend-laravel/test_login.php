<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

$user = DB::table('users')->where('username', 'admin')->first();
echo "User: " . ($user ? $user->username : 'NOT FOUND') . "\n";
echo "Active: " . ($user ? $user->is_active : 'N/A') . "\n";
echo "Hash: " . ($user ? substr($user->password_hash, 0, 20) . '...' : 'N/A') . "\n";
echo "admin123 match: " . (($user && Hash::check('admin123', $user->password_hash)) ? 'YES' : 'NO') . "\n";
echo "Admin@1234 match: " . (($user && Hash::check('Admin@1234', $user->password_hash)) ? 'YES' : 'NO') . "\n";

// Test the full login flow
try {
    $userModel = App\Models\User::where('username', 'admin')->with('role')->first();
    echo "Role: " . ($userModel->role ? $userModel->role->role_name : 'NULL') . "\n";
    $token = $userModel->createToken('test-token')->plainTextToken;
    echo "Token OK: " . substr($token, 0, 15) . "...\n";
    $userModel->tokens()->where('name', 'test-token')->delete();
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}
