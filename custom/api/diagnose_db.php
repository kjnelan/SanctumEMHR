<?php
/**
 * Database diagnosis script (MIGRATED TO MINDLINE)
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;

header('Content-Type: application/json');

try {
    $db = Database::getInstance();

    // Check tables
    $tables = $db->queryAll("SHOW TABLES");
    $tableList = [];
    foreach ($tables as $row) {
        $tableList[] = array_values($row)[0];
    }

    // Check appointment_categories table
    $categoriesTable = null;
    foreach ($tableList as $table) {
        if ($table === 'appointment_categories') {
            $categoriesTable = $table;
            break;
        }
    }

    $result = [
        'tables_with_appointment' => array_filter($tableList, function($t) {
            return stripos($t, 'appointment') !== false;
        }),
        'categories_table' => $categoriesTable
    ];

    // If we found categories table, describe it
    if ($categoriesTable) {
        $describe = $db->queryAll("DESCRIBE $categoriesTable");
        $columns = [];
        foreach ($describe as $col) {
            $columns[] = $col['Field'];
        }
        $result['categories_columns'] = $columns;

        // Get sample data
        $sample = $db->query("SELECT * FROM $categoriesTable LIMIT 1");
        $result['sample_category'] = $sample;
    }

    echo json_encode($result, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
