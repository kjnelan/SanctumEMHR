<?php
/**
 * Get Insurance Companies API - Session-based (MIGRATED TO MINDLINE)
 * Returns list of insurance companies for dropdowns
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
    error_log("Get insurance companies: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Get insurance companies: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $userId = $session->getUserId();
    error_log("Get insurance companies: User authenticated - $userId");

    // Initialize database
    $db = Database::getInstance();

    // Query to get active insurance companies from MINDLINE schema
    $sql = "SELECT
        id,
        name,
        payer_id,
        insurance_type,
        phone,
        email
    FROM insurance_providers
    WHERE is_active = 1
    ORDER BY name";

    error_log("Get insurance companies SQL: " . $sql);

    // Execute query using Database class
    $rows = $db->queryAll($sql);

    // Format companies for frontend (keep compatible field names)
    $companies = [];
    foreach ($rows as $row) {
        $companies[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'cms_id' => $row['payer_id'], // Keep old key for frontend
            'payer_id' => $row['payer_id'],
            'ins_type_code' => $row['insurance_type'], // Keep old key for frontend
            'insurance_type' => $row['insurance_type'],
            'phone' => $row['phone'],
            'email' => $row['email']
        ];
    }

    error_log("Get insurance companies: Found " . count($companies) . " companies");

    // Return companies
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'companies' => $companies
    ]);

} catch (Exception $e) {
    error_log("Get insurance companies: Error - " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
