<?php
/**
 * SanctumEMHR - Client Portal Session API
 *
 * Validates portal session and returns client info.
 * Also handles password change for force_password_change flow.
 *
 * GET  - Check session, return client info
 * POST - Change password (when force_password_change is set)
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
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $session = SessionManager::getInstance();
    $session->start();

    // Check for portal session
    $clientId = $_SESSION['portal_client_id'] ?? null;
    if (!$clientId || ($_SESSION['session_type'] ?? '') !== 'portal') {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $db = Database::getInstance();

    // Handle password change
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $newPassword = $input['new_password'] ?? '';
        $confirmPassword = $input['confirm_password'] ?? '';

        if (empty($newPassword) || $newPassword !== $confirmPassword) {
            http_response_code(400);
            echo json_encode(['error' => 'Passwords do not match']);
            exit;
        }

        if (strlen($newPassword) < 8) {
            http_response_code(400);
            echo json_encode(['error' => 'Password must be at least 8 characters']);
            exit;
        }

        // Require complexity: uppercase, lowercase, number, special char
        if (!preg_match('/[a-z]/', $newPassword) || !preg_match('/[A-Z]/', $newPassword) ||
            !preg_match('/[0-9]/', $newPassword) || !preg_match('/[^a-zA-Z0-9]/', $newPassword)) {
            http_response_code(400);
            echo json_encode(['error' => 'Password must include uppercase, lowercase, number, and special character']);
            exit;
        }

        $hash = password_hash($newPassword, PASSWORD_BCRYPT);
        $db->execute(
            "UPDATE clients SET portal_password_hash = ?, portal_force_password_change = 0 WHERE id = ?",
            [$hash, $clientId]
        );

        $_SESSION['portal_force_password_change'] = false;

        echo json_encode(['success' => true, 'message' => 'Password updated successfully']);
        exit;
    }

    // GET - Return session info
    $sql = "SELECT c.id, c.first_name, c.last_name, c.preferred_name, c.email,
                   c.phone_mobile, c.date_of_birth, c.portal_force_password_change,
                   c.primary_provider_id, c.status,
                   CONCAT(u.first_name, ' ', u.last_name) AS provider_name
            FROM clients c
            LEFT JOIN users u ON u.id = c.primary_provider_id
            WHERE c.id = ?
            LIMIT 1";
    $client = $db->query($sql, [$clientId]);

    if (!$client) {
        http_response_code(401);
        echo json_encode(['error' => 'Client not found']);
        exit;
    }

    // Check client still has portal access
    $portalCheck = $db->query(
        "SELECT portal_access, status FROM clients WHERE id = ?",
        [$clientId]
    );
    if (!$portalCheck['portal_access'] || in_array($portalCheck['status'], ['deceased', 'discharged'])) {
        $session->logout();
        http_response_code(403);
        echo json_encode(['error' => 'Portal access has been revoked']);
        exit;
    }

    echo json_encode([
        'id' => $client['id'],
        'firstName' => $client['preferred_name'] ?: $client['first_name'],
        'lastName' => $client['last_name'],
        'fullName' => trim(($client['preferred_name'] ?: $client['first_name']) . ' ' . $client['last_name']),
        'email' => $client['email'],
        'phone' => $client['phone_mobile'],
        'dateOfBirth' => $client['date_of_birth'],
        'providerName' => $client['provider_name'],
        'forcePasswordChange' => (bool) $client['portal_force_password_change']
    ]);

} catch (\Exception $e) {
    error_log("Portal session error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
