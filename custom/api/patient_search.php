<?php
/**
 * Patient Search API - Session-based
 * Searches for patients using session authentication
 */

// IMPORTANT: Set these BEFORE loading globals.php to prevent redirects
$ignoreAuth = true;
$ignoreAuth_onsite_portal = true;
$ignoreAuth_onsite_portal_two = true;

require_once(__DIR__ . '/../../interface/globals.php');

// Enable error logging
error_log("Patient search called - Session ID: " . session_id());
error_log("GET params: " . print_r($_GET, true));

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

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Patient search: Not authenticated");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

error_log("Patient search: User authenticated - " . $_SESSION['authUserID']);

// Get search parameters
$fname = isset($_GET['fname']) ? trim($_GET['fname']) : '';
$lname = isset($_GET['lname']) ? trim($_GET['lname']) : '';

// Need at least one search parameter
if (empty($fname) && empty($lname)) {
    echo json_encode([]);
    exit;
}

// Build the SQL query
$sql = "SELECT
    pid AS id,
    pid,
    fname,
    lname,
    DOB,
    sex,
    phone_cell,
    phone_home,
    email
FROM patient_data
WHERE 1=1";

$params = [];
$types = '';

// If both fname and lname provided, use AND (exact match on both)
// If only one provided, search BOTH fields with OR (match either)
if (!empty($fname) && !empty($lname)) {
    // Both provided - must match both
    $sql .= " AND fname LIKE ? AND lname LIKE ?";
    $params[] = $fname . '%';
    $params[] = $lname . '%';
    $types .= 'ss';
} elseif (!empty($fname)) {
    // Only fname provided - search both fname and lname
    $sql .= " AND (fname LIKE ? OR lname LIKE ?)";
    $params[] = $fname . '%';
    $params[] = $fname . '%';
    $types .= 'ss';
} elseif (!empty($lname)) {
    // Only lname provided - search both fname and lname
    $sql .= " AND (fname LIKE ? OR lname LIKE ?)";
    $params[] = $lname . '%';
    $params[] = $lname . '%';
    $types .= 'ss';
}

$sql .= " ORDER BY lname, fname LIMIT 100";

error_log("SQL Query: " . $sql);
error_log("Params: " . print_r($params, true));

try {
    // Prepare and execute query
    $stmt = sqlStatement($sql, $params);

    $results = [];
    while ($row = sqlFetchArray($stmt)) {
        $results[] = [
            'id' => $row['id'],
            'pid' => $row['pid'],
            'fname' => $row['fname'],
            'lname' => $row['lname'],
            'DOB' => $row['DOB'],
            'sex' => $row['sex'],
            'phone_cell' => $row['phone_cell'],
            'phone_home' => $row['phone_home'],
            'email' => $row['email']
        ];
    }

    error_log("Patient search returned " . count($results) . " results");
    echo json_encode($results);

} catch (Exception $e) {
    error_log('Patient search error: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => 'Search failed', 'message' => $e->getMessage()]);
}
