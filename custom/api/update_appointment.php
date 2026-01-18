<?php
/**
 * Mindline EMHR
 * Update Appointment API - Session-based authentication (MIGRATED TO MINDLINE)
 * Updates an existing appointment in the calendar system
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
    error_log("Update appointment: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Update appointment: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    error_log("Update appointment: User authenticated - " . $session->getUserId());

    // Initialize database
    $db = Database::getInstance();

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    error_log("Update appointment input: " . print_r($input, true));

    // Validate required fields
    $required = ['appointmentId', 'patientId', 'providerId', 'categoryId', 'eventDate', 'startTime', 'duration'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || $input[$field] === '') {
            throw new Exception("Missing required field: $field");
        }
    }

    // Extract and validate inputs
    $appointmentId = intval($input['appointmentId']);
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

    // Map OpenEMR status symbols to Mindline status strings
    $statusMap = [
        '-' => 'pending',
        '~' => 'confirmed',
        '@' => 'arrived',
        '^' => 'checkout',
        '*' => 'no_show',
        '?' => 'cancelled',
        'x' => 'deleted'
    ];
    $mindlineStatus = isset($statusMap[$apptstatus]) ? $statusMap[$apptstatus] : 'pending';

    // Check for series update
    $seriesUpdate = isset($input['seriesUpdate']) ? $input['seriesUpdate'] : null;
    $isSeriesUpdate = $seriesUpdate !== null;
    $updateScope = $isSeriesUpdate ? $seriesUpdate['scope'] : 'single'; // 'single', 'all', 'future'
    $recurrenceId = $isSeriesUpdate ? $seriesUpdate['recurrenceId'] : null;

    // Calculate start and end datetime
    $startDateTime = new DateTime($eventDate . ' ' . $startTime);
    $endDateTime = clone $startDateTime;
    $endDateTime->add(new DateInterval('PT' . $duration . 'M')); // Add duration in minutes

    // Determine which appointments to update based on scope
    $whereClause = "id = ?";
    $whereParams = [$appointmentId];

    if ($isSeriesUpdate && $updateScope !== 'single') {
        if ($updateScope === 'all') {
            // Update all occurrences in the series
            $whereClause = "recurrence_group_id = ?";
            $whereParams = [$recurrenceId];
            error_log("Update appointment: Updating ALL occurrences with recurrence ID: $recurrenceId");
        } elseif ($updateScope === 'future') {
            // Update this and future occurrences (split series logic)
            // First, get the current appointment's date to know where to split
            $currentAppt = $db->query("SELECT start_datetime FROM appointments WHERE id = ?", [$appointmentId]);
            $splitDate = $currentAppt['start_datetime'];

            // Generate new recurrence ID for the future occurrences
            $newRecurrenceId = uniqid('recur_', true);

            // Update future occurrences (including this one) with new recurrence ID
            $sql = "UPDATE appointments SET recurrence_group_id = ? WHERE recurrence_group_id = ? AND start_datetime >= ?";
            $db->execute($sql, [$newRecurrenceId, $recurrenceId, $splitDate]);

            error_log("Update appointment: Split series - new recurrence ID: $newRecurrenceId for dates >= $splitDate");

            // Now update the new series
            $whereClause = "recurrence_group_id = ?";
            $whereParams = [$newRecurrenceId];
        }
    }

    // Build UPDATE query
    $sql = "UPDATE appointments SET
        category_id = ?,
        provider_id = ?,
        client_id = ?,
        title = ?,
        start_datetime = ?,
        end_datetime = ?,
        duration_minutes = ?,
        comments = ?,
        status = ?,
        room = ?,
        updated_at = NOW()
        WHERE $whereClause";

    $params = [
        $categoryId,
        $providerId,
        $patientId,
        $title,
        $startDateTime->format('Y-m-d H:i:s'),
        $endDateTime->format('Y-m-d H:i:s'),
        $duration,
        $comments,
        $mindlineStatus,
        $room
    ];

    // Add where params
    $params = array_merge($params, $whereParams);

    error_log("Update appointment SQL: " . $sql);
    error_log("Update appointment params: " . print_r($params, true));

    // Execute update
    $updatedCount = $db->execute($sql, $params);

    error_log("Update appointment: Successfully updated $updatedCount appointment(s)");

    // Fetch the updated appointment to return full details
    $updatedAppt = $db->query(
        "SELECT
            a.id,
            a.start_datetime,
            a.end_datetime,
            a.duration_minutes,
            a.category_id,
            a.status,
            a.title,
            a.comments,
            a.client_id,
            a.provider_id,
            a.room,
            c.name AS category_name,
            c.color AS category_color,
            cl.first_name AS patient_fname,
            cl.last_name AS patient_lname,
            CONCAT(u.first_name, ' ', u.last_name) AS provider_name
        FROM appointments a
        LEFT JOIN appointment_categories c ON a.category_id = c.id
        LEFT JOIN clients cl ON a.client_id = cl.id
        LEFT JOIN users u ON a.provider_id = u.id
        WHERE a.id = ?",
        [$appointmentId]
    );

    // Extract date and time components from TIMESTAMP fields
    $startDT = new DateTime($updatedAppt['start_datetime']);
    $endDT = new DateTime($updatedAppt['end_datetime']);

    // Map Mindline status back to OpenEMR symbols for frontend compatibility
    $reverseStatusMap = array_flip($statusMap);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Appointment updated successfully',
        'appointment' => [
            'id' => $updatedAppt['id'],
            'eventDate' => $startDT->format('Y-m-d'),
            'startTime' => $startDT->format('H:i:s'),
            'endTime' => $endDT->format('H:i:s'),
            'duration' => intval($updatedAppt['duration_minutes']),
            'categoryId' => $updatedAppt['category_id'],
            'categoryName' => $updatedAppt['category_name'],
            'categoryColor' => $updatedAppt['category_color'],
            'apptstatus' => $reverseStatusMap[$updatedAppt['status']] ?? '-',
            'title' => $updatedAppt['title'],
            'comments' => $updatedAppt['comments'],
            'patientId' => $updatedAppt['client_id'],
            'patientName' => trim(($updatedAppt['patient_fname'] ?? '') . ' ' . ($updatedAppt['patient_lname'] ?? '')),
            'providerId' => $updatedAppt['provider_id'],
            'providerName' => $updatedAppt['provider_name'],
            'room' => $updatedAppt['room']
        ]
    ]);

} catch (Exception $e) {
    error_log("Update appointment: Error - " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to update appointment',
        'message' => $e->getMessage()
    ]);
}
