<?php
/**
 * SanctumEMHR - Client Portal Send Message API
 *
 * POST - Send a message from client to staff (provider)
 * Body params:
 * - thread_id: (optional) If replying to existing thread
 * - recipient_id: (required if new thread) Staff user ID
 * - subject: (required if new thread) Message subject
 * - body: (required) Message body
 * - priority: (optional) normal, high, urgent (default: normal)
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

    $clientId = $_SESSION['portal_client_id'] ?? null;
    if (!$clientId || ($_SESSION['session_type'] ?? '') !== 'portal') {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }
    $db = Database::getInstance();

    // Get client info
    $client = $db->query("SELECT id, first_name, last_name, primary_provider_id FROM clients WHERE id = ?", [$clientId]);
    if (!$client) {
        http_response_code(403);
        echo json_encode(['error' => 'Client not found']);
        exit;
    }

    // Parse request body
    $input = json_decode(file_get_contents('php://input'), true);

    $threadId = $input['thread_id'] ?? null;
    $recipientId = $input['recipient_id'] ?? $client['primary_provider_id'];
    $subject = $input['subject'] ?? null;
    $body = $input['body'] ?? null;
    $priority = $input['priority'] ?? 'normal';

    // Validation
    if (!$body || trim($body) === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Message body is required']);
        exit;
    }

    if (!$threadId && (!$subject || trim($subject) === '')) {
        http_response_code(400);
        echo json_encode(['error' => 'Subject is required for new messages']);
        exit;
    }

    if (!$recipientId) {
        http_response_code(400);
        echo json_encode(['error' => 'Recipient is required']);
        exit;
    }

    // Verify recipient exists and is staff
    $recipient = $db->query("SELECT id, first_name, last_name FROM users WHERE id = ?", [$recipientId]);
    if (!$recipient) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid recipient']);
        exit;
    }

    // If replying to thread, verify thread exists and client has access
    if ($threadId) {
        $threadRoot = $db->query(
            "SELECT subject FROM messages
             WHERE id = ?
               AND deleted_at IS NULL
               AND (
                   (sender_type = 'client' AND sender_client_id = ?)
                   OR (recipient_type = 'client' AND recipient_client_id = ?)
               )",
            [$threadId, $clientId, $clientId]
        );

        if (!$threadRoot) {
            http_response_code(404);
            echo json_encode(['error' => 'Thread not found or access denied']);
            exit;
        }

        // Use thread subject if replying
        $subject = $threadRoot['subject'];
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
        sender_client_id,
        recipient_type,
        recipient_user_id,
        related_client_id,
        subject,
        body,
        priority,
        thread_id,
        status,
        created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";

    $messageId = $db->insert($insertSql, [
        $uuid,
        'client',
        $clientId,
        'staff',
        $recipientId,
        $clientId,
        $subject,
        $body,
        $priority,
        $threadId,
        'sent'
    ]);

    // If this is a new thread (no thread_id), set this message as the thread root
    if (!$threadId) {
        $db->execute("UPDATE messages SET thread_id = id WHERE id = ?", [$messageId]);
        $threadId = $messageId;
    }

    // Note: Audit logging skipped for portal (client) messages - already tracked in messages table

    echo json_encode([
        'success' => true,
        'messageId' => $messageId,
        'threadId' => $threadId,
        'uuid' => $uuid
    ]);

} catch (\Exception $e) {
    error_log("Portal send message error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send message']);
}
