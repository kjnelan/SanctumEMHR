<?php
/**
 * Mindline EMHR
 * Get Rooms API - Returns list of room/location options
 * Fetches rooms from the list_options table
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

// Start output buffering to prevent any PHP warnings/notices from breaking JSON
ob_start();

// IMPORTANT: Set these BEFORE loading globals.php to prevent redirects
$ignoreAuth = true;
$ignoreAuth_onsite_portal = true;
$ignoreAuth_onsite_portal_two = true;

require_once(__DIR__ . '/../../interface/globals.php');

// Clear any output that globals.php might have generated
ob_end_clean();

// Enable error logging
error_log("Get rooms API called - Session ID: " . session_id());

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_log("Get rooms: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Get rooms: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

error_log("Get rooms: User authenticated - " . $_SESSION['authUserID']);

try {
    // First, ensure the "rooms" list exists
    $listCheck = sqlQuery("SELECT * FROM list_options WHERE list_id = 'lists' AND option_id = 'rooms'");

    if (!$listCheck) {
        error_log("Rooms list not found, checking for old name");
        // Check if old "Patient_Flow_Board_Rooms" list exists
        $oldList = sqlQuery("SELECT * FROM list_options WHERE list_id = 'lists' AND option_id = 'Patient_Flow_Board_Rooms'");

        if ($oldList) {
            error_log("Found old Patient_Flow_Board_Rooms list, renaming to 'rooms'");
            // Update the list name
            sqlStatement(
                "UPDATE list_options SET option_id = 'rooms', title = 'Rooms' WHERE list_id = 'lists' AND option_id = 'Patient_Flow_Board_Rooms'"
            );
            // Update all room entries to use new list_id
            sqlStatement(
                "UPDATE list_options SET list_id = 'rooms' WHERE list_id = 'Patient_Flow_Board_Rooms'"
            );
        } else {
            // Create the rooms list if it doesn't exist
            error_log("Creating new 'rooms' list");
            sqlStatement(
                "INSERT INTO list_options (list_id, option_id, title, seq, is_default, option_value, notes, activity)
                 VALUES ('lists', 'rooms', 'Rooms', 0, 0, 0, '', 1)"
            );
        }
    }

    // Fetch all rooms from the list
    $sql = "SELECT option_id, title, seq, is_default, notes
            FROM list_options
            WHERE list_id = 'rooms'
            AND activity = 1
            ORDER BY seq, title";

    error_log("Get rooms SQL: " . $sql);

    $result = sqlStatement($sql);

    $rooms = [];
    while ($row = sqlFetchArray($result)) {
        $rooms[] = [
            'id' => $row['option_id'],
            'name' => $row['title'],
            'value' => $row['option_id'],
            'label' => $row['title'],
            'isDefault' => $row['is_default'] == 1,
            'notes' => $row['notes']
        ];
    }

    error_log("Get rooms: Found " . count($rooms) . " rooms");

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'rooms' => $rooms
    ]);

} catch (Exception $e) {
    error_log("Get rooms: Error - " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch rooms',
        'message' => $e->getMessage()
    ]);
}
