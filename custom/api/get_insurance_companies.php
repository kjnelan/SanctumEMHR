<?php
/**
 * Get Insurance Companies API - Session-based
 * Returns list of insurance companies for dropdowns
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
error_log("Get insurance companies API called - Session ID: " . session_id());

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

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Get insurance companies: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

error_log("Get insurance companies: User authenticated - " . $_SESSION['authUserID']);

try {
    // Query to get active insurance companies
    $sql = "SELECT
        id,
        name,
        attn,
        cms_id,
        ins_type_code,
        x12_receiver_id,
        x12_default_partner_id
    FROM insurance_companies
    WHERE inactive = 0
    ORDER BY name";

    error_log("Get insurance companies SQL: " . $sql);

    $result = sqlStatement($sql);

    $companies = [];
    while ($row = sqlFetchArray($result)) {
        $companies[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'attn' => $row['attn'],
            'cms_id' => $row['cms_id'],
            'ins_type_code' => $row['ins_type_code'],
            'x12_receiver_id' => $row['x12_receiver_id'],
            'x12_default_partner_id' => $row['x12_default_partner_id']
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
