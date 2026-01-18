<?php
/**
 * Debug Database Connection and User Status
 */

echo "=== MINDLINE DATABASE DEBUG ===\n\n";

// Test 1: Load config
echo "1. Loading database config from /config/database.php...\n";
$dbConfig = require __DIR__ . '/config/database.php';
echo "   Host: " . $dbConfig['host'] . "\n";
echo "   Database: " . $dbConfig['database'] . "\n";
echo "   Username: " . $dbConfig['username'] . "\n";
echo "   Password: " . (empty($dbConfig['password']) ? '(empty)' : '(set - ' . strlen($dbConfig['password']) . ' chars)') . "\n\n";

// Test 2: Connect to database
echo "2. Connecting to database...\n";
try {
    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
        $dbConfig['host'],
        $dbConfig['port'],
        $dbConfig['database'],
        $dbConfig['charset']
    );

    $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    echo "   ✓ Connected successfully!\n\n";
} catch (PDOException $e) {
    echo "   ✗ Connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Test 3: Check which database we're connected to
echo "3. Checking connected database...\n";
$result = $pdo->query("SELECT DATABASE() as db_name")->fetch();
echo "   Connected to: " . $result['db_name'] . "\n\n";

// Test 4: Check if users table exists
echo "4. Checking if 'users' table exists...\n";
try {
    $result = $pdo->query("SHOW TABLES LIKE 'users'")->fetch();
    if ($result) {
        echo "   ✓ Users table exists\n\n";
    } else {
        echo "   ✗ Users table NOT found!\n";
        exit(1);
    }
} catch (PDOException $e) {
    echo "   ✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}

// Test 5: Check users table structure
echo "5. Checking users table structure...\n";
$columns = $pdo->query("DESCRIBE users")->fetchAll();
echo "   Columns found:\n";
foreach ($columns as $col) {
    echo "   - " . $col['Field'] . " (" . $col['Type'] . ")\n";
}
echo "\n";

// Test 6: Count users in table
echo "6. Checking existing users...\n";
$count = $pdo->query("SELECT COUNT(*) as cnt FROM users")->fetch();
echo "   Total users: " . $count['cnt'] . "\n\n";

// Test 7: List all users
if ($count['cnt'] > 0) {
    echo "7. Listing users:\n";
    $users = $pdo->query("SELECT id, username, email, user_type, is_active FROM users")->fetchAll();
    foreach ($users as $user) {
        echo "   - ID: " . $user['id'] . ", Username: " . $user['username'] . ", Email: " . $user['email'] . "\n";
        echo "     Type: " . $user['user_type'] . ", Active: " . ($user['is_active'] ? 'Yes' : 'No') . "\n";
    }
} else {
    echo "7. No users found in database.\n";
    echo "   Run: php create_user.php\n";
}

echo "\n=== DEBUG COMPLETE ===\n";
