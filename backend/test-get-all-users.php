<?php
// Test script for get-all-users API
require_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

// Simulate admin user_id = 1
$_SERVER['HTTP_USER_ID'] = '1';

// Include the API
require_once 'api/get-all-users.php';
?>
