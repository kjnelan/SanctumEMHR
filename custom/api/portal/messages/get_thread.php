<?php
/**
 * SanctumEMHR - Client Portal Get Message Thread API
 *
 * GET - Returns all messages in a thread for the authenticated client
 * Query params:
 * - thread_id: The root message ID of the thread
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
    $threadId = $_GET['thread_id'] ?? null;

    if (!$threadId) {
        http_response_code(400);
        echo json_encode(['error' => 'thread_id is required']);
        exit;
    }

    $db = Database::getInstance();

    // Get all messages in the thread
    // Ensure client is authorized (either sender or recipient)
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
                m.priority,
                m.created_at,

                -- Sender name
                CASE
                    WHEN m.sender_type = 'staff' THEN CONCAT(u.first_name, ' ', u.last_name)
                    WHEN m.sender_type = 'client' THEN CONCAT(c.first_name, ' ', c.last_name)
                END AS sender_name

            FROM messages m
            LEFT JOIN users u ON u.id = m.sender_user_id
            LEFT JOIN clients c ON c.id = m.sender_client_id
            WHERE (m.id = ? OR m.thread_id = ?)
              AND m.deleted_at IS NULL
              AND (
                  (m.sender_type = 'client' AND m.sender_client_id = ?)
                  OR (m.recipient_type = 'client' AND m.recipient_client_id = ?)
              )
            ORDER BY m.created_at ASC";

    $messages = $db->queryAll($sql, [$threadId, $threadId, $clientId, $clientId]) ?: [];

    if (empty($messages)) {
        http_response_code(404);
        echo json_encode(['error' => 'Thread not found or access denied']);
        exit;
    }

    // Format response
    $formatted = array_map(function ($msg) {
        return [
            'id' => $msg['id'],
            'uuid' => $msg['uuid'],
            'subject' => $msg['subject'],
            'body' => $msg['body'],
            'senderType' => $msg['sender_type'],
            'senderName' => $msg['sender_name'],
            'isRead' => (bool) $msg['is_read'],
            'priority' => $msg['priority'],
            'createdAt' => $msg['created_at']
        ];
    }, $messages);

    echo json_encode([
        'success' => true,
        'messages' => $formatted,
        'count' => count($formatted)
    ]);

} catch (\Exception $e) {
    error_log("Portal get thread error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
