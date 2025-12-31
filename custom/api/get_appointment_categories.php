<?php
/**
 * Get Appointment Categories API - Session-based
 * Returns list of active appointment categories/types
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
error_log("Get appointment categories API called - Session ID: " . session_id());

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

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Get appointment categories: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

error_log("Get appointment categories: User authenticated - " . $_SESSION['authUserID']);

try {
    // Fetch all active appointment categories
    $sql = "SELECT
        pc_catid,
        pc_catname,
        pc_catcolor,
        pc_catdesc,
        pc_duration,
        pc_cattype
    FROM openemr_postcalendar_categories
    WHERE pc_active = 1
    ORDER BY pc_catname";

    error_log("Get appointment categories SQL: " . $sql);
    $result = sqlStatement($sql);

    $categories = [];
    while ($row = sqlFetchArray($result)) {
        $categories[] = [
            'id' => $row['pc_catid'],
            'name' => $row['pc_catname'],
            'color' => $row['pc_catcolor'],
            'description' => $row['pc_catdesc'],
            'defaultDuration' => $row['pc_duration'], // Duration in seconds
            'type' => $row['pc_cattype']
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
