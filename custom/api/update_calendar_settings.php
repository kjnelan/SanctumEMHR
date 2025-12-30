<?php
/**
 * Update calendar settings in OpenEMR globals table
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
error_log("Update calendar settings API called - Session ID: " . session_id());

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

// Check if user is authenticated
if (!isset($_SESSION['authUserID'])) {
    error_log("Update calendar settings: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

error_log("Update calendar settings: User authenticated - " . $_SESSION['authUserID']);

// Note: Admin permission is checked on the frontend (NavBar.jsx)
// Only users with admin/emergency_login permissions can access Settings menu
// Additional server-side ACL checks can be added here if needed

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        throw new Exception('Invalid JSON input');
    }

    error_log("Updating calendar settings: " . json_encode($data));

    // Map frontend field names to OpenEMR global names
    $settingsMap = [
        'startHour' => 'schedule_start',
        'endHour' => 'schedule_end',
        'interval' => 'calendar_interval',
        'viewType' => 'calendar_view_type',
        'eventColor' => 'event_color',
        'apptStyle' => 'calendar_appt_style',
        'providersSeeAll' => 'docs_see_entire_calendar'
    ];

    // Update each setting in the globals table
    foreach ($settingsMap as $frontendKey => $globalKey) {
        if (isset($data[$frontendKey])) {
            $value = $data[$frontendKey];

            // Convert boolean to integer for database
            if (is_bool($value)) {
                $value = $value ? '1' : '0';
            }

            // Check if setting exists
            $checkSql = "SELECT gl_name FROM globals WHERE gl_name = ?";
            $exists = sqlQuery($checkSql, [$globalKey]);

            if ($exists) {
                // Update existing setting
                $updateSql = "UPDATE globals SET gl_value = ? WHERE gl_name = ?";
                sqlStatement($updateSql, [$value, $globalKey]);
                error_log("Updated $globalKey to $value");
            } else {
                // Insert new setting
                $insertSql = "INSERT INTO globals (gl_name, gl_index, gl_value) VALUES (?, 0, ?)";
                sqlStatement($insertSql, [$globalKey, $value]);
                error_log("Inserted $globalKey with value $value");
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
