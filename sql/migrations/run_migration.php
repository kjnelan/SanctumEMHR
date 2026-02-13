#!/usr/bin/env php
<?php
/**
 * Migration Runner for SanctumEMHR
 *
 * Usage: php run_migration.php add_addendum_fields.sql
 */

require_once(__DIR__ . '/../../custom/init.php');

use Custom\Lib\Database\Database;

if ($argc < 2) {
    echo "Usage: php run_migration.php <migration_file.sql>\n";
    exit(1);
}

$migrationFile = $argv[1];
$migrationPath = __DIR__ . '/' . $migrationFile;

if (!file_exists($migrationPath)) {
    echo "Error: Migration file not found: $migrationPath\n";
    exit(1);
}

echo "Running migration: $migrationFile\n";

$sql = file_get_contents($migrationPath);

// Split by semicolon to handle multiple statements
$statements = array_filter(
    array_map('trim', explode(';', $sql)),
    function($stmt) {
        // Filter out comments and empty statements
        return !empty($stmt) && !preg_match('/^\s*--/', $stmt);
    }
);

try {
    $db = Database::getInstance();

    foreach ($statements as $statement) {
        if (empty($statement)) continue;

        echo "Executing: " . substr($statement, 0, 80) . "...\n";
        $db->execute($statement);
    }

    echo "\n✅ Migration completed successfully!\n";

} catch (Exception $e) {
    echo "\n❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
