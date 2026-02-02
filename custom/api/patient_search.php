<?php
/**
 * Patient Search API - Session-based (MIGRATED TO SanctumEMHR)
 * Searches for patients using session authentication
 */

// Load SanctumEMHR initialization
require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;
use Custom\Lib\Auth\PermissionChecker;

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
        error_log("Patient search: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $userId = $session->getUserId();
    error_log("Patient search: User authenticated - $userId");
    error_log("GET params: " . print_r($_GET, true));

    // Get search parameters
    $fname = isset($_GET['fname']) ? trim($_GET['fname']) : '';
    $lname = isset($_GET['lname']) ? trim($_GET['lname']) : '';

    // Need at least one search parameter
    if (empty($fname) && empty($lname)) {
        echo json_encode([]);
        exit;
    }

    // Initialize database and permission checker
    $db = Database::getInstance();
    $permissionChecker = new PermissionChecker($db);

    // Get access filter based on user's role
    $accessFilter = $permissionChecker->buildClientAccessFilter('c.id');

    // Build the SQL query for SanctumEMHR schema
    $sql = "SELECT
        c.id,
        c.first_name,
        c.last_name,
        c.date_of_birth,
        c.sex,
        c.phone_mobile,
        c.phone_home,
        c.email
    FROM clients c
    WHERE ({$accessFilter['sql']})";

    $params = $accessFilter['params'];

    // If both fname and lname provided, use AND (exact match on both)
    // If only one provided, search BOTH fields with OR (match either)
    if (!empty($fname) && !empty($lname)) {
        // Both provided - must match both
        $sql .= " AND c.first_name LIKE ? AND c.last_name LIKE ?";
        $params[] = $fname . '%';
        $params[] = $lname . '%';
    } elseif (!empty($fname)) {
        // Only fname provided - search both fname and lname
        $sql .= " AND (c.first_name LIKE ? OR c.last_name LIKE ?)";
        $params[] = $fname . '%';
        $params[] = $fname . '%';
    } elseif (!empty($lname)) {
        // Only lname provided - search both fname and lname
        $sql .= " AND (c.first_name LIKE ? OR c.last_name LIKE ?)";
        $params[] = $lname . '%';
        $params[] = $lname . '%';
    }

    $sql .= " ORDER BY c.last_name, c.first_name LIMIT 100";

    error_log("SQL Query: " . $sql);
    error_log("Params: " . print_r($params, true));

    // Execute query using Database class
    $rows = $db->queryAll($sql, $params);

    // Format results for frontend (keep API response format for compatibility)
    $results = [];
    foreach ($rows as $row) {
        $results[] = [
            'id' => $row['id'],
            'pid' => $row['id'], // Keep 'pid' for frontend compatibility
            'fname' => $row['first_name'], // Keep old format for frontend
            'lname' => $row['last_name'],
            'DOB' => $row['date_of_birth'],
            'sex' => $row['sex'],
            'phone_cell' => $row['phone_mobile'], // Keep old key for frontend
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
