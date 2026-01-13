<?php
/**
 * Direct test of the medical records API
 */

// Simulate the API call
$_GET['user_id'] = 30; // Hannah's user_id

// Include the API
require_once 'api/get-student-medical-data.php';
?>
