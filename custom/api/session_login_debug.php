<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

echo json_encode(['step' => 1, 'message' => 'Starting']);
flush();

try {
    // Set the site ID
    $_GET['site'] = 'default';
    echo json_encode(['step' => 2, 'message' => 'Site ID set']);
    flush();

    // Load autoloader
    $GLOBALS['already_autoloaded'] = true;
    $vendorPath = dirname(__FILE__, 3) . "/vendor/autoload.php";
    echo json_encode(['step' => 3, 'message' => 'Autoloader path: ' . $vendorPath, 'exists' => file_exists($vendorPath)]);
    flush();

    require_once $vendorPath;
    echo json_encode(['step' => 4, 'message' => 'Autoloader loaded']);
    flush();

    // Set webroot
    $GLOBALS['webroot'] = '';
    echo json_encode(['step' => 5, 'message' => 'Webroot set']);
    flush();

    // Start session
    use OpenEMR\Common\Session\SessionUtil;
    SessionUtil::coreSessionStart($GLOBALS['webroot']);
    echo json_encode(['step' => 6, 'message' => 'Session started']);
    flush();

    // Set ignore auth flags
    $ignoreAuth_onsite_portal_two = true;
    $ignoreAuth = true;
    echo json_encode(['step' => 7, 'message' => 'Auth flags set']);
    flush();

    // Load globals
    $globalsPath = dirname(__FILE__, 3) . "/interface/globals.php";
    echo json_encode(['step' => 8, 'message' => 'Globals path: ' . $globalsPath, 'exists' => file_exists($globalsPath)]);
    flush();

    require_once $globalsPath;
    echo json_encode(['step' => 9, 'message' => 'Globals loaded']);
    flush();

    echo json_encode(['step' => 10, 'message' => 'Success - all loaded']);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
} catch (Error $e) {
    echo json_encode(['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
}
