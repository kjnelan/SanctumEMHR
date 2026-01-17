<?php
/**
 * Client List API - Session-based (MIGRATED TO MINDLINE)
 * Returns list of all clients with optional status filtering
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
    error_log("Client list: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Client list: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $userId = $session->getUserId();
    error_log("Client list: User authenticated - $userId");

    // Get optional status filter from query parameter
    $statusFilter = $_GET['status'] ?? 'all';
    error_log("Client list: Status filter - " . $statusFilter);

    // Initialize database
    $db = Database::getInstance();

    // Build SQL query for MINDLINE schema
    $sql = "SELECT
        c.id,
        c.first_name,
        c.last_name,
        c.middle_name,
        c.date_of_birth,
        c.sex,
        c.phone_mobile,
        c.phone_home,
        c.email,
        c.status,
        YEAR(CURDATE()) - YEAR(c.date_of_birth) - (DATE_FORMAT(CURDATE(), '%m%d') < DATE_FORMAT(c.date_of_birth, '%m%d')) AS age
    FROM clients c
    WHERE 1=1";

    $params = [];

    // Add status filter if specified
    if ($statusFilter !== 'all') {
        $sql .= " AND c.status = ?";
        $params[] = strtolower($statusFilter);
    }

    $sql .= " ORDER BY c.last_name, c.first_name";

    error_log("Client list SQL: " . $sql);
    error_log("Client list params: " . print_r($params, true));

    // Execute query using Database class
    $rows = $db->queryAll($sql, $params);

    // Format clients for frontend (keep API response format for compatibility)
    $clients = [];
    foreach ($rows as $row) {
        $clients[] = [
            'pid' => $row['id'],
            'fname' => $row['first_name'],
            'lname' => $row['last_name'],
            'mname' => $row['middle_name'],
            'DOB' => $row['date_of_birth'],
            'sex' => $row['sex'],
            'phone_cell' => $row['phone_mobile'],
            'phone_home' => $row['phone_home'],
            'email' => $row['email'],
            'care_team_status' => $row['status'],
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
