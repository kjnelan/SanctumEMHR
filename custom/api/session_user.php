<?php

/**
 * Get current user information from session
 *
 * This endpoint returns user details for the currently authenticated session.
 * Used by the React frontend to check authentication status and get user info.
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

// Skip authentication checks - we'll manually verify session
$ignoreAuth_onsite_portal_two = true;
$ignoreAuth = true;

// Set up OpenEMR environment
require_once dirname(__FILE__, 3) . "/interface/globals.php";

use OpenEMR\Services\UserService;

// Enable CORS for React app
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Check if user is authenticated
if (empty($_SESSION['authUser']) || empty($_SESSION['authUserID'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

// Get user details
$userService = new UserService();

try {
    $user = $userService->getUser($_SESSION['authUserID']);

    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    $response = [
        'id' => $_SESSION['authUserID'],
        'username' => $_SESSION['authUser'],
        'fname' => $user['fname'] ?? '',
        'lname' => $user['lname'] ?? '',
        'fullName' => trim(($user['fname'] ?? '') . ' ' . ($user['lname'] ?? '')),
        'authorized' => $_SESSION['authProvider'] ?? 0,
        'calendar' => $_SESSION['calendar'] ?? 0,
        'admin' => ($user['calendar'] ?? 0) == 1, // Only calendar admins have admin access
        'facility' => $user['facility'] ?? '',
        'facility_id' => $user['facility_id'] ?? ''
    ];

    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error fetching user details: " . $e->getMessage());

    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch user details']);
}
