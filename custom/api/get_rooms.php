<?php
/**
 * Mindline EMHR
 * Get Rooms API - Returns list of room/location options (MIGRATED TO MINDLINE)
 * Fetches rooms from the settings_lists table
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

// Load Mindline initialization
require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

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

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Get rooms: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $userId = $session->getUserId();
    error_log("Get rooms: User authenticated - $userId");

    // Initialize database
    $db = Database::getInstance();

    // Fetch all rooms from MINDLINE settings_lists table
    $sql = "SELECT option_id, title, sort_order, is_default, notes
            FROM settings_lists
            WHERE list_id = 'rooms'
            AND is_active = 1
            ORDER BY sort_order, title";

    error_log("Get rooms SQL: " . $sql);

    // Execute query using Database class
    $rows = $db->queryAll($sql);

    // Format rooms for frontend
    $rooms = [];
    foreach ($rows as $row) {
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
