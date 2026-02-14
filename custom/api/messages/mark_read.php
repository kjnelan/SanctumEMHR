<?php
/**
 * SanctumEMHR - Mark Message as Read API
 *
 * POST - Mark one or more messages as read
 * Body params:
 * - message_ids: Array of message IDs (required)
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright (c) 2026 Sacred Wandering
 * Proprietary and Confidential
 */

require_once dirname(__FILE__, 3) . "/init.php";

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;
use Custom\Lib\Audit\AuditLogger;

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

    $userId = null;
    $clientId = null;
    $recipientType = null;

    if ($session->isAuthenticated() && ($_SESSION['session_type'] ?? 'staff') === 'staff') {
        $userId = $session->getUserId();
        $recipientType = 'staff';
    } elseif (isset($_SESSION['portal_client_id']) && ($_SESSION['session_type'] ?? '') === 'portal') {
        $clientId = $_SESSION['portal_client_id'];
        $recipientType = 'client';
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $messageIds = $input['message_ids'] ?? [];

    if (empty($messageIds) || !is_array($messageIds)) {
        http_response_code(400);
        echo json_encode(['error' => 'message_ids array required']);
        exit;
    }

    $db = Database::getInstance();

    // Build placeholders for IN clause
    $placeholders = implode(',', array_fill(0, count($messageIds), '?'));

    // Update messages
    $sql = "UPDATE messages
            SET is_read = 1,
                read_at = NOW()
            WHERE id IN ($placeholders)
              AND recipient_type = ?";

    $params = array_merge($messageIds, [$recipientType]);

    if ($recipientType === 'staff') {
        $sql .= " AND recipient_user_id = ?";
        $params[] = $userId;
    } else {
        $sql .= " AND recipient_client_id = ?";
        $params[] = $clientId;
    }

    $sql .= " AND is_read = 0"; // Only update unread messages

    $db->execute($sql, $params);
    $affectedRows = $db->affectedRows();

    // Audit log
    if ($affectedRows > 0) {
        $logger = AuditLogger::getInstance();
        $logger->log(
            'messages_marked_read',
            'message',
            null,
            sprintf(
                "%s marked %d message(s) as read: %s",
                $recipientType === 'staff' ? "Staff user $userId" : "Client $clientId",
                $affectedRows,
                implode(', ', $messageIds)
            ),
            $userId ?? null
        );
    }

    echo json_encode([
        'success' => true,
        'markedCount' => $affectedRows
    ]);

} catch (\Exception $e) {
    error_log("Mark read error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
