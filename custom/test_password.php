<?php
// Test password hashing support

echo "PHP Version: " . phpversion() . "\n\n";

// Check if Argon2 is available
if (defined('PASSWORD_ARGON2ID')) {
    echo "✓ PASSWORD_ARGON2ID is available\n";

    // Test hashing with Argon2
    $testPassword = "Test123!";
    $hash = password_hash($testPassword, PASSWORD_ARGON2ID);
    echo "Sample Argon2ID hash: " . substr($hash, 0, 50) . "...\n\n";

    // Test verification
    $verified = password_verify($testPassword, $hash);
    echo "Argon2 verification: " . ($verified ? "✓ WORKS" : "✗ FAILED") . "\n";
} else {
    echo "✗ PASSWORD_ARGON2ID is NOT available\n";
    echo "Argon2 support is missing in your PHP installation\n\n";
}

// Check if bcrypt works
echo "\nBcrypt test:\n";
$bcryptHash = password_hash("Test123!", PASSWORD_BCRYPT);
echo "Sample bcrypt hash: " . substr($bcryptHash, 0, 50) . "...\n";
$bcryptVerified = password_verify("Test123!", $bcryptHash);
echo "Bcrypt verification: " . ($bcryptVerified ? "✓ WORKS" : "✗ FAILED") . "\n";

// Test with your actual user hashes
echo "\n=== Testing Your Actual Hashes ===\n\n";

$yourArgon2Hash = '$argon2id$v=19$m=65536,t=4,p=1$TnlISGFaU1NRcGRKcEw$VqEu/TqpyuDCp9bQxPG3LdTL7m0yWj3VGqxkD6uD9F8';
$yourBcryptHash = '$2y$10$Vsi27QUnr3asgisRipjanuWcxSMUy6odd51lrRjwPbd';

// Test common passwords
$testPasswords = ['Test123!', 'password', 'changeme', 'admin', 'Admin123!'];

echo "Testing Argon2 hash with common passwords:\n";
foreach ($testPasswords as $pwd) {
    $result = password_verify($pwd, $yourArgon2Hash);
    if ($result) {
        echo "  ✓ PASSWORD FOUND: '$pwd'\n";
    }
}

echo "\nAll available password algorithms:\n";
foreach (password_algos() as $algo) {
    echo "  - $algo\n";
}
