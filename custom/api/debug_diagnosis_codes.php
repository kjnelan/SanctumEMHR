<?php
/**
 * Debug script to check diagnosis_codes values in database (MIGRATED TO MINDLINE)
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;

$db = Database::getInstance();

// Get all diagnosis notes from MINDLINE schema
$sql = "SELECT id, client_id, note_type FROM clinical_notes WHERE note_type = 'Diagnosis' ORDER BY id DESC LIMIT 10";
$rows = $db->queryAll($sql);

echo "=== Diagnosis Notes in Mindline Database ===\n\n";

foreach ($rows as $row) {
    echo "Note ID: " . $row['id'] . "\n";
    echo "Client ID: " . $row['client_id'] . "\n";
    echo "Note Type: " . $row['note_type'] . "\n";
    echo "\n" . str_repeat("-", 50) . "\n\n";
}

if (empty($rows)) {
    echo "No diagnosis notes found.\n";
}
