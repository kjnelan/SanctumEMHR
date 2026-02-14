<?php
/**
 * SanctumEMHR - Send Message API
 *
 * POST - Send a new message or reply to thread
 * Body params:
 * - subject: Message subject (required for new threads)
 * - body: Message body (required)
 * - recipient_type: 'staff' or 'client' (required)
 * - recipient_id: User ID or Client ID (required)
 * - thread_id: Thread ID for replies (optional)
 * - priority: 'normal', 'high', 'urgent' (optional, default: normal)
 * - requires_response: boolean (optional)
 *
 * RBAC: Staff can only message clients they are authorized to access
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
    $isStaff = false;
    $senderType = null;

    if ($session->isAuthenticated() && ($_SESSION['session_type'] ?? 'staff') === 'staff') {
        $userId = $session->getUserId();
        $isStaff = true;
        $senderType = 'staff';
    } elseif (isset($_SESSION['portal_client_id']) && ($_SESSION['session_type'] ?? '') === 'portal') {
        $clientId = $_SESSION['portal_client_id'];
        $senderType = 'client';
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    $subject = trim($input['subject'] ?? '');
    $body = trim($input['body'] ?? '');
    $recipientType = $input['recipient_type'] ?? null;
    $recipientId = $input['recipient_id'] ?? null;
    $threadId = $input['thread_id'] ?? null;
    $priority = $input['priority'] ?? 'normal';
    $requiresResponse = $input['requires_response'] ?? false;

    // Validation
    if (empty($body)) {
        http_response_code(400);
        echo json_encode(['error' => 'Message body required']);
        exit;
    }

    if (!$threadId && empty($subject)) {
        http_response_code(400);
        echo json_encode(['error' => 'Subject required for new messages']);
        exit;
    }

    if (!in_array($recipientType, ['staff', 'client'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid recipient_type']);
        exit;
    }

    if (!$recipientId) {
        http_response_code(400);
        echo json_encode(['error' => 'recipient_id required']);
        exit;
    }

    if (!in_array($priority, ['normal', 'high', 'urgent'])) {
        $priority = 'normal';
    }

    $db = Database::getInstance();

    // If replying to thread, get thread info
    $relatedClientId = null;
    $parentMessageId = null;

    if ($threadId) {
        $threadSql = "SELECT id, related_client_id, sender_type, sender_user_id, sender_client_id
                      FROM messages
                      WHERE id = ? AND deleted_at IS NULL";
        $thread = $db->query($threadSql, [$threadId]);

        if (!$thread) {
            http_response_code(404);
            echo json_encode(['error' => 'Thread not found']);
            exit;
        }

        $relatedClientId = $thread['related_client_id'];
        $parentMessageId = $threadId;

        // For replies, use the original thread's subject
        $subject = null;
    } else {
        // New thread - determine related_client_id
        if ($senderType === 'client') {
            $relatedClientId = $clientId;
        } elseif ($recipientType === 'client') {
            $relatedClientId = $recipientId;
        } else {
            // Staff to staff - no client context
            $relatedClientId = null;
        }
    }

    // RBAC check for staff
    if ($isStaff && $relatedClientId) {
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
                echo json_encode(['error' => 'Access denied to message this client']);
                exit;
            }
        }
    }

    // Generate UUID
    $uuid = sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );

    // Insert message
    $insertSql = "INSERT INTO messages (
        uuid,
        sender_type,
        sender_user_id,
        sender_client_id,
        recipient_type,
        recipient_user_id,
        recipient_client_id,
        subject,
        body,
        thread_id,
        parent_message_id,
        status,
        priority,
        requires_response,
        related_client_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?, ?, ?)";

    $db->execute($insertSql, [
        $uuid,
        $senderType,
        $senderType === 'staff' ? $userId : null,
        $senderType === 'client' ? $clientId : null,
        $recipientType,
        $recipientType === 'staff' ? $recipientId : null,
        $recipientType === 'client' ? $recipientId : null,
        $subject,
        $body,
        $threadId,
        $parentMessageId,
        $priority,
        $requiresResponse ? 1 : 0,
        $relatedClientId
    ]);

    $messageId = $db->lastInsertId();

    // If new thread, set thread_id to self
    if (!$threadId) {
        $updateSql = "UPDATE messages SET thread_id = ? WHERE id = ?";
        $db->execute($updateSql, [$messageId, $messageId]);
        $threadId = $messageId;
    }

    // Audit log
    $logger = AuditLogger::getInstance();
    $logger->log(
        $threadId ? 'message_reply_sent' : 'message_sent',
        'message',
        $messageId,
        sprintf(
            "%s sent message to %s: %s",
            $isStaff ? "Staff user $userId" : "Client $clientId",
            $recipientType === 'staff' ? "staff user $recipientId" : "client $recipientId",
            mb_substr($body, 0, 100)
        ),
        $userId ?? null
    );

    echo json_encode([
        'success' => true,
        'messageId' => $messageId,
        'threadId' => $threadId,
        'uuid' => $uuid
    ]);

} catch (\Exception $e) {
    error_log("Send message error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
