<?php
/**
 * Quick debug script for clinical notes (MIGRATED TO MINDLINE)
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Starting test...\n";

require_once(__DIR__ . '/../../init.php');

use Custom\Lib\Database\Database;

echo "Init loaded\n";

// Initialize database
$db = Database::getInstance();

// Test simple query
$sql = "SELECT COUNT(*) as cnt FROM clinical_notes";
$row = $db->query($sql);

echo "Count of notes: " . ($row['cnt'] ?? 0) . "\n";

// Test fetching note 1
$sql = "SELECT * FROM clinical_notes WHERE id = 1";
$note = $db->query($sql);

echo "Note data:\n";
print_r($note);
