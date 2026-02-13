<?php
/**
 * SanctumEMHR - Client Portal Logout API
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright (c) 2026 Sacred Wandering
 * Proprietary and Confidential
 */

require_once dirname(__FILE__, 3) . "/init.php";

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

try {
    $session = SessionManager::getInstance();
    $session->start();

    $clientId = $_SESSION['portal_client_id'] ?? null;
    if ($clientId) {
        error_log("Portal logout for client {$clientId}");
    }

    $session->logout();

    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);

} catch (\Exception $e) {
    error_log("Portal logout error: " . $e->getMessage());
    echo json_encode(['success' => true]); // Always succeed on logout
}
