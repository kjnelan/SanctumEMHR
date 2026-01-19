#!/usr/bin/env php
<?php
/**
 * Create Admin User Script
 *
 * This script helps you create the first admin user for MINDLINE.
 *
 * Usage: php scripts/create_admin_user.php
 */

// Load autoloader
require_once dirname(__FILE__, 2) . "/vendor/autoload.php";
require_once dirname(__FILE__, 2) . "/custom/lib/Database/Database.php";
require_once dirname(__FILE__, 2) . "/custom/lib/Session/SessionManager.php";
require_once dirname(__FILE__, 2) . "/custom/lib/Auth/CustomAuth.php";

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;
use Custom\Lib\Auth\CustomAuth;

echo "\n==============================================\n";
echo "MINDLINE - Create Admin User\n";
echo "==============================================\n\n";

// Check database connection
try {
    $db = Database::getInstance();
    echo "✓ Database connection successful\n\n";
} catch (Exception $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "\n";
    echo "\nPlease configure your database in /config/database.php\n";
    exit(1);
}

// Check if users table exists
if (!$db->tableExists('users')) {
    echo "✗ Users table does not exist!\n";
    echo "\nPlease import the database schema:\n";
    echo "  mysql -u root -p mindline < sql/mindline.sql\n\n";
    exit(1);
}

// Check if any users exist
$userCount = $db->count("SELECT COUNT(*) FROM users");
if ($userCount > 0) {
    echo "⚠ Warning: Database already has {$userCount} user(s).\n";
    echo "Do you want to create another user? (y/n): ";
    $answer = trim(fgets(STDIN));
    if (strtolower($answer) !== 'y') {
        echo "Cancelled.\n\n";
        exit(0);
    }
    echo "\n";
}

// Collect user information
echo "Enter user information:\n";
echo "----------------------\n\n";

echo "Username: ";
$username = trim(fgets(STDIN));

echo "Email: ";
$email = trim(fgets(STDIN));

echo "First Name: ";
$firstName = trim(fgets(STDIN));

echo "Last Name: ";
$lastName = trim(fgets(STDIN));

echo "Password: ";
// Hide password input on Unix-like systems
if (strtoupper(substr(PHP_OS, 0, 3)) !== 'WIN') {
    system('stty -echo');
    $password = trim(fgets(STDIN));
    system('stty echo');
    echo "\n";
} else {
    $password = trim(fgets(STDIN));
}

echo "Confirm Password: ";
if (strtoupper(substr(PHP_OS, 0, 3)) !== 'WIN') {
    system('stty -echo');
    $passwordConfirm = trim(fgets(STDIN));
    system('stty echo');
    echo "\n";
} else {
    $passwordConfirm = trim(fgets(STDIN));
}

echo "\n";

// Validate inputs
if (empty($username) || empty($email) || empty($firstName) || empty($lastName) || empty($password)) {
    echo "✗ All fields are required!\n\n";
    exit(1);
}

if ($password !== $passwordConfirm) {
    echo "✗ Passwords do not match!\n\n";
    exit(1);
}

// Create user
$auth = new CustomAuth($db);

echo "Creating user...\n";

$result = $auth->createUser([
    'username' => $username,
    'email' => $email,
    'first_name' => $firstName,
    'last_name' => $lastName,
    'password' => $password,
    'user_type' => 'admin',
    'is_active' => true,
    'is_provider' => false
]);

if ($result['success']) {
    echo "\n✓ SUCCESS! Admin user created.\n\n";
    echo "User Details:\n";
    echo "  ID: {$result['user_id']}\n";
    echo "  Username: {$username}\n";
    echo "  Email: {$email}\n";
    echo "  Name: {$firstName} {$lastName}\n";
    echo "  User Type: admin\n\n";
    echo "You can now log in at: http://your-server/custom/api/login.php\n\n";
} else {
    echo "\n✗ Failed to create user: {$result['message']}\n\n";
    exit(1);
}
