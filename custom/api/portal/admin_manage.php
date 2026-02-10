<?php
/**
 * SanctumEMHR - Portal Admin Management API
 *
 * Staff-only endpoint for managing client portal access:
 * POST   - Enable portal access and set initial credentials for a client
 * PUT    - Reset a client's portal password
 * DELETE - Revoke portal access for a client
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
header('Access-Control-Allow-Methods: POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $session = SessionManager::getInstance();
    $session->start();

    // Staff authentication required
    if (!$session->isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    // Must be admin or provider
    $userType = $_SESSION['user_type'] ?? '';
    $isAdmin = $_SESSION['is_admin'] ?? false;
    $isProvider = $_SESSION['is_provider'] ?? false;
    if (!$isAdmin && !$isProvider) {
        http_response_code(403);
        echo json_encode(['error' => 'Insufficient permissions']);
        exit;
    }

    $db = Database::getInstance();
    $input = json_decode(file_get_contents('php://input'), true);
    $clientId = $input['client_id'] ?? $_GET['client_id'] ?? null;

    if (!$clientId) {
        http_response_code(400);
        echo json_encode(['error' => 'client_id is required']);
        exit;
    }

    // Verify client exists
    $client = $db->query("SELECT id, first_name, last_name, email, portal_username, portal_access FROM clients WHERE id = ?", [$clientId]);
    if (!$client) {
        http_response_code(404);
        echo json_encode(['error' => 'Client not found']);
        exit;
    }

    $method = $_SERVER['REQUEST_METHOD'];

    // POST - Enable portal access with initial credentials
    if ($method === 'POST') {
        $portalUsername = trim($input['portal_username'] ?? '');
        $temporaryPassword = $input['temporary_password'] ?? '';

        if (empty($portalUsername)) {
            http_response_code(400);
            echo json_encode(['error' => 'Portal username is required']);
            exit;
        }

        if (empty($temporaryPassword)) {
            http_response_code(400);
            echo json_encode(['error' => 'Temporary password is required']);
            exit;
        }

        if (strlen($temporaryPassword) < 8) {
            http_response_code(400);
            echo json_encode(['error' => 'Password must be at least 8 characters']);
            exit;
        }

        // Check username uniqueness
        $existing = $db->query(
            "SELECT id FROM clients WHERE portal_username = ? AND id != ?",
            [$portalUsername, $clientId]
        );
        if ($existing) {
            http_response_code(409);
            echo json_encode(['error' => 'This portal username is already in use']);
            exit;
        }

        $hash = password_hash($temporaryPassword, PASSWORD_BCRYPT);

        $db->execute(
            "UPDATE clients SET
                portal_access = 1,
                portal_username = ?,
                portal_password_hash = ?,
                portal_force_password_change = 1
             WHERE id = ?",
            [$portalUsername, $hash, $clientId]
        );

        // Audit
        $staffId = $_SESSION['user_id'];
        $db->execute(
            "INSERT INTO audit_log (user_id, event_type, table_name, record_id, details, created_at)
             VALUES (?, 'portal_access_enabled', 'clients', ?, ?, NOW())",
            [$staffId, $clientId, "Portal access enabled by user $staffId, username: $portalUsername"]
        );

        echo json_encode([
            'success' => true,
            'message' => 'Portal access enabled',
            'portal_username' => $portalUsername
        ]);
        exit;
    }

    // PUT - Reset portal password
    if ($method === 'PUT') {
        $newPassword = $input['temporary_password'] ?? '';

        if (empty($newPassword) || strlen($newPassword) < 8) {
            http_response_code(400);
            echo json_encode(['error' => 'Password must be at least 8 characters']);
            exit;
        }

        if (!$client['portal_access']) {
            http_response_code(400);
            echo json_encode(['error' => 'Portal access is not enabled for this client']);
            exit;
        }

        $hash = password_hash($newPassword, PASSWORD_BCRYPT);

        $db->execute(
            "UPDATE clients SET
                portal_password_hash = ?,
                portal_force_password_change = 1
             WHERE id = ?",
            [$hash, $clientId]
        );

        // Audit
        $staffId = $_SESSION['user_id'];
        $db->execute(
            "INSERT INTO audit_log (user_id, event_type, table_name, record_id, details, created_at)
             VALUES (?, 'portal_password_reset', 'clients', ?, ?, NOW())",
            [$staffId, $clientId, "Portal password reset by user $staffId"]
        );

        echo json_encode(['success' => true, 'message' => 'Portal password has been reset']);
        exit;
    }

    // DELETE - Revoke portal access
    if ($method === 'DELETE') {
        $db->execute(
            "UPDATE clients SET
                portal_access = 0,
                portal_password_hash = NULL,
                portal_force_password_change = 1
             WHERE id = ?",
            [$clientId]
        );

        // Audit
        $staffId = $_SESSION['user_id'];
        $db->execute(
            "INSERT INTO audit_log (user_id, event_type, table_name, record_id, details, created_at)
             VALUES (?, 'portal_access_revoked', 'clients', ?, ?, NOW())",
            [$staffId, $clientId, "Portal access revoked by user $staffId"]
        );

        echo json_encode(['success' => true, 'message' => 'Portal access has been revoked']);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);

} catch (\Exception $e) {
    error_log("Portal admin error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
