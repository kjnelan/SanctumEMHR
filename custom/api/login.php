<?php
/**
 * MINDLINE Login API
 *
 * Handles user authentication using the new MINDLINE database and auth system.
 *
 * @package MINDLINE
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Load init.php which handles all class loading
require_once dirname(__FILE__, 2) . "/init.php";

use Custom\Lib\Database\Database;
use Custom\Lib\Auth\CustomAuth;
use Custom\Lib\Session\SessionManager;
use Custom\Lib\Services\UserService;

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

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Username and password required']);
    exit;
}

try {
    // Initialize services
    $db = Database::getInstance();
    $auth = new CustomAuth($db);
    $session = SessionManager::getInstance();
    $userService = new UserService($db, $auth);

    // Start session
    $session->start();

    // Authenticate user
    $user = $auth->authenticate($username, $password);

    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid username or password']);
        exit;
    }

    // Login successful - set session
    $session->login($user);

    // Get full user details for response
    $userDetails = $userService->getUserWithFormattedName($user['id']);

    // Return success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $userDetails['id'],
            'username' => $userDetails['username'],
            'email' => $userDetails['email'],
            'fname' => $userDetails['first_name'],
            'lname' => $userDetails['last_name'],
            'fullName' => $userDetails['full_name'],
            'displayName' => $userDetails['display_name'],
            'userType' => $userDetails['user_type'],
            'isProvider' => (bool) $userDetails['is_provider'],
            'admin' => $userDetails['user_type'] === 'admin',
            'npi' => $userDetails['npi'] ?? null
        ]
    ]);

} catch (\Exception $e) {
    error_log("Login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred during login. Please try again.']);
}
