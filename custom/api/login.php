<?php
/**
 * Simple JSON login wrapper for OpenEMR's existing authentication
 *
 * This is just a thin API wrapper - all actual authentication
 * is handled by OpenEMR's existing auth.inc.php system.
 */

// Enable error display for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set site before including anything
$_GET['site'] = 'default';

// Allow auth.inc.php to run without redirecting
$ignoreAuth = true;
$sessionAllowWrite = true;

// Include OpenEMR's auth system
require_once dirname(__FILE__, 3) . "/interface/globals.php";

// CORS headers
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
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
$username = $input['username'] ?? '';
$password = $input['password'] ?? '';

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Username and password required']);
    exit;
}

// Use OpenEMR's existing auth system
use OpenEMR\Common\Auth\AuthUtils;
use OpenEMR\Common\Logging\EventAuditLogger;
use OpenEMR\Services\UserService;

$authUtils = new AuthUtils('login');
$loginSuccess = $authUtils->confirmPassword($username, $password);

if ($loginSuccess !== true) {
    EventAuditLogger::instance()->newEvent("login", $username, '', 0, "Failed login from React app");

    http_response_code(401);
    echo json_encode(['error' => 'Invalid username or password']);
    exit;
}

// Get user details FIRST to ensure we have valid user data
$userService = new UserService();
$userRecord = $userService->getUserByUsername($username);

if (!$userRecord) {
    http_response_code(401);
    echo json_encode(['error' => 'User not found']);
    exit;
}

// EXPLICITLY set all required session variables
// confirmPassword may have set some, but let's ensure they're ALL set
$_SESSION['authUser'] = $username;
$_SESSION['authUserID'] = $userRecord['id'];
$_SESSION['authProvider'] = $userRecord['authorized'] ?? 0;
$_SESSION['calendar'] = $userRecord['calendar'] ?? 0;
$_SESSION['userauthorized'] = $userRecord['authorized'] ?? 0;

// Write session to ensure it persists
session_write_close();
session_start(); // Restart for reading

// Login successful
EventAuditLogger::instance()->newEvent("login", $_SESSION['authUser'], $_SESSION['authProvider'] ?? '', 1, "Successful login from React app");

echo json_encode([
    'success' => true,
    'user' => [
        'id' => $_SESSION['authUserID'],
        'username' => $_SESSION['authUser'],
        'fname' => $userRecord['fname'] ?? '',
        'lname' => $userRecord['lname'] ?? '',
        'fullName' => trim(($userRecord['fname'] ?? '') . ' ' . ($userRecord['lname'] ?? '')),
        'authorized' => $_SESSION['authProvider'] ?? 0,
        'admin' => ($userRecord['calendar'] ?? 0) == 1 // Only calendar admins have admin access
    ]
]);
