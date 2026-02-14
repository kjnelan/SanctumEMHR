<?php
/**
 * SanctumEMHR - Get Message Thread API
 *
 * GET - Returns full conversation thread
 * Query params:
 * - thread_id: Thread root message ID (required)
 *
 * RBAC: Staff can only access threads for authorized clients
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

    $userId = null;
    $clientId = null;
    $isStaff = false;

    if ($session->isAuthenticated() && ($_SESSION['session_type'] ?? 'staff') === 'staff') {
        $userId = $session->getUserId();
        $isStaff = true;
    } elseif (isset($_SESSION['portal_client_id']) && ($_SESSION['session_type'] ?? '') === 'portal') {
        $clientId = $_SESSION['portal_client_id'];
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $threadId = $_GET['thread_id'] ?? null;
    if (!$threadId) {
        http_response_code(400);
        echo json_encode(['error' => 'thread_id required']);
        exit;
    }

    $db = Database::getInstance();

    // Verify access to this thread
    $accessSql = "SELECT related_client_id FROM messages WHERE id = ? AND deleted_at IS NULL";
    $thread = $db->query($accessSql, [$threadId]);

    if (!$thread) {
        http_response_code(404);
        echo json_encode(['error' => 'Thread not found']);
        exit;
    }

    $relatedClientId = $thread['related_client_id'];

    // RBAC check for staff
    if ($isStaff && $userId) {
        $userSql = "SELECT user_type FROM users WHERE id = ?";
        $user = $db->query($userSql, [$userId]);
        $isAdmin = $user && $user['user_type'] === 'admin';

        if (!$isAdmin) {
            // Check if staff has access to this client
            $authSql = "SELECT id FROM clients
                        WHERE id = ?
                          AND (primary_provider_id = ?
                               OR id IN (SELECT client_id FROM client_providers WHERE provider_id = ?))";
            $authorized = $db->query($authSql, [$relatedClientId, $userId, $userId]);

            if (!$authorized) {
                http_response_code(403);
                echo json_encode(['error' => 'Access denied to this thread']);
                exit;
            }
        }
    } elseif ($clientId) {
        // Client can only access threads about themselves
        if ($relatedClientId != $clientId) {
            http_response_code(403);
            echo json_encode(['error' => 'Access denied to this thread']);
            exit;
        }
    }

    // Get all messages in thread
    $sql = "SELECT
                m.id,
                m.uuid,
                m.subject,
                m.body,
                m.sender_type,
                m.sender_user_id,
                m.sender_client_id,
                m.recipient_type,
                m.recipient_user_id,
                m.recipient_client_id,
                m.is_read,
                m.read_at,
                m.priority,
                m.requires_response,
                m.created_at,

                -- Sender info
                CASE
                    WHEN m.sender_type = 'staff' THEN CONCAT(su.first_name, ' ', su.last_name)
                    WHEN m.sender_type = 'client' THEN CONCAT(sc.first_name, ' ', sc.last_name)
                END AS sender_name,

                -- Recipient info
                CASE
                    WHEN m.recipient_type = 'staff' THEN CONCAT(ru.first_name, ' ', ru.last_name)
                    WHEN m.recipient_type = 'client' THEN CONCAT(rc.first_name, ' ', rc.last_name)
                END AS recipient_name

            FROM messages m
            LEFT JOIN users su ON su.id = m.sender_user_id
            LEFT JOIN clients sc ON sc.id = m.sender_client_id
            LEFT JOIN users ru ON ru.id = m.recipient_user_id
            LEFT JOIN clients rc ON rc.id = m.recipient_client_id
            WHERE (m.id = ? OR m.thread_id = ?)
              AND m.deleted_at IS NULL
            ORDER BY m.created_at ASC";

    $messages = $db->queryAll($sql, [$threadId, $threadId]) ?: [];

    // Format response
    $formatted = array_map(function ($msg) {
        return [
            'id' => $msg['id'],
            'uuid' => $msg['uuid'],
            'subject' => $msg['subject'],
            'body' => $msg['body'],
            'senderType' => $msg['sender_type'],
            'senderName' => $msg['sender_name'],
            'recipientType' => $msg['recipient_type'],
            'recipientName' => $msg['recipient_name'],
            'isRead' => (bool) $msg['is_read'],
            'readAt' => $msg['read_at'],
            'priority' => $msg['priority'],
            'requiresResponse' => (bool) $msg['requires_response'],
            'createdAt' => $msg['created_at']
        ];
    }, $messages);

    echo json_encode([
        'success' => true,
        'threadId' => (int) $threadId,
        'messages' => $formatted,
        'count' => count($formatted)
    ]);

} catch (\Exception $e) {
    error_log("Get thread error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
