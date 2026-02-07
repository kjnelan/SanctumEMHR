<?php
/**
 * SanctumEMHR EMHR
 * Get Clinical Settings API - Session-based authentication (MIGRATED TO SanctumEMHR)
 * Returns clinical documentation system settings
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

require_once(__DIR__ . '/../../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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

    if (!$session->isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $db = Database::getInstance();

    $sql = "SELECT
        s.setting_key,
        s.setting_value,
        s.setting_type,
        s.updated_at,
        CONCAT(u.fname, ' ', u.lname) AS updated_by_name
    FROM clinical_settings s
    LEFT JOIN users u ON u.id = s.updated_by
    ORDER BY s.setting_key";

    $rows = $db->queryAll($sql);
    $settings = [];
    $settingsMap = [];

    foreach ($rows as $row) {
        $key = $row['setting_key'];
        $value = $row['setting_value'];
        $type = $row['setting_type'];

        if ($type === 'boolean') {
            $value = $value === 'true' || $value === '1';
        } elseif ($type === 'json') {
            $value = json_decode($value, true);
        } elseif ($type === 'number' || $type === 'integer') {
            $value = intval($value);
        }

        $settingsMap[$key] = $value;
        $settings[] = [
            'key' => $key,
            'value' => $value,
            'type' => $type,
            'updated_at' => $row['updated_at'],
            'updated_by' => $row['updated_by_name']
        ];
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'settings' => $settingsMap,
        'settings_detailed' => $settings,
        'total_count' => count($settings)
    ]);

} catch (Exception $e) {
    error_log("Error fetching clinical settings: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch clinical settings',
        'message' => $e->getMessage()
    ]);
}
