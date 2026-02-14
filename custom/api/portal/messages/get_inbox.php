<?php
/**
 * SanctumEMHR - Client Portal Messages Inbox API
 *
 * GET - Returns messages for the authenticated portal/client user
 * Query params:
 * - view: 'inbox' (default), 'sent'
 * - limit: Number of threads to return (default: 50)
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

    // Check for client/portal authentication
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

    // Query parameters
    $view = $_GET['view'] ?? 'inbox';
    $limit = min((int) ($_GET['limit'] ?? 50), 200);

    // Build query based on view
    $params = [];

    if ($view === 'inbox') {
        // Received messages (client is recipient)
        $sql = "SELECT
                    m.id,
                    m.uuid,
                    m.subject,
                    m.body,
                    m.sender_type,
                    m.sender_user_id,
                    m.is_read,
                    m.read_at,
                    m.priority,
                    m.thread_id,
                    m.created_at,

                    -- Sender info (staff member)
                    CONCAT(u.first_name, ' ', u.last_name) AS sender_name,

                    -- Thread reply count
                    (SELECT COUNT(*) FROM messages WHERE thread_id = m.thread_id AND id != m.id) AS reply_count,

                    -- Last reply timestamp
                    (SELECT MAX(created_at) FROM messages WHERE thread_id = m.thread_id) AS last_reply_at

                FROM messages m
                LEFT JOIN users u ON u.id = m.sender_user_id
                WHERE m.recipient_type = 'client'
                  AND m.recipient_client_id = ?
                  AND m.deleted_at IS NULL
                  AND m.status != 'draft'
                  AND (m.thread_id IS NULL OR m.thread_id = m.id)
                ORDER BY last_reply_at DESC, m.created_at DESC
                LIMIT ?";

        $params = [$clientId, $limit];

    } elseif ($view === 'sent') {
        // Sent messages (client is sender)
        $sql = "SELECT
                    m.id,
                    m.uuid,
                    m.subject,
                    m.body,
                    m.recipient_type,
                    m.recipient_user_id,
                    m.is_read,
                    m.read_at,
                    m.priority,
                    m.thread_id,
                    m.created_at,

                    -- Recipient info (staff member)
                    CONCAT(u.first_name, ' ', u.last_name) AS recipient_name,

                    -- Thread reply count
                    (SELECT COUNT(*) FROM messages WHERE thread_id = m.thread_id AND id != m.id) AS reply_count,

                    -- Last reply timestamp
                    (SELECT MAX(created_at) FROM messages WHERE thread_id = m.thread_id) AS last_reply_at

                FROM messages m
                LEFT JOIN users u ON u.id = m.recipient_user_id
                WHERE m.sender_type = 'client'
                  AND m.sender_client_id = ?
                  AND m.deleted_at IS NULL
                  AND m.status != 'draft'
                  AND (m.thread_id IS NULL OR m.thread_id = m.id)
                ORDER BY last_reply_at DESC, m.created_at DESC
                LIMIT ?";

        $params = [$clientId, $limit];

    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid view parameter']);
        exit;
    }

    $messages = $db->queryAll($sql, $params) ?: [];

    // Get unread count
    $unreadSql = "SELECT COUNT(*) as count
                  FROM messages
                  WHERE recipient_type = 'client'
                    AND recipient_client_id = ?
                    AND is_read = 0
                    AND deleted_at IS NULL
                    AND status = 'sent'";

    $unreadCount = $db->query($unreadSql, [$clientId]);

    // Format response
    $formatted = array_map(function ($msg) use ($view) {
        return [
            'id' => $msg['id'],
            'uuid' => $msg['uuid'],
            'subject' => $msg['subject'],
            'preview' => mb_substr(strip_tags($msg['body']), 0, 150),
            'senderName' => $msg['sender_name'] ?? null,
            'recipientName' => $msg['recipient_name'] ?? null,
            'isRead' => (bool) $msg['is_read'],
            'readAt' => $msg['read_at'],
            'priority' => $msg['priority'],
            'replyCount' => (int) $msg['reply_count'],
            'lastReplyAt' => $msg['last_reply_at'],
            'createdAt' => $msg['created_at']
        ];
    }, $messages);

    echo json_encode([
        'success' => true,
        'view' => $view,
        'messages' => $formatted,
        'unreadCount' => (int) ($unreadCount['count'] ?? 0),
        'count' => count($formatted)
    ]);

} catch (\Exception $e) {
    error_log("Portal inbox error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
