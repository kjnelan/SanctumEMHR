<?php
// Quick debug script
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Starting test...\n";

$ignoreAuth = true;
$ignoreAuth_onsite_portal = true;
$ignoreAuth_onsite_portal_two = true;

require_once(__DIR__ . '/../../../interface/globals.php');

echo "Globals loaded\n";

// Test simple query
$sql = "SELECT COUNT(*) as cnt FROM clinical_notes";
$result = sqlStatement($sql);
$row = sqlFetchArray($result);

echo "Count of notes: " . $row['cnt'] . "\n";

// Test fetching note 1
$sql = "SELECT * FROM clinical_notes WHERE id = 1";
$result = sqlStatement($sql);
$note = sqlFetchArray($result);

echo "Note data:\n";
print_r($note);
