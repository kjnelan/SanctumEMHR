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
    $overrideAvailability = isset($input['overrideAvailability']) ? boolval($input['overrideAvailability']) : false;

    // Check if this is a recurring appointment
    $isRecurring = isset($input['recurrence']) && $input['recurrence']['enabled'] === true;
    $occurrenceDates = [];

    if ($isRecurring) {
        // Extract recurrence parameters
        $recurDays = $input['recurrence']['days']; // ['mon' => true, 'tue' => false, ...]
        $recurInterval = intval($input['recurrence']['interval']); // 1=weekly, 2=bi-weekly, etc.
        $recurEndType = $input['recurrence']['endType']; // 'count' or 'date'
        $recurEndCount = $recurEndType === 'count' ? intval($input['recurrence']['endCount']) : null;
        $recurEndDate = $recurEndType === 'date' ? $input['recurrence']['endDate'] : null;

        // Convert selected days to array of day numbers (0=Sunday, 6=Saturday)
        $selectedDayNumbers = [];
        $dayMap = ['sun' => 0, 'mon' => 1, 'tue' => 2, 'wed' => 3, 'thu' => 4, 'fri' => 5, 'sat' => 6];
        foreach ($recurDays as $dayKey => $isSelected) {
            if ($isSelected && isset($dayMap[$dayKey])) {
                $selectedDayNumbers[] = $dayMap[$dayKey];
            }
        }

        if (empty($selectedDayNumbers)) {
            throw new Exception('No days selected for recurrence');
        }

        sort($selectedDayNumbers); // Ensure days are in order

        // Generate occurrence dates
        $currentDate = new DateTime($eventDate);
        $occurrenceCount = 0;
        $maxOccurrences = $recurEndType === 'count' ? $recurEndCount : 365; // Safety limit of 365 occurrences
        $endDateTime = $recurEndType === 'date' ? new DateTime($recurEndDate) : null;

        // Start from the selected date
        $weekOffset = 0;

        while ($occurrenceCount < $maxOccurrences) {
            // Calculate the date for current week offset
            $weekStartDate = new DateTime($eventDate);
            $weekStartDate->add(new DateInterval('P' . ($weekOffset * $recurInterval * 7) . 'D'));

            // Check each selected day in this week
            foreach ($selectedDayNumbers as $dayNum) {
                $occurrenceDate = clone $weekStartDate;

                // Find the first occurrence of this day in the week
                $currentDayNum = intval($occurrenceDate->format('w')); // 0=Sunday, 6=Saturday
                $daysToAdd = ($dayNum - $currentDayNum + 7) % 7;

                // For the first week, skip if we'd go backwards
                if ($weekOffset === 0 && $daysToAdd < 0) {
                    continue;
                }

                $occurrenceDate->add(new DateInterval('P' . $daysToAdd . 'D'));

                // Check if this occurrence is valid
                if ($occurrenceDate < new DateTime($eventDate)) {
                    continue; // Don't create occurrences before start date
                }

                if ($endDateTime && $occurrenceDate > $endDateTime) {
                    break 2; // Exit both loops if past end date
                }

                if ($recurEndType === 'count' && $occurrenceCount >= $recurEndCount) {
                    break 2; // Exit both loops if reached count limit
                }

                // Add this occurrence
                $occurrenceDates[] = $occurrenceDate->format('Y-m-d');
                $occurrenceCount++;

                if ($recurEndType === 'count' && $occurrenceCount >= $recurEndCount) {
                    break 2;
                }
            }

            $weekOffset++;

            // Safety check to prevent infinite loops
            if ($weekOffset > 260) { // ~5 years of weeks
                break;
            }
        }

        error_log("Generated " . count($occurrenceDates) . " recurring occurrences: " . implode(', ', $occurrenceDates));
    } else {
        // Single occurrence
        $occurrenceDates = [$eventDate];
    }

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

    // Check for conflicts with existing appointments and availability blocks
    // Only check conflicts for patient appointments (not for availability blocks themselves)
    $conflicts = [];
    if ($patientId > 0) {
        foreach ($occurrenceDates as $occurrenceDate) {
            $conflictSql = "SELECT
                e.pc_eid,
                e.pc_title,
                e.pc_eventDate,
                e.pc_startTime,
                e.pc_duration,
                e.pc_pid,
                c.pc_catname,
                c.pc_cattype
            FROM openemr_postcalendar_events e
            LEFT JOIN openemr_postcalendar_categories c ON e.pc_catid = c.pc_catid
            WHERE e.pc_aid = ?
              AND e.pc_eventDate = ?
              AND e.pc_apptstatus NOT IN ('x', '?')
              AND (
                  -- New appointment starts during existing event
                  (? >= e.pc_startTime AND ? < ADDTIME(e.pc_startTime, SEC_TO_TIME(e.pc_duration)))
                  OR
                  -- New appointment ends during existing event
                  (? > e.pc_startTime AND ? <= ADDTIME(e.pc_startTime, SEC_TO_TIME(e.pc_duration)))
                  OR
                  -- New appointment completely contains existing event
                  (? <= e.pc_startTime AND ? >= ADDTIME(e.pc_startTime, SEC_TO_TIME(e.pc_duration)))
              )";

            $conflictParams = [
                $providerId,
                $occurrenceDate,
                $startTime, $startTime,  // Check start time
                $endTime, $endTime,      // Check end time
                $startTime, $endTime     // Check if contains
            ];

            $conflictResult = sqlQuery($conflictSql, $conflictParams);

            if ($conflictResult) {
                // Determine conflict type
                $conflictType = intval($conflictResult['pc_cattype']);
                $isBlocking = false;
                $conflictReason = '';

                if ($conflictType === 1) {
                    // Availability block - check if it's a blocking type
                    $categoryName = strtolower($conflictResult['pc_catname']);

                    // Keywords that indicate unavailability (blocks appointments)
                    $blockingKeywords = ['out', 'vacation', 'meeting', 'lunch', 'break', 'unavailable', 'holiday', 'away'];

                    foreach ($blockingKeywords as $keyword) {
                        if (strpos($categoryName, $keyword) !== false) {
                            $isBlocking = true;
                            $conflictReason = "Provider unavailable: " . $conflictResult['pc_catname'];
                            break;
                        }
                    }
                } else {
                    // Conflict with another appointment
                    $isBlocking = true;
                    $conflictReason = "Existing appointment: " . $conflictResult['pc_title'];
                }

                if ($isBlocking) {
                    $conflicts[] = [
                        'date' => $occurrenceDate,
                        'time' => $startTime,
                        'reason' => $conflictReason,
                        'conflictType' => $conflictType === 1 ? 'availability' : 'appointment'
                    ];
                }
            }
        }

        // If conflicts found and not overriding, return conflict details
        if (!empty($conflicts) && !$overrideAvailability) {
            error_log("Create appointment: Found " . count($conflicts) . " conflicts");
            http_response_code(409); // Conflict status code
            echo json_encode([
                'success' => false,
                'error' => 'conflicts',
                'message' => count($conflicts) . ' conflict(s) found',
                'conflicts' => $conflicts,
                'totalOccurrences' => count($occurrenceDates),
                'conflictCount' => count($conflicts)
            ]);
            exit;
        }
    }

    // Generate a unique recurrence ID if this is recurring
    $recurrenceId = $isRecurring ? uniqid('recur_', true) : null;

    // Create appointments for all occurrences
    $createdAppointments = [];
    $appointmentIds = [];

    foreach ($occurrenceDates as $occurrenceDate) {
        // Calculate end date for this occurrence
        $occurrenceStartDateTime = new DateTime($occurrenceDate . ' ' . $startTime);
        $occurrenceEndDateTime = clone $occurrenceStartDateTime;
        $occurrenceEndDateTime->add(new DateInterval('PT' . $duration . 'M'));
        $occurrenceEndTime = $occurrenceEndDateTime->format('H:i:s');
        $occurrenceEndDate = $occurrenceEndDateTime->format('Y-m-d');

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
            pc_recurrspec,
            pc_sendalertsms,
            pc_sendalertemail
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 0, 0, ?, ?, 'NO', 'NO')";

        $params = [
            $categoryId,
            $providerId,
            $patientId,
            $title,
            $occurrenceDate,
            $occurrenceEndDate,
            $startTime,
            $occurrenceEndTime,
            $durationSeconds,
            $comments,
            $apptstatus,
            $room,
            $facilityId,
            $isRecurring ? 1 : 0, // pc_recurrtype: 1 if recurring, 0 if not
            $recurrenceId          // pc_recurrspec: shared ID for all occurrences in series
        ];

        error_log("Create appointment SQL for date $occurrenceDate: " . $sql);

        // Execute insert
        $result = sqlInsert($sql, $params);

        if ($result === false) {
            throw new Exception("Failed to insert appointment for date $occurrenceDate");
        }

        $appointmentIds[] = $result;

        error_log("Create appointment: Successfully created appointment ID $result for date $occurrenceDate");
    }

    // Fetch all created appointments to return full details
    $placeholders = implode(',', array_fill(0, count($appointmentIds), '?'));
    $createdApptsQuery = "SELECT
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
            e.pc_recurrtype,
            e.pc_recurrspec,
            c.pc_catname,
            c.pc_catcolor,
            pd.fname AS patient_fname,
            pd.lname AS patient_lname,
            CONCAT(u.fname, ' ', u.lname) AS provider_name
        FROM openemr_postcalendar_events e
        LEFT JOIN openemr_postcalendar_categories c ON e.pc_catid = c.pc_catid
        LEFT JOIN patient_data pd ON e.pc_pid = pd.pid
        LEFT JOIN users u ON e.pc_aid = u.id
        WHERE e.pc_eid IN ($placeholders)
        ORDER BY e.pc_eventDate, e.pc_startTime";

    $createdApptsResult = sqlStatement($createdApptsQuery, $appointmentIds);

    while ($row = sqlFetchArray($createdApptsResult)) {
        $createdAppointments[] = [
            'id' => $row['pc_eid'],
            'eventDate' => $row['pc_eventDate'],
            'startTime' => $row['pc_startTime'],
            'endTime' => $row['pc_endTime'],
            'duration' => $row['pc_duration'],
            'categoryId' => $row['pc_catid'],
            'categoryName' => $row['pc_catname'],
            'categoryColor' => $row['pc_catcolor'],
            'status' => $row['pc_apptstatus'],
            'title' => $row['pc_title'],
            'comments' => $row['pc_hometext'],
            'patientId' => $row['pc_pid'],
            'patientName' => trim(($row['patient_fname'] ?? '') . ' ' . ($row['patient_lname'] ?? '')),
            'providerId' => $row['pc_aid'],
            'providerName' => $row['provider_name'],
            'isRecurring' => intval($row['pc_recurrtype']) === 1,
            'recurrenceId' => $row['pc_recurrspec']
        ];
    }

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => $isRecurring
            ? count($createdAppointments) . ' recurring appointments created successfully'
            : 'Appointment created successfully',
        'isRecurring' => $isRecurring,
        'occurrenceCount' => count($createdAppointments),
        'recurrenceId' => $recurrenceId,
        'appointmentId' => $appointmentIds[0], // First appointment ID for backwards compatibility
        'appointmentIds' => $appointmentIds,
        'appointments' => $createdAppointments,
        'appointment' => $createdAppointments[0] ?? null // First appointment for backwards compatibility
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
