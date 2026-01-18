<?php
/**
 * Create User Script for Mindline Database
 *
 * Usage: php create_user.php
 */

// Load database configuration
$dbConfig = require __DIR__ . '/config/database.php';

// User details - modify these as needed
$userData = [
    'username' => 'admin',
    'email' => 'admin@mindline.local',
    'password' => 'ChangeMe123!',  // Will be hashed
    'first_name' => 'System',
    'last_name' => 'Administrator',
    'middle_name' => null,
    'user_type' => 'admin',
    'is_active' => 1,
    'is_provider' => 0,
    'npi' => null,
    'license_number' => null,
    'license_state' => null,
    'dea_number' => null,
    'phone' => null,
    'mobile' => null,
    'fax' => null
];

try {
    // Create PDO connection using config
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

    // Generate UUID
    $uuid = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );

    // Hash password using ARGON2ID (same as CustomAuth class)
    $passwordHash = password_hash($userData['password'], PASSWORD_ARGON2ID);

    // Check if user already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$userData['username'], $userData['email']]);
    $existingUser = $stmt->fetch();

    if ($existingUser) {
        echo "❌ Error: User with username '{$userData['username']}' or email '{$userData['email']}' already exists.\n";
        exit(1);
    }

    // Insert user
    $sql = "INSERT INTO users (
        uuid, username, email, password_hash,
        first_name, last_name, middle_name,
        user_type, is_active, is_provider,
        npi, license_number, license_state, dea_number,
        phone, mobile, fax,
        password_changed_at, created_at
    ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        NOW(), NOW()
    )";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $uuid,
        $userData['username'],
        $userData['email'],
        $passwordHash,
        $userData['first_name'],
        $userData['last_name'],
        $userData['middle_name'],
        $userData['user_type'],
        $userData['is_active'],
        $userData['is_provider'],
        $userData['npi'],
        $userData['license_number'],
        $userData['license_state'],
        $userData['dea_number'],
        $userData['phone'],
        $userData['mobile'],
        $userData['fax']
    ]);

    $userId = $pdo->lastInsertId();

    echo "✅ User created successfully!\n\n";
    echo "User ID: {$userId}\n";
    echo "UUID: {$uuid}\n";
    echo "Username: {$userData['username']}\n";
    echo "Email: {$userData['email']}\n";
    echo "Password: {$userData['password']}\n";
    echo "Type: {$userData['user_type']}\n";
    echo "\n⚠️  IMPORTANT: Change the password after first login!\n";

} catch (Exception $e) {
    echo "❌ Error creating user: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
    exit(1);
}
