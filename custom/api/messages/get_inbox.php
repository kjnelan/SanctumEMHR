<?php
/**
 * SanctumEMHR - Staff Messages Inbox API
 *
 * GET - Returns messages for the authenticated staff user
 * Query params:
 * - view: 'inbox' (default), 'sent', 'archived'
 * - limit: Number of threads to return (default: 50)
 * - client_id: Filter by specific client (optional)
 *
 * RBAC: Staff can only see messages for clients they are authorized to access
 * (assigned as provider, supervisor, or admin)
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

    if (!$session->isAuthenticated() || ($_SESSION['session_type'] ?? 'staff') !== 'staff') {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $userId = $session->getUserId();
    $db = Database::getInstance();

    // Get user role for RBAC
    $userSql = "SELECT user_type, is_supervisor FROM users WHERE id = ?";
    $user = $db->query($userSql, [$userId]);

    if (!$user) {
        http_response_code(403);
        echo json_encode(['error' => 'User not found']);
        exit;
    }

    $isAdmin = $user['user_type'] === 'admin';
    $isSupervisor = $user['is_supervisor'] == 1;

    // Query parameters
    $view = $_GET['view'] ?? 'inbox';
    $limit = min((int) ($_GET['limit'] ?? 50), 200);
    $filterClientId = $_GET['client_id'] ?? null;

    // Build query based on view
    $params = [];

    if ($view === 'inbox') {
        // Received messages (staff is recipient)
        $sql = "SELECT
                    m.id,
                    m.uuid,
                    m.subject,
                    m.body,
                    m.sender_type,
                    m.sender_user_id,
                    m.sender_client_id,
                    m.is_read,
                    m.read_at,
                    m.priority,
                    m.requires_response,
                    m.related_client_id,
                    m.thread_id,
                    m.created_at,

                    -- Sender info
                    CASE
                        WHEN m.sender_type = 'staff' THEN CONCAT(su.first_name, ' ', su.last_name)
                        WHEN m.sender_type = 'client' THEN CONCAT(sc.first_name, ' ', sc.last_name)
                    END AS sender_name,

                    -- Client info (for thread context)
                    CONCAT(c.first_name, ' ', c.last_name) AS client_name,

                    -- Thread reply count
                    (SELECT COUNT(*) FROM messages WHERE thread_id = m.thread_id AND id != m.id) AS reply_count,

                    -- Last reply timestamp
                    (SELECT MAX(created_at) FROM messages WHERE thread_id = m.thread_id) AS last_reply_at

                FROM messages m
                LEFT JOIN users su ON su.id = m.sender_user_id
                LEFT JOIN clients sc ON sc.id = m.sender_client_id
                LEFT JOIN clients c ON c.id = m.related_client_id
                WHERE m.recipient_type = 'staff'
                  AND m.recipient_user_id = ?
                  AND m.deleted_at IS NULL
                  AND m.status != 'draft'
                  AND (m.thread_id IS NULL OR m.thread_id = m.id)"; // Only show thread roots

        $params[] = $userId;

    } elseif ($view === 'sent') {
        // Sent messages (staff is sender)
        $sql = "SELECT
                    m.id,
                    m.uuid,
                    m.subject,
                    m.body,
                    m.recipient_type,
                    m.recipient_user_id,
                    m.recipient_client_id,
                    m.is_read,
                    m.read_at,
                    m.priority,
                    m.requires_response,
                    m.related_client_id,
                    m.thread_id,
                    m.created_at,

                    -- Recipient info
                    CASE
                        WHEN m.recipient_type = 'staff' THEN CONCAT(ru.first_name, ' ', ru.last_name)
                        WHEN m.recipient_type = 'client' THEN CONCAT(rc.first_name, ' ', rc.last_name)
                    END AS recipient_name,

                    -- Client info
                    CONCAT(c.first_name, ' ', c.last_name) AS client_name,

                    -- Thread reply count
                    (SELECT COUNT(*) FROM messages WHERE thread_id = m.thread_id AND id != m.id) AS reply_count,

                    -- Last reply timestamp
                    (SELECT MAX(created_at) FROM messages WHERE thread_id = m.thread_id) AS last_reply_at

                FROM messages m
                LEFT JOIN users ru ON ru.id = m.recipient_user_id
                LEFT JOIN clients rc ON rc.id = m.recipient_client_id
                LEFT JOIN clients c ON c.id = m.related_client_id
                WHERE m.sender_type = 'staff'
                  AND m.sender_user_id = ?
                  AND m.deleted_at IS NULL
                  AND m.status != 'draft'
                  AND (m.thread_id IS NULL OR m.thread_id = m.id)"; // Only show thread roots

        $params[] = $userId;

    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid view parameter']);
        exit;
    }

    // Filter by client if specified
    if ($filterClientId) {
        $sql .= " AND m.related_client_id = ?";
        $params[] = $filterClientId;
    }

    // RBAC: Restrict to authorized clients only (unless admin)
    if (!$isAdmin) {
        $sql .= " AND (
            m.related_client_id IN (
                SELECT id FROM clients
                WHERE primary_provider_id = ?
                   OR id IN (SELECT client_id FROM client_providers WHERE provider_id = ?)
            )
        )";
        $params[] = $userId;
        $params[] = $userId;
    }

    $sql .= " ORDER BY last_reply_at DESC, m.created_at DESC LIMIT ?";
    $params[] = $limit;

    $messages = $db->queryAll($sql, $params) ?: [];

    // Get unread count
    $unreadSql = "SELECT COUNT(*) as count
                  FROM messages
                  WHERE recipient_type = 'staff'
                    AND recipient_user_id = ?
                    AND is_read = 0
                    AND deleted_at IS NULL
                    AND status = 'sent'";

    $unreadParams = [$userId];

    if (!$isAdmin) {
        $unreadSql .= " AND related_client_id IN (
            SELECT id FROM clients
            WHERE primary_provider_id = ?
               OR id IN (SELECT client_id FROM client_providers WHERE provider_id = ?)
        )";
        $unreadParams[] = $userId;
        $unreadParams[] = $userId;
    }

    $unreadCount = $db->query($unreadSql, $unreadParams);

    // Format response
    $formatted = array_map(function ($msg) use ($view) {
        return [
            'id' => $msg['id'],
            'uuid' => $msg['uuid'],
            'subject' => $msg['subject'],
            'preview' => mb_substr(strip_tags($msg['body']), 0, 150),
            'senderName' => $msg['sender_name'] ?? null,
            'recipientName' => $msg['recipient_name'] ?? null,
            'clientName' => $msg['client_name'],
            'isRead' => (bool) $msg['is_read'],
            'readAt' => $msg['read_at'],
            'priority' => $msg['priority'],
            'requiresResponse' => (bool) $msg['requires_response'],
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
    error_log("Staff inbox error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
