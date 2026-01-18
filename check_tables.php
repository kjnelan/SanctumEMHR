<?php
/**
 * Check if required tables exist for authentication
 */

$dbConfig = require __DIR__ . '/config/database.php';

$pdo = new PDO(
    "mysql:host={$dbConfig['host']};port={$dbConfig['port']};dbname={$dbConfig['database']};charset={$dbConfig['charset']}",
    $dbConfig['username'],
    $dbConfig['password'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);

echo "Checking required tables for authentication:\n\n";

$requiredTables = [
    'users' => 'User accounts',
    'sessions' => 'Session storage (SessionManager)',
    'audit_logs' => 'Audit logging (CustomAuth)'
];

$missing = [];

foreach ($requiredTables as $table => $description) {
    $result = $pdo->query("SHOW TABLES LIKE '$table'")->fetch();
    if ($result) {
        echo "✓ $table - $description\n";
    } else {
        echo "✗ $table - $description (MISSING!)\n";
        $missing[] = $table;
    }
}

if (empty($missing)) {
    echo "\n✓ All required tables exist!\n";
} else {
    echo "\n✗ Missing tables: " . implode(', ', $missing) . "\n";
    echo "\nThese tables are required for authentication to work.\n";
    echo "Check database/mindline.sql for table creation scripts.\n";
}
