<?php
/**
 * Mindline EMHR
 * Get Appointment Categories API - Session-based authentication (MIGRATED TO MINDLINE)
 * Returns list of active appointment categories/types
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

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
    error_log("Get appointment categories: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Get appointment categories: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    error_log("Get appointment categories: User authenticated - " . $session->getUserId());

    // Initialize database
    $db = Database::getInstance();

    // Get optional category type filter from query parameter (not used in current schema)
    // Kept for API compatibility but ignored since category_type column doesn't exist
    $categoryType = isset($_GET['type']) ? intval($_GET['type']) : null;

    // Fetch all active appointment categories
    $sql = "SELECT
        id,
        name,
        color,
        description,
        default_duration,
        is_billable,
        sort_order
    FROM appointment_categories
    WHERE is_active = 1
    ORDER BY sort_order, name";

    $params = [];

    error_log("Get appointment categories SQL: " . $sql);
    $rows = $db->queryAll($sql, $params);

    $categories = [];
    foreach ($rows as $row) {
        $categories[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'color' => $row['color'],
            'description' => $row['description'],
            'defaultDuration' => $row['default_duration'], // Duration in minutes
            'isBillable' => $row['is_billable'],
            'sortOrder' => $row['sort_order'],
            'type' => 0 // Default to patient appointments since we don't have category_type column
        ];
    }

    error_log("Get appointment categories: Found " . count($categories) . " active categories");

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'categories' => $categories
    ]);

} catch (Exception $e) {
    error_log("Error fetching appointment categories: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch appointment categories',
        'message' => $e->getMessage()
    ]);
}
