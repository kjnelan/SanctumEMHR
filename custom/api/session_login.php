<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

/**
 * Session-based login endpoint for React frontend (MIGRATED TO MINDLINE)
 *
 * This endpoint authenticates users and creates a PHP session.
 *
 * @package   Mindline
 * @license   Proprietary and Confidential
 */

// Load Mindline initialization
require_once dirname(__FILE__, 2) . "/init.php";

use Custom\Lib\Auth\CustomAuth;
use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;
use Custom\Lib\Services\UserService;

// Enable CORS for React app
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Username and password are required']);
        exit;
    }

    error_log("Login attempt for user: $username");

    // Authenticate using CustomAuth
    $auth = new CustomAuth();
    $result = $auth->login($username, $password);

    if (!$result['success']) {
        error_log("Login failed for user: $username - " . $result['message']);
        http_response_code(401);
        echo json_encode([
            'error' => $result['message'] ?? 'Invalid credentials'
        ]);
        exit;
    }

    // Login successful
    $user = $result['user'];

    error_log("Login successful for user: $username (ID: {$user['id']})");

    // Return user information
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'fname' => $user['first_name'],
            'lname' => $user['last_name'],
            'fullName' => $user['first_name'] . ' ' . $user['last_name'],
            'displayName' => $user['first_name'] . ' ' . $user['last_name'],
            'userType' => $user['user_type'],
            'isProvider' => (bool) $user['is_provider'],
            'admin' => $user['user_type'] === 'admin',
            'npi' => $user['npi'] ?? null,
            'phone' => $user['phone'] ?? null
        ]
    ]);

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Login failed',
        'message' => 'An error occurred during login'
    ]);
}
