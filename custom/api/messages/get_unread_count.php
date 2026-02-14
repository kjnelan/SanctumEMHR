<?php
/**
 * SanctumEMHR - Get Unread Message Count API
 *
 * GET - Returns count of unread messages for authenticated user/client
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

    $db = Database::getInstance();

    if ($isStaff) {
        // Get user role for RBAC
        $userSql = "SELECT user_type FROM users WHERE id = ?";
        $user = $db->query($userSql, [$userId]);
        $isAdmin = $user && $user['user_type'] === 'admin';

        $sql = "SELECT COUNT(*) as count
                FROM messages
                WHERE recipient_type = 'staff'
                  AND recipient_user_id = ?
                  AND is_read = 0
                  AND deleted_at IS NULL
                  AND status = 'sent'";

        $params = [$userId];

        if (!$isAdmin) {
            $sql .= " AND related_client_id IN (
                SELECT id FROM clients
                WHERE primary_provider_id = ?
                   OR id IN (SELECT client_id FROM client_providers WHERE provider_id = ?)
            )";
            $params[] = $userId;
            $params[] = $userId;
        }

        $result = $db->query($sql, $params);
    } else {
        // Client
        $sql = "SELECT COUNT(*) as count
                FROM messages
                WHERE recipient_type = 'client'
                  AND recipient_client_id = ?
                  AND is_read = 0
                  AND deleted_at IS NULL
                  AND status = 'sent'";

        $result = $db->query($sql, [$clientId]);
    }

    echo json_encode([
        'success' => true,
        'unreadCount' => (int) ($result['count'] ?? 0)
    ]);

} catch (\Exception $e) {
    error_log("Get unread count error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
