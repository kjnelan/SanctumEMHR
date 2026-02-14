<?php
/**
 * SanctumEMHR - Client Portal Mark Messages Read API
 *
 * POST - Mark messages as read for the authenticated client
 * Body params:
 * - message_ids: Array of message IDs to mark as read
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
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated() || ($_SESSION['session_type'] ?? '') !== 'portal') {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $clientId = $_SESSION['portal_client_id'] ?? null;
    if (!$clientId) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid session']);
        exit;
    }
    $db = Database::getInstance();

    // Parse request body
    $input = json_decode(file_get_contents('php://input'), true);
    $messageIds = $input['message_ids'] ?? [];

    if (!is_array($messageIds) || empty($messageIds)) {
        http_response_code(400);
        echo json_encode(['error' => 'message_ids array is required']);
        exit;
    }

    // Build placeholders for IN clause
    $placeholders = implode(',', array_fill(0, count($messageIds), '?'));

    // Update messages - only if client is the recipient
    $sql = "UPDATE messages
            SET is_read = 1, read_at = NOW()
            WHERE id IN ($placeholders)
              AND recipient_type = 'client'
              AND recipient_client_id = ?
              AND is_read = 0";

    $params = array_merge($messageIds, [$clientId]);
    $db->execute($sql, $params);

    $affectedRows = $db->affectedRows();

    echo json_encode([
        'success' => true,
        'markedCount' => $affectedRows
    ]);

} catch (\Exception $e) {
    error_log("Portal mark read error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
