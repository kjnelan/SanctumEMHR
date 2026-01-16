<?php
/**
 * MINDLINE Session User API
 *
 * Returns current authenticated user information from session.
 * Used by React frontend to check authentication status.
 *
 * @package MINDLINE
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load Composer autoloader
require_once dirname(__FILE__, 3) . "/vendor/autoload.php";

// Load custom classes
require_once dirname(__FILE__, 2) . "/lib/Database/Database.php";
require_once dirname(__FILE__, 2) . "/lib/Auth/CustomAuth.php";
require_once dirname(__FILE__, 2) . "/lib/Session/SessionManager.php";
require_once dirname(__FILE__, 2) . "/lib/Services/UserService.php";

use Custom\Lib\Database\Database;
use Custom\Lib\Auth\CustomAuth;
use Custom\Lib\Session\SessionManager;
use Custom\Lib\Services\UserService;

// CORS headers
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only GET allowed
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize services
    $session = SessionManager::getInstance();
    $session->start();

    // Check if user is authenticated
    if (!$session->isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    // Get user ID from session
    $userId = $session->getUserId();

    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid session']);
        exit;
    }

    // Get user details from database
    $userService = new UserService();
    $user = $userService->getUserWithFormattedName($userId);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    // Check if user is still active
    if (!$user['is_active']) {
        http_response_code(403);
        echo json_encode(['error' => 'Account is inactive']);
        exit;
    }

    // Return user information
    http_response_code(200);
    echo json_encode([
        'id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'firstName' => $user['first_name'],
        'lastName' => $user['last_name'],
        'fullName' => $user['full_name'],
        'displayName' => $user['display_name'],
        'userType' => $user['user_type'],
        'isProvider' => (bool) $user['is_provider'],
        'isAdmin' => $user['user_type'] === 'admin',
        'npi' => $user['npi'] ?? null,
        'phone' => $user['phone'] ?? null,
        'email' => $user['email'] ?? null
    ]);

} catch (\Exception $e) {
    error_log("Session user error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch user details']);
}
