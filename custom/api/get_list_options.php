<?php
/**
 * List Options API - Session-based
 * Returns dropdown options from OpenEMR's list_options table
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
error_log("List options API called - Session ID: " . session_id());

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
    error_log("List options: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("List options: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

// Get list_id from query parameter
$listId = $_GET['list_id'] ?? null;

if (!$listId) {
    error_log("List options: No list_id provided");
    http_response_code(400);
    echo json_encode(['error' => 'list_id parameter is required']);
    exit;
}

error_log("List options: User authenticated - " . $_SESSION['authUserID'] . ", fetching list: " . $listId);

try {
    // Fetch list options for the specified list_id
    // Only return active options, ordered by seq for proper display order
    $sql = "SELECT
        option_id,
        title,
        seq,
        is_default,
        option_value
    FROM list_options
    WHERE list_id = ? AND activity = 1
    ORDER BY seq, title";

    error_log("List options SQL: " . $sql . " [list_id: " . $listId . "]");
    $result = sqlStatement($sql, [$listId]);

    $options = [];
    while ($row = sqlFetchArray($result)) {
        $options[] = [
            'value' => $row['option_id'],
            'label' => $row['title'],
            'seq' => $row['seq'],
            'is_default' => $row['is_default'],
            'option_value' => $row['option_value']
        ];
    }

    error_log("List options: Found " . count($options) . " options for list: " . $listId);

    http_response_code(200);
    echo json_encode([
        'list_id' => $listId,
        'options' => $options
    ]);

} catch (Exception $e) {
    error_log("Error fetching list options: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch list options',
        'message' => $e->getMessage()
    ]);
}
