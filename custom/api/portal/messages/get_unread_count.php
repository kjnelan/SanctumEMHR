<?php
/**
 * SanctumEMHR - Client Portal Get Unread Message Count API
 *
 * GET - Returns the number of unread messages for the authenticated client
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright (c) 2026 Sacred Wandering
 * Proprietary and Confidential
 */

require_once dirname(__FILE__, 4) . "/init.php";

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $session = SessionManager::getInstance();
    $session->start();

    $clientId = $_SESSION['portal_client_id'] ?? null;
    if (!$clientId || ($_SESSION['session_type'] ?? '') !== 'portal') {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }
    $db = Database::getInstance();

    // Get unread count
    $sql = "SELECT COUNT(*) as count
            FROM messages
            WHERE recipient_type = 'client'
              AND recipient_client_id = ?
              AND is_read = 0
              AND deleted_at IS NULL
              AND status = 'sent'";

    $result = $db->query($sql, [$clientId]);

    echo json_encode([
        'success' => true,
        'unreadCount' => (int) ($result['count'] ?? 0)
    ]);

} catch (\Exception $e) {
    error_log("Portal unread count error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
