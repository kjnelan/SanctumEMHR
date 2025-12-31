<?php
/**
 * Mindline EMHR
 * Create Appointment API - Session-based authentication
 * Creates a new appointment in the calendar system
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
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
error_log("Create appointment API called - Session ID: " . session_id());

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

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("Create appointment: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Create appointment: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

error_log("Create appointment: User authenticated - " . $_SESSION['authUserID']);

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    error_log("Create appointment input: " . print_r($input, true));

    // Validate required fields
    $required = ['patientId', 'providerId', 'categoryId', 'eventDate', 'startTime', 'duration'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || $input[$field] === '') {
            throw new Exception("Missing required field: $field");
        }
    }

    // Extract and validate inputs
    $patientId = intval($input['patientId']);
    $providerId = intval($input['providerId']);
    $categoryId = intval($input['categoryId']);
    $eventDate = $input['eventDate']; // YYYY-MM-DD format
    $startTime = $input['startTime']; // HH:MM:SS format
    $duration = intval($input['duration']); // Duration in minutes

    // Optional fields
    $title = $input['title'] ?? '';
    $comments = $input['comments'] ?? '';
    $apptstatus = $input['apptstatus'] ?? '-'; // Default status
    $room = $input['room'] ?? '';
    $facilityId = isset($input['facilityId']) ? intval($input['facilityId']) : 0;

    // Calculate end time based on start time and duration
    $startDateTime = new DateTime($eventDate . ' ' . $startTime);
    $endDateTime = clone $startDateTime;
    $endDateTime->add(new DateInterval('PT' . $duration . 'M')); // Add duration in minutes
    $endTime = $endDateTime->format('H:i:s');
    $endDate = $endDateTime->format('Y-m-d');

    // Convert duration to seconds for database (OpenEMR stores in seconds)
    $durationSeconds = $duration * 60;

    // Get current user's facility if not specified
    if ($facilityId === 0) {
        $facilityResult = sqlQuery("SELECT facility_id FROM users WHERE id = ?", [$_SESSION['authUserID']]);
        $facilityId = $facilityResult['facility_id'] ?? 0;
    }

    // Build INSERT query
    $sql = "INSERT INTO openemr_postcalendar_events (
        pc_catid,
        pc_aid,
        pc_pid,
        pc_title,
        pc_eventDate,
        pc_endDate,
        pc_startTime,
        pc_endTime,
        pc_duration,
        pc_hometext,
        pc_apptstatus,
        pc_room,
        pc_facility,
        pc_eventstatus,
        pc_sharing,
        pc_topic,
        pc_multiple,
        pc_alldayevent,
        pc_recurrtype,
        pc_sendalertsms,
        pc_sendalertemail
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 0, 0, 0, 'NO', 'NO')";

    $params = [
        $categoryId,
        $providerId,
        $patientId,
        $title,
        $eventDate,
        $endDate,
        $startTime,
        $endTime,
        $durationSeconds,
        $comments,
        $apptstatus,
        $room,
        $facilityId
    ];

    error_log("Create appointment SQL: " . $sql);
    error_log("Create appointment params: " . print_r($params, true));

    // Execute insert
    $result = sqlInsert($sql, $params);

    if ($result === false) {
        throw new Exception('Failed to insert appointment');
    }

    // Get the newly created appointment ID
    $appointmentId = $result;

    error_log("Create appointment: Successfully created appointment ID $appointmentId");

    // Fetch the created appointment to return full details
    $createdAppt = sqlQuery(
        "SELECT
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
            c.pc_catname,
            c.pc_catcolor,
            pd.fname AS patient_fname,
            pd.lname AS patient_lname,
            CONCAT(u.fname, ' ', u.lname) AS provider_name
        FROM openemr_postcalendar_events e
        LEFT JOIN openemr_postcalendar_categories c ON e.pc_catid = c.pc_catid
        LEFT JOIN patient_data pd ON e.pc_pid = pd.pid
        LEFT JOIN users u ON e.pc_aid = u.id
        WHERE e.pc_eid = ?",
        [$appointmentId]
    );

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Appointment created successfully',
        'appointmentId' => $appointmentId,
        'appointment' => [
            'id' => $createdAppt['pc_eid'],
            'eventDate' => $createdAppt['pc_eventDate'],
            'startTime' => $createdAppt['pc_startTime'],
            'endTime' => $createdAppt['pc_endTime'],
            'duration' => $createdAppt['pc_duration'],
            'categoryId' => $createdAppt['pc_catid'],
            'categoryName' => $createdAppt['pc_catname'],
            'categoryColor' => $createdAppt['pc_catcolor'],
            'status' => $createdAppt['pc_apptstatus'],
            'title' => $createdAppt['pc_title'],
            'comments' => $createdAppt['pc_hometext'],
            'patientId' => $createdAppt['pc_pid'],
            'patientName' => trim(($createdAppt['patient_fname'] ?? '') . ' ' . ($createdAppt['patient_lname'] ?? '')),
            'providerId' => $createdAppt['pc_aid'],
            'providerName' => $createdAppt['provider_name']
        ]
    ]);

} catch (Exception $e) {
    error_log("Create appointment: Error - " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to create appointment',
        'message' => $e->getMessage()
    ]);
}
