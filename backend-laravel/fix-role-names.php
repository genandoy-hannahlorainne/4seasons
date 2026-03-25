<?php

$file = __DIR__ . '/tests/Feature/SHDF/SHDFPropertyTest.php';
$content = file_get_contents($file);

$content = str_replace(
    "Role::where('role_name', 'clinic_staff')",
    "Role::where('role_name', 'Clinic Staff')",
    $content
);

file_put_contents($file, $content);

echo "Fixed SHDFPropertyTest.php\n";
