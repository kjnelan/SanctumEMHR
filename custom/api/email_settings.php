<?php
/**
 * SanctumEMHR EMHR
 * Email Settings API - Manage email configuration
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;
use Custom\Lib\Services\EmailService;

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    // Check if user is admin
    $db = Database::getInstance();
    $userId = $session->getUserId();

    $userResult = $db->query("SELECT user_type FROM users WHERE id = ?", [$userId]);
    if (!$userResult || $userResult['user_type'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        // Get current email settings
        $emailService = new EmailService($db);
        $settings = $emailService->getSettings();

        // Don't expose the password
        $settings['smtp_password_set'] = false;
        $passwordResult = $db->query(
            "SELECT setting_value FROM system_settings WHERE setting_key = 'email.smtp_password'"
        );
        if ($passwordResult && !empty($passwordResult['setting_value'])) {
            $settings['smtp_password_set'] = true;
        }

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'settings' => $settings
        ]);

    } elseif ($method === 'POST') {
        // Update email settings
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            throw new Exception('Invalid JSON input');
        }

        // Settings that can be updated
        $allowedSettings = [
            'enabled' => 'boolean',
            'from_email' => 'string',
            'from_name' => 'string',
            'smtp_host' => 'string',
            'smtp_port' => 'string',
            'smtp_user' => 'string',
            'smtp_password' => 'string',
            'smtp_encryption' => 'string',
            'notify_client_on_appointment' => 'boolean',
            'notify_provider_on_appointment' => 'boolean'
        ];

        $updated = [];

        foreach ($allowedSettings as $key => $type) {
            if (isset($input[$key])) {
                $value = $input[$key];

                // Convert value based on type
                if ($type === 'boolean') {
                    $value = $value ? '1' : '0';
                } else {
                    $value = trim((string)$value);
                }

                // Skip password if empty (don't clear existing password)
                if ($key === 'smtp_password' && empty($value)) {
                    continue;
                }

                $settingKey = 'email.' . $key;

                // Check if setting exists
                $existing = $db->query(
                    "SELECT id FROM system_settings WHERE setting_key = ?",
                    [$settingKey]
                );

                if ($existing) {
                    // Update existing setting
                    $db->execute(
                        "UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?",
                        [$value, $settingKey]
                    );
                } else {
                    // Insert new setting
                    $db->insert(
                        "INSERT INTO system_settings (setting_key, setting_value, category, setting_type, description, is_editable, created_at, updated_at)
                         VALUES (?, ?, 'email', ?, ?, 1, NOW(), NOW())",
                        [
                            $settingKey,
                            $value,
                            $type,
                            "Email setting: $key"
                        ]
                    );
                }

                $updated[] = $key;
            }
        }

        // Return updated settings (refresh from service)
        $emailService = new EmailService($db);
        $settings = $emailService->getSettings();

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Email settings updated',
            'updated' => $updated,
            'settings' => $settings
        ]);

    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    error_log("Email settings API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to process request',
        'message' => $e->getMessage()
    ]);
}
