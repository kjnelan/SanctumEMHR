<?php
/**
 * MINDLINE Logout API
 *
 * Destroys user session and logs them out.
 *
 * @package MINDLINE
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load Mindline initialization
require_once dirname(__FILE__, 2) . "/init.php";

use Custom\Lib\Session\SessionManager;

// CORS headers
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only POST allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $session = SessionManager::getInstance();
    $session->start();

    // Get user info before logout for logging
    $userId = $session->getUserId();
    $username = $session->getUsername();

    // Log the logout if user was logged in
    if ($userId) {
        // Note: We could add audit logging here if needed
        error_log("User $username (ID: $userId) logged out");
    }

    // Destroy session
    $session->logout();

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Logged out successfully'
    ]);

} catch (\Exception $e) {
    error_log("Logout error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to logout']);
}
