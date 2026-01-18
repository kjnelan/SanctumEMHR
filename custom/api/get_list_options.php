<?php
/**
 * Get List Options API - Session-based (MIGRATED TO MINDLINE)
 * Returns list options (dropdown values) for a specified list
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
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("List options: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $userId = $session->getUserId();

    // Get list_id from query parameter
    $listId = $_GET['list_id'] ?? null;

    if (!$listId) {
        error_log("List options: No list_id provided");
        http_response_code(400);
        echo json_encode(['error' => 'list_id parameter is required']);
        exit;
    }

    error_log("List options: User $userId fetching list: $listId");

    // Initialize database
    $db = Database::getInstance();

    // Fetch list options from MINDLINE settings_lists table
    $sql = "SELECT
        option_id,
        title,
        sort_order,
        is_default,
        notes
    FROM settings_lists
    WHERE list_id = ? AND is_active = 1
    ORDER BY sort_order, title";

    error_log("List options SQL: $sql [list_id: $listId]");

    // Execute query using Database class
    $rows = $db->queryAll($sql, [$listId]);

    // Format options for frontend
    $options = [];
    foreach ($rows as $row) {
        $options[] = [
            'option_id' => $row['option_id'],
            'title' => $row['title'],
            'value' => $row['option_id'],
            'label' => $row['title'],
            'seq' => $row['sort_order'], // Keep old key for frontend
            'is_default' => $row['is_default'],
            'notes' => $row['notes']
        ];
    }

    error_log("List options: Found " . count($options) . " options for list '$listId'");

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'list_id' => $listId,
        'options' => $options
    ]);

} catch (Exception $e) {
    error_log("List options: Error - " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
