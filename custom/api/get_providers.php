<?php
/**
 * Get Providers API - Session-based (MIGRATED TO SanctumEMHR)
 * Returns list of active providers/clinicians
 */

// Load SanctumEMHR initialization
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
    error_log("Get providers: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Get providers: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $userId = $session->getUserId();
    error_log("Get providers: User authenticated - $userId");

    // Initialize database
    $db = Database::getInstance();

    // Fetch all active staff who can have appointments (providers and social workers) from SanctumEMHR schema
    $sql = "SELECT
        id,
        CONCAT(first_name, ' ', last_name) AS full_name,
        first_name,
        last_name,
        username,
        is_provider,
        is_social_worker
    FROM users
    WHERE is_active = 1 AND (is_provider = 1 OR is_social_worker = 1)
    ORDER BY last_name, first_name";

    error_log("Get providers SQL: " . $sql);

    // Execute query using Database class
    $rows = $db->queryAll($sql);

    // Format providers for frontend
    $providers = [];
    foreach ($rows as $row) {
        $providers[] = [
            'value' => $row['id'],
            'label' => $row['full_name']
        ];
    }

    error_log("Get providers: Found " . count($providers) . " active providers/social workers");

    http_response_code(200);
    echo json_encode([
        'providers' => $providers
    ]);

} catch (Exception $e) {
    error_log("Error fetching providers: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch providers',
        'message' => $e->getMessage()
    ]);
}
