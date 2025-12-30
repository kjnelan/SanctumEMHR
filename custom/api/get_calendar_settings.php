<?php
/**
 * Get calendar settings from OpenEMR globals
 * Session-based authentication
 */

// Start output buffering to prevent any PHP warnings/notices from breaking JSON
ob_start();

// IMPORTANT: Set these BEFORE loading globals.php to prevent redirects
$ignoreAuth = true;
$ignoreAuth_onsite_portal = true;
$ignoreAuth_onsite_portal_two = true;

require_once(__DIR__ . '/../../interface/globals.php');

// Clear any output that globals.php might have generated
ob_end_clean();

// Enable error logging
error_log("Get calendar settings API called - Session ID: " . session_id());

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

// Check if user is authenticated
if (!isset($_SESSION['authUserID'])) {
    error_log("Calendar settings: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

error_log("Calendar settings: User authenticated - " . $_SESSION['authUserID']);

try {
    // Try BOTH naming conventions (see DEBUG_CALENDAR_SETTINGS.md for debug code)
    // OpenEMR uses schedule_start/schedule_end in $GLOBALS
    // But DB fields are calendar_start/calendar_end
    $startHour = isset($GLOBALS['schedule_start']) ? (int)$GLOBALS['schedule_start']
                : (isset($GLOBALS['calendar_start']) ? (int)$GLOBALS['calendar_start'] : 8);

    $endHour = isset($GLOBALS['schedule_end']) ? (int)$GLOBALS['schedule_end']
              : (isset($GLOBALS['calendar_end']) ? (int)$GLOBALS['calendar_end'] : 17);

    $interval = isset($GLOBALS['calendar_interval']) ? (int)$GLOBALS['calendar_interval'] : 15;

    // Get additional calendar settings
    $viewType = isset($GLOBALS['calendar_view_type']) ? $GLOBALS['calendar_view_type'] : 'week';
    $eventColor = isset($GLOBALS['event_color']) ? $GLOBALS['event_color'] : '1';
    $apptStyle = isset($GLOBALS['calendar_appt_style']) ? $GLOBALS['calendar_appt_style'] : '2';
    $providersSeeAll = isset($GLOBALS['docs_see_entire_calendar']) ? (bool)$GLOBALS['docs_see_entire_calendar'] : true;

    // Return settings
    echo json_encode([
        'success' => true,
        'settings' => [
            'startHour' => $startHour,
            'endHour' => $endHour,
            'interval' => $interval,
            'viewType' => $viewType,
            'eventColor' => $eventColor,
            'apptStyle' => $apptStyle,
            'providersSeeAll' => $providersSeeAll
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
