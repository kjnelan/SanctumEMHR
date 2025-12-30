<?php
/**
 * Get Providers API - Session-based
 * Returns list of active providers/clinicians
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
error_log("Get providers API called - Session ID: " . session_id());

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

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Get providers: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

error_log("Get providers: User authenticated - " . $_SESSION['authUserID']);

try {
    // Fetch all active authorized users (providers/clinicians)
    $sql = "SELECT
        id,
        CONCAT(fname, ' ', lname) AS full_name,
        fname,
        lname,
        username
    FROM users
    WHERE active = 1 AND authorized = 1
    ORDER BY lname, fname";

    error_log("Get providers SQL: " . $sql);
    $result = sqlStatement($sql);

    $providers = [];
    while ($row = sqlFetchArray($result)) {
        $providers[] = [
            'value' => $row['id'],
            'label' => $row['full_name']
        ];
    }

    error_log("Get providers: Found " . count($providers) . " active providers");

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
