<?php

/**
 * Session logout endpoint for React frontend
 *
 * This endpoint destroys the current session and logs out the user.
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

// Skip authentication checks - we'll handle logout manually
$ignoreAuth_onsite_portal_two = true;
$ignoreAuth = true;

// Set up OpenEMR environment
require_once dirname(__FILE__, 3) . "/interface/globals.php";

use OpenEMR\Common\Logging\EventAuditLogger;

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

// Log the logout event if user is authenticated
if (!empty($_SESSION['authUser']) && !empty($_SESSION['authProvider'])) {
    EventAuditLogger::instance()->newEvent(
        "logout",
        $_SESSION['authUser'],
        $_SESSION['authProvider'],
        1,
        "User logged out from React frontend"
    );
}

// Destroy the session
SessionUtil::coreSessionDestroy();

http_response_code(200);
echo json_encode(['success' => true]);
