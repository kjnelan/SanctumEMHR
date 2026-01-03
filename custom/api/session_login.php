<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

/**
 * Session-based login endpoint for React frontend
 *
 * This endpoint authenticates users and creates a PHP session,
 * eliminating the need for OAuth2 configuration.
 *
 * @package   OpenEMR
 * @link      https://www.open-emr.org
 * @license   https://github.com/openemr/openemr/blob/master/LICENSE GNU General Public License 3
 */

// Set the site ID before loading OpenEMR globals
$_GET['site'] = 'default';

// Load autoloader first
$GLOBALS['already_autoloaded'] = true;
require_once dirname(__FILE__, 3) . "/vendor/autoload.php";

// Set webroot and start core session
$GLOBALS['webroot'] = '';
use OpenEMR\Common\Session\SessionUtil;
SessionUtil::coreSessionStart($GLOBALS['webroot']);

// Skip authentication checks for this login endpoint
$ignoreAuth_onsite_portal_two = true;
$ignoreAuth = true;

// Set up OpenEMR environment
require_once dirname(__FILE__, 3) . "/interface/globals.php";

use OpenEMR\Common\Auth\AuthUtils;
use OpenEMR\Common\Csrf\CsrfUtils;
use OpenEMR\Common\Logging\EventAuditLogger;
use OpenEMR\Common\Session\SessionUtil;
use OpenEMR\Services\UserService;

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

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

$username = $input['username'] ?? '';
$password = $input['password'] ?? '';

// Validate input
if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Username and password are required']);
    exit;
}

// Attempt authentication using OpenEMR's built-in auth
$authUtils = new AuthUtils('login');
$loginSuccess = $authUtils->confirmPassword($username, $password);

if ($loginSuccess !== true) {
    // Login failed
    EventAuditLogger::instance()->newEvent("login", $username, '', 0, "Failed login attempt from React frontend");

    // Clear password from memory
    if (function_exists('sodium_memzero')) {
        sodium_memzero($password);
    }

    http_response_code(401);
    echo json_encode(['error' => 'Invalid username or password']);
    exit;
}

// Login successful - session variables are already set by confirmPassword()
// The session should now contain: authUser, authProvider, authUserID, etc.

// Log successful login
EventAuditLogger::instance()->newEvent("login", $_SESSION['authUser'], $_SESSION['authProvider'] ?? '', 1, "Successful login from React frontend");

// Get user details for response
$userService = new UserService();
try {
    $user = $userService->getUser($_SESSION['authUserID']);

    $response = [
        'success' => true,
        'user' => [
            'id' => $_SESSION['authUserID'],
            'username' => $_SESSION['authUser'],
            'fname' => $user['fname'] ?? '',
            'lname' => $user['lname'] ?? '',
            'fullName' => trim(($user['fname'] ?? '') . ' ' . ($user['lname'] ?? '')),
            'authorized' => $_SESSION['authProvider'] ?? 0,
            'calendar' => $_SESSION['calendar'] ?? 0,
            'admin' => ($user['calendar'] ?? 0) == 1 // Only calendar admins have admin access
        ]
    ];

    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error fetching user details: " . $e->getMessage());

    // Return basic info even if detailed fetch fails
    $response = [
        'success' => true,
        'user' => [
            'id' => $_SESSION['authUserID'],
            'username' => $_SESSION['authUser'],
            'fname' => '',
            'lname' => '',
            'fullName' => $_SESSION['authUser'],
            'authorized' => $_SESSION['authProvider'] ?? 0,
            'admin' => false
        ]
    ];

    http_response_code(200);
    echo json_encode($response);
}

// Clear password from memory
if (function_exists('sodium_memzero')) {
    sodium_memzero($password);
}
