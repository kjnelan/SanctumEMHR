<?php
/**
 * Get calendar settings from Mindline system_settings (MIGRATED TO MINDLINE)
 * Session-based authentication
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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
        error_log("Calendar settings: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    error_log("Calendar settings: User authenticated - " . $session->getUserId());

    // Initialize database
    $db = Database::getInstance();

    // Fetch calendar settings from system_settings table
    $settingKeys = [
        'schedule_start',
        'schedule_end',
        'calendar_interval',
        'calendar_view_type',
        'event_color',
        'calendar_appt_style',
        'docs_see_entire_calendar'
    ];

    $placeholders = implode(',', array_fill(0, count($settingKeys), '?'));
    $sql = "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ($placeholders)";
    $rows = $db->queryAll($sql, $settingKeys);

    // Build settings array with defaults
    $settings = [
        'schedule_start' => 8,
        'schedule_end' => 17,
        'calendar_interval' => 15,
        'calendar_view_type' => 'week',
        'event_color' => '1',
        'calendar_appt_style' => '2',
        'docs_see_entire_calendar' => true
    ];

    // Override with database values
    foreach ($rows as $row) {
        $key = $row['setting_key'];
        $value = $row['setting_value'];

        // Convert to appropriate type
        if (in_array($key, ['schedule_start', 'schedule_end', 'calendar_interval'])) {
            $settings[$key] = intval($value);
        } elseif ($key === 'docs_see_entire_calendar') {
            $settings[$key] = boolval($value);
        } else {
            $settings[$key] = $value;
        }
    }

    // Return settings in expected format
    echo json_encode([
        'success' => true,
        'settings' => [
            'startHour' => $settings['schedule_start'],
            'endHour' => $settings['schedule_end'],
            'interval' => $settings['calendar_interval'],
            'viewType' => $settings['calendar_view_type'],
            'eventColor' => $settings['event_color'],
            'apptStyle' => $settings['calendar_appt_style'],
            'providersSeeAll' => $settings['docs_see_entire_calendar']
        ]
    ]);

} catch (Exception $e) {
    error_log("Calendar settings fetch error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch calendar settings'
    ]);
}
