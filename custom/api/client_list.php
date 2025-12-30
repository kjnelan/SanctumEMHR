<?php
/**
 * Client List API - Session-based
 * Returns list of all clients with optional status filtering
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
error_log("Client list API called - Session ID: " . session_id());

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
    error_log("Client list: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Client list: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

error_log("Client list: User authenticated - " . $_SESSION['authUserID']);

// Get optional status filter from query parameter
$statusFilter = $_GET['status'] ?? 'all';
error_log("Client list: Status filter - " . $statusFilter);

try {
    // Build SQL query
    $sql = "SELECT
        pd.pid,
        pd.fname,
        pd.lname,
        pd.mname,
        pd.DOB,
        pd.sex,
        pd.phone_cell,
        pd.phone_home,
        pd.email,
        pd.care_team_status,
        YEAR(CURDATE()) - YEAR(pd.DOB) - (DATE_FORMAT(CURDATE(), '%m%d') < DATE_FORMAT(pd.DOB, '%m%d')) AS age
    FROM patient_data pd
    WHERE 1=1";

    $params = [];

    // Add status filter if specified
    if ($statusFilter !== 'all') {
        $sql .= " AND LOWER(pd.care_team_status) = ?";
        $params[] = strtolower($statusFilter);
    }

    $sql .= " ORDER BY pd.lname, pd.fname";

    error_log("Client list SQL: " . $sql);
    error_log("Client list params: " . print_r($params, true));

    $result = sqlStatement($sql, $params);

    $clients = [];
    while ($row = sqlFetchArray($result)) {
        $clients[] = [
            'pid' => $row['pid'],
            'fname' => $row['fname'],
            'lname' => $row['lname'],
            'mname' => $row['mname'],
            'DOB' => $row['DOB'],
            'sex' => $row['sex'],
            'phone_cell' => $row['phone_cell'],
            'phone_home' => $row['phone_home'],
            'email' => $row['email'],
            'care_team_status' => $row['care_team_status'],
            'age' => $row['age']
        ];
    }

    error_log("Client list: Returned " . count($clients) . " clients");
    http_response_code(200);
    echo json_encode($clients);

} catch (Exception $e) {
    error_log("Error fetching client list: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch client list',
        'message' => $e->getMessage()
    ]);
}
