<?php
/**
 * Session Login Debug - Shows session status (MIGRATED TO MINDLINE)
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

try {
    echo json_encode(['step' => 1, 'message' => 'Starting Mindline debug']) . "\n";

    // Load Mindline initialization
    require_once dirname(__FILE__, 2) . "/init.php";
    echo json_encode(['step' => 2, 'message' => 'Mindline init loaded']) . "\n";

    use Custom\Lib\Session\SessionManager;
    echo json_encode(['step' => 3, 'message' => 'SessionManager loaded']) . "\n";

    $session = SessionManager::getInstance();
    echo json_encode(['step' => 4, 'message' => 'SessionManager instance created']) . "\n";

    $session->start();
    echo json_encode(['step' => 5, 'message' => 'Session started']) . "\n";

    $info = [
        'step' => 6,
        'message' => 'Success - Mindline session system working',
        'session_id' => session_id(),
        'is_authenticated' => $session->isAuthenticated(),
        'user_id' => $session->getUserId(),
        'username' => $session->getUsername()
    ];

    echo json_encode($info, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
} catch (Error $e) {
    echo json_encode(['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
}
