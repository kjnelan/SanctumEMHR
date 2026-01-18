<?php
/**
 * Test the complete login flow
 */

echo "=== TESTING LOGIN FLOW ===\n\n";

// Load autoloader
require_once __DIR__ . '/vendor/autoload.php';

use Custom\Lib\Database\Database;
use Custom\Lib\Auth\CustomAuth;
use Custom\Lib\Session\SessionManager;

$username = 'admin';
$password = 'ChangeMe123!';

echo "1. Testing Database class...\n";
try {
    $db = Database::getInstance();
    echo "   ✓ Database instance created\n";
} catch (Exception $e) {
    echo "   ✗ Database failed: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n2. Testing CustomAuth class...\n";
try {
    $auth = new CustomAuth($db);
    echo "   ✓ CustomAuth instance created\n";
} catch (Exception $e) {
    echo "   ✗ CustomAuth failed: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n3. Testing SessionManager class...\n";
try {
    $session = SessionManager::getInstance();
    echo "   ✓ SessionManager instance created\n";
} catch (Exception $e) {
    echo "   ✗ SessionManager failed: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n4. Testing authentication with username: $username\n";
try {
    $user = $auth->authenticate($username, $password);

    if (!$user) {
        echo "   ✗ Authentication returned false/null\n";
        echo "   This means authenticate() failed but didn't throw exception\n";
        exit(1);
    }

    echo "   ✓ Authentication successful!\n";
    echo "   User ID: " . $user['id'] . "\n";
    echo "   Username: " . $user['username'] . "\n";
    echo "   Email: " . $user['email'] . "\n";

} catch (Exception $e) {
    echo "   ✗ Authentication threw exception: " . $e->getMessage() . "\n";
    echo "   Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}

echo "\n5. Testing session login...\n";
try {
    $session->start();
    $session->login($user);
    echo "   ✓ Session login successful!\n";
    echo "   Session ID: " . $session->getId() . "\n";
} catch (Exception $e) {
    echo "   ✗ Session login failed: " . $e->getMessage() . "\n";
    echo "   Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}

echo "\n=== ALL TESTS PASSED ===\n";
echo "Login flow works correctly!\n";
echo "The issue must be in the HTTP request handling or CORS.\n";
