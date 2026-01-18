<?php
/**
 * Verify if password matches the hash in database
 */

// Load database config
$dbConfig = require __DIR__ . '/config/database.php';

// Connect
$pdo = new PDO(
    "mysql:host={$dbConfig['host']};port={$dbConfig['port']};dbname={$dbConfig['database']};charset={$dbConfig['charset']}",
    $dbConfig['username'],
    $dbConfig['password'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);

// Get the admin user
$stmt = $pdo->prepare("SELECT id, username, password_hash FROM users WHERE username = ?");
$stmt->execute(['admin']);
$user = $stmt->fetch();

if (!$user) {
    echo "❌ User 'admin' not found\n";
    exit(1);
}

echo "User found:\n";
echo "  ID: " . $user['id'] . "\n";
echo "  Username: " . $user['username'] . "\n";
echo "  Password hash: " . substr($user['password_hash'], 0, 60) . "...\n";
echo "  Hash algorithm: " . (strpos($user['password_hash'], '$argon2') === 0 ? 'ARGON2' : (strpos($user['password_hash'], '$2y$') === 0 ? 'BCRYPT' : 'UNKNOWN')) . "\n\n";

// Test password
$testPassword = 'ChangeMe123!';
echo "Testing password: '$testPassword'\n";

$verified = password_verify($testPassword, $user['password_hash']);

if ($verified) {
    echo "✓ Password verification SUCCESS!\n";
    echo "\nPassword hash is CORRECT. Login should work.\n";
    echo "The issue is elsewhere in the authentication flow.\n";
} else {
    echo "✗ Password verification FAILED!\n";
    echo "\nThis means either:\n";
    echo "1. The password in the database is wrong\n";
    echo "2. The password 'ChangeMe123!' is not the correct password\n";
    echo "\nTo fix: Delete this user and recreate with create_user.php\n";
}
