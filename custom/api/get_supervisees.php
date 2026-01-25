<?php
/**
 * SanctumEMHR EMHR
 * Get Supervisees API - Session-based authentication
 * Returns list of users supervised by a given supervisor
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

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
    error_log("Get supervisees: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Get supervisees: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    error_log("Get supervisees: User authenticated - " . $session->getUserId());

    // Get supervisor ID from query parameter
    $supervisorId = isset($_GET['supervisor_id']) ? intval($_GET['supervisor_id']) : null;

    if (!$supervisorId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing supervisor_id parameter']);
        exit;
    }

    // Initialize database
    $db = Database::getInstance();

    // Fetch supervisees for this supervisor using the junction table
    $sql = "SELECT
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,
        u.first_name,
        u.last_name,
        u.username,
        u.title
    FROM users u
    JOIN user_supervisors us ON u.id = us.user_id
    WHERE us.supervisor_id = ?
      AND u.is_active = 1
      AND (us.ended_at IS NULL OR us.ended_at > CURDATE())
    ORDER BY u.last_name, u.first_name";

    $supervisees = $db->queryAll($sql, [$supervisorId]);

    error_log("Get supervisees: Found " . count($supervisees) . " active supervisees for supervisor ID $supervisorId (via user_supervisors table)");

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'supervisees' => array_map(function($user) {
            return [
                'id' => $user['id'],
                'value' => $user['id'],
                'label' => $user['full_name'],
                'firstName' => $user['first_name'],
                'lastName' => $user['last_name'],
                'username' => $user['username'],
                'title' => $user['title']
            ];
        }, $supervisees)
    ]);

} catch (Exception $e) {
    error_log("Get supervisees: Error - " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch supervisees',
        'message' => $e->getMessage()
    ]);
}
