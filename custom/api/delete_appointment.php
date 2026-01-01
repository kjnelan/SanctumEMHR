<?php
/**
 * Mindline EMHR
 * Delete Appointment API - Session-based authentication
 * Deletes an appointment or availability block from the calendar
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
error_log("Delete appointment API called - Session ID: " . session_id());

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST/DELETE requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    error_log("Delete appointment: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Delete appointment: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

error_log("Delete appointment: User authenticated - " . $_SESSION['authUserID']);

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    error_log("Delete appointment input: " . print_r($input, true));

    // Validate required fields
    if (!isset($input['appointmentId']) || $input['appointmentId'] === '') {
        throw new Exception("Missing required field: appointmentId");
    }

    $appointmentId = intval($input['appointmentId']);

    // Verify the appointment exists and belongs to the current user (for provider blocks)
    $existing = sqlQuery(
        "SELECT pc_eid, pc_pid, pc_aid, pc_catid
         FROM openemr_postcalendar_events
         WHERE pc_eid = ?",
        [$appointmentId]
    );

    if (!$existing) {
        throw new Exception('Appointment not found');
    }

    // For provider availability blocks (pc_pid = 0), verify it belongs to current user
    if ($existing['pc_pid'] == 0 && $existing['pc_aid'] != $_SESSION['authUserID']) {
        error_log("Delete appointment: User " . $_SESSION['authUserID'] . " tried to delete block belonging to user " . $existing['pc_aid']);
        throw new Exception('You can only delete your own availability blocks');
    }

    // Delete the appointment
    $sql = "DELETE FROM openemr_postcalendar_events WHERE pc_eid = ?";

    error_log("Delete appointment SQL: " . $sql . " [ID: $appointmentId]");

    $result = sqlStatement($sql, [$appointmentId]);

    if ($result === false) {
        throw new Exception('Failed to delete appointment');
    }

    error_log("Delete appointment: Successfully deleted appointment ID $appointmentId");

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Appointment deleted successfully'
    ]);

} catch (Exception $e) {
    error_log("Delete appointment: Error - " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to delete appointment',
        'message' => $e->getMessage()
    ]);
}
