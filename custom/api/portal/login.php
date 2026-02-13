<?php
/**
 * SanctumEMHR - Client Portal Login API
 *
 * Authenticates clients using portal_username and portal_password_hash
 * from the clients table. Completely separate from staff login.
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

$input = json_decode(file_get_contents('php://input'), true);
$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Username and password are required']);
    exit;
}

try {
    $db = Database::getInstance();
    $session = SessionManager::getInstance();
    $session->start();

    // Look up client by portal_username
    $sql = "SELECT id, first_name, last_name, preferred_name, email,
                   portal_username, portal_password_hash, portal_access,
                   portal_force_password_change, status, date_of_birth,
                   primary_provider_id
            FROM clients
            WHERE portal_username = ?
            LIMIT 1";
    $client = $db->query($sql, [$username]);

    if (!$client) {
        error_log("Portal login failed: unknown username '$username'");
        http_response_code(401);
        echo json_encode(['error' => 'Invalid username or password']);
        exit;
    }

    // Check portal access is enabled
    if (!$client['portal_access']) {
        error_log("Portal login denied: portal_access disabled for client {$client['id']}");
        http_response_code(403);
        echo json_encode([
            'error' => 'Portal access disabled',
            'message' => 'Your portal access has not been enabled. Please contact your provider.'
        ]);
        exit;
    }

    // Check client status
    if ($client['status'] === 'deceased' || $client['status'] === 'discharged') {
        error_log("Portal login denied: client {$client['id']} status is {$client['status']}");
        http_response_code(403);
        echo json_encode([
            'error' => 'Account inactive',
            'message' => 'Your account is no longer active. Please contact your provider.'
        ]);
        exit;
    }

    // Check password hash exists
    if (empty($client['portal_password_hash'])) {
        error_log("Portal login denied: no password set for client {$client['id']}");
        http_response_code(401);
        echo json_encode([
            'error' => 'Account not activated',
            'message' => 'Your portal account has not been activated yet. Please contact your provider.'
        ]);
        exit;
    }

    // Verify password
    if (!password_verify($password, $client['portal_password_hash'])) {
        error_log("Portal login failed: wrong password for client {$client['id']}");
        http_response_code(401);
        echo json_encode(['error' => 'Invalid username or password']);
        exit;
    }

    // Login successful - regenerate session
    $session->regenerate();

    // Set portal session variables (distinct from staff sessions)
    $_SESSION['portal_client_id'] = $client['id'];
    $_SESSION['portal_username'] = $client['portal_username'];
    $_SESSION['portal_client_name'] = trim(($client['preferred_name'] ?: $client['first_name']) . ' ' . $client['last_name']);
    $_SESSION['session_type'] = 'portal';
    $_SESSION['login_time'] = time();
    $_SESSION['portal_force_password_change'] = (bool) $client['portal_force_password_change'];

    // Clear any staff session vars to prevent confusion
    unset($_SESSION['user_id'], $_SESSION['username'], $_SESSION['user_type'],
          $_SESSION['is_admin'], $_SESSION['is_provider'], $_SESSION['user']);

    // Update last login and session type in sessions table
    $db->execute(
        "UPDATE clients SET portal_last_login = NOW() WHERE id = ?",
        [$client['id']]
    );

    // Update session record with portal info
    $db->execute(
        "UPDATE sessions SET session_type = 'portal', client_id = ? WHERE id = ?",
        [$client['id'], session_id()]
    );

    error_log("Portal login successful for client {$client['id']} ({$client['portal_username']})");

    // Get provider name if assigned
    $providerName = null;
    if ($client['primary_provider_id']) {
        $provider = $db->query(
            "SELECT CONCAT(first_name, ' ', last_name) AS name FROM users WHERE id = ?",
            [$client['primary_provider_id']]
        );
        $providerName = $provider['name'] ?? null;
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'client' => [
            'id' => $client['id'],
            'firstName' => $client['preferred_name'] ?: $client['first_name'],
            'lastName' => $client['last_name'],
            'fullName' => trim(($client['preferred_name'] ?: $client['first_name']) . ' ' . $client['last_name']),
            'email' => $client['email'],
            'providerName' => $providerName,
            'forcePasswordChange' => (bool) $client['portal_force_password_change']
        ]
    ]);

} catch (\Exception $e) {
    error_log("Portal login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'An error occurred during login. Please try again.']);
}
