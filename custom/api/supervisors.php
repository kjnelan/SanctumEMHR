<?php
/**
 * Mindline EMHR - Supervisors API
 * Returns list of users who can be supervisors
 *
 * @package   Mindline
 * @author    Kenneth J. Nelan / Sacred Wandering
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $db = Database::getInstance();

    // Get all providers and admins who can be supervisors
    $sql = "SELECT
        id,
        username,
        CONCAT(first_name, ' ', last_name) AS full_name,
        first_name AS fname,
        last_name AS lname,
        user_type,
        is_provider
    FROM users
    WHERE is_active = 1
    AND (is_provider = 1 OR user_type = 'admin')
    ORDER BY last_name, first_name";

    $supervisors = $db->queryAll($sql);

    http_response_code(200);
    echo json_encode(['supervisors' => $supervisors]);

} catch (\Exception $e) {
    error_log("Supervisors API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
