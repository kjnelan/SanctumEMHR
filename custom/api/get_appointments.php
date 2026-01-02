<?php
/**
 * Get Appointments API - Session-based
 * Fetches appointments for calendar view with optional filters
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
error_log("Get appointments API called - Session ID: " . session_id());

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

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_log("Get appointments: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Get appointments: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

error_log("Get appointments: User authenticated - " . $_SESSION['authUserID']);

try {
    // Get query parameters
    $start_date = $_GET['start_date'] ?? null;
    $end_date = $_GET['end_date'] ?? null;
    $provider_id = $_GET['provider_id'] ?? null;

    // Default to current week if no dates provided
    if (!$start_date) {
        $start_date = date('Y-m-d', strtotime('monday this week'));
    }
    if (!$end_date) {
        $end_date = date('Y-m-d', strtotime('sunday this week'));
    }

    error_log("Fetching appointments from $start_date to $end_date" . ($provider_id ? " for provider $provider_id" : ""));

    // Build SQL query
    $sql = "SELECT
        e.pc_eid,
        e.pc_eventDate,
        e.pc_startTime,
        e.pc_endTime,
        e.pc_duration,
        e.pc_catid,
        e.pc_apptstatus,
        e.pc_title,
        e.pc_hometext,
        e.pc_pid,
        e.pc_aid,
        e.pc_room,
        c.pc_catname,
        c.pc_catcolor,
        c.pc_cattype,
        pd.fname AS patient_fname,
        pd.lname AS patient_lname,
        pd.DOB AS patient_dob,
        CONCAT(u.fname, ' ', u.lname) AS provider_name,
        u.id AS provider_id,
        f.name AS facility_name
    FROM openemr_postcalendar_events e
    LEFT JOIN openemr_postcalendar_categories c ON e.pc_catid = c.pc_catid
    LEFT JOIN patient_data pd ON e.pc_pid = pd.pid
    LEFT JOIN users u ON e.pc_aid = u.id
    LEFT JOIN facility f ON e.pc_facility = f.id
    WHERE e.pc_eventDate >= ? AND e.pc_eventDate <= ?";

    $params = [$start_date, $end_date];

    // Add provider filter if specified
    if ($provider_id && $provider_id !== 'all') {
        $sql .= " AND e.pc_aid = ?";
        $params[] = $provider_id;
    }

    $sql .= " ORDER BY e.pc_eventDate, e.pc_startTime";

    error_log("Appointments SQL: " . $sql);

    $result = sqlStatement($sql, $params);

    $appointments = [];
    while ($row = sqlFetchArray($result)) {
        $appointments[] = [
            'id' => $row['pc_eid'],
            'eventDate' => $row['pc_eventDate'],
            'startTime' => $row['pc_startTime'],
            'endTime' => $row['pc_endTime'],
            'duration' => intval($row['pc_duration'] / 60), // Convert seconds to minutes
            'categoryId' => $row['pc_catid'],
            'categoryName' => $row['pc_catname'],
            'categoryColor' => $row['pc_catcolor'],
            'categoryType' => intval($row['pc_cattype']), // 0=appointment, 1=availability block
            'apptstatus' => $row['pc_apptstatus'],
            'status' => $row['pc_apptstatus'],
            'title' => $row['pc_title'],
            'comments' => $row['pc_hometext'],
            'patientId' => $row['pc_pid'],
            'patientName' => trim(($row['patient_fname'] ?? '') . ' ' . ($row['patient_lname'] ?? '')),
            'patientDOB' => $row['patient_dob'],
            'providerId' => $row['provider_id'],
            'providerName' => $row['provider_name'],
            'facilityName' => $row['facility_name'],
            'room' => $row['pc_room']
        ];
    }

    error_log("Get appointments: Found " . count($appointments) . " appointments");

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'appointments' => $appointments,
        'start_date' => $start_date,
        'end_date' => $end_date
    ]);

} catch (Exception $e) {
    error_log("Get appointments: Error - " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch appointments', 'message' => $e->getMessage()]);
}
