<?php
/**
 * Check what calendar tables and columns actually exist in the database (MIGRATED TO MINDLINE)
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;

header('Content-Type: text/plain');

$db = Database::getInstance();

echo "=== Checking Calendar Tables in Mindline Database ===\n\n";

// Check what tables exist with 'appointment' in the name
echo "1. Tables with 'appointment' in name:\n";
$tables = $db->queryAll("SHOW TABLES LIKE '%appointment%'");
foreach ($tables as $row) {
    $tableName = array_values($row)[0];
    echo "   - $tableName\n";
}

echo "\n2. Checking appointment_categories structure:\n";
try {
    $describe = $db->queryAll("DESCRIBE appointment_categories");
    echo "   Columns in appointment_categories:\n";
    foreach ($describe as $col) {
        echo "   - {$col['Field']} ({$col['Type']}) {$col['Null']}\n";
    }
} catch (Exception $e) {
    echo "   ERROR: " . $e->getMessage() . "\n";
}

echo "\n3. Sample category data:\n";
try {
    $cats = $db->queryAll("SELECT id, name, category_type FROM appointment_categories WHERE is_active = 1 LIMIT 5");
    foreach ($cats as $cat) {
        echo "   - ID: {$cat['id']}, Name: {$cat['name']}, Type: {$cat['category_type']}\n";
    }
} catch (Exception $e) {
    echo "   ERROR: " . $e->getMessage() . "\n";
}
