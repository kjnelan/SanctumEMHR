<?php
/**
 * Update calendar settings in Mindline system_settings (MIGRATED TO MINDLINE)
 * Session-based authentication
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Update calendar settings: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $userId = $session->getUserId();
    error_log("Update calendar settings: User authenticated - $userId");

    // Note: Admin permission is checked on the frontend (NavBar.jsx)
    // Only users with admin/emergency_login permissions can access Settings menu
    // Additional server-side ACL checks can be added here if needed

    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        throw new Exception('Invalid JSON input');
    }

    error_log("Updating calendar settings: " . json_encode($data));

    // Initialize database
    $db = Database::getInstance();

    // Map frontend field names to database setting keys
    $settingsMap = [
        'startHour' => 'schedule_start',
        'endHour' => 'schedule_end',
        'interval' => 'calendar_interval',
        'viewType' => 'calendar_view_type',
        'eventColor' => 'event_color',
        'apptStyle' => 'calendar_appt_style',
        'providersSeeAll' => 'docs_see_entire_calendar'
    ];

    // Update each setting in the system_settings table
    foreach ($settingsMap as $frontendKey => $settingKey) {
        if (isset($data[$frontendKey])) {
            $value = $data[$frontendKey];

            // Convert boolean to integer for database
            if (is_bool($value)) {
                $value = $value ? '1' : '0';
            }

            // Check if setting exists
            $checkSql = "SELECT setting_key FROM system_settings WHERE setting_key = ?";
            $exists = $db->query($checkSql, [$settingKey]);

            if ($exists) {
                // Update existing setting
                $updateSql = "UPDATE system_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?";
                $db->execute($updateSql, [$value, $settingKey]);
                error_log("Updated $settingKey to $value");
            } else {
                // Insert new setting
                $insertSql = "INSERT INTO system_settings (setting_key, setting_value, created_at, updated_at) VALUES (?, ?, NOW(), NOW())";
                $db->execute($insertSql, [$settingKey, $value]);
                error_log("Inserted $settingKey with value $value");
            }
        }
    }

    // Return success
    echo json_encode([
        'success' => true,
        'message' => 'Calendar settings updated successfully'
    ]);

} catch (Exception $e) {
    error_log("Calendar settings update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to update calendar settings: ' . $e->getMessage()
    ]);
}
