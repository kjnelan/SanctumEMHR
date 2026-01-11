<?php
/**
 * Debug script to check diagnosis_codes values in the database
 */

require_once(__DIR__ . '/../../interface/globals.php');

// Get all diagnosis notes
$sql = "SELECT id, patient_id, diagnosis_codes, LENGTH(diagnosis_codes) as length FROM clinical_notes WHERE template_type = 'Diagnosis' ORDER BY id DESC LIMIT 10";
$result = sqlStatement($sql);

echo "=== Diagnosis Notes in Database ===\n\n";

while ($row = sqlFetchArray($result)) {
    echo "Note ID: " . $row['id'] . "\n";
    echo "Patient ID: " . $row['patient_id'] . "\n";
    echo "diagnosis_codes value: ";
    var_dump($row['diagnosis_codes']);
    echo "Length: " . $row['length'] . "\n";
    echo "Type: " . gettype($row['diagnosis_codes']) . "\n";

    // Try to decode
    if ($row['diagnosis_codes']) {
        $decoded = json_decode($row['diagnosis_codes'], true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            echo "JSON ERROR: " . json_last_error_msg() . "\n";
        } else {
            echo "Decoded successfully: ";
            var_dump($decoded);
        }
    } else {
        echo "Empty or null value\n";
    }

    echo "\n" . str_repeat("-", 50) . "\n\n";
}
