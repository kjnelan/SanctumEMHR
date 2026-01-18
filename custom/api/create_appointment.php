<?php
/**
 * Mindline EMHR
 * Create Appointment API - Session-based authentication (MIGRATED TO MINDLINE)
 * Creates a new appointment in the calendar system
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
    error_log("Create appointment: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Create appointment: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    error_log("Create appointment: User authenticated - " . $session->getUserId());

    // Initialize database
    $db = Database::getInstance();

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

    // Calculate end datetime based on start time and duration
    $startDateTime = new DateTime($eventDate . ' ' . $startTime);
    $endDateTime = clone $startDateTime;
    $endDateTime->add(new DateInterval('PT' . $duration . 'M')); // Add duration in minutes

    // Get current user's facility if not specified
    if ($facilityId === 0) {
        $facilityResult = $db->query("SELECT facility_id FROM users WHERE id = ?", [$session->getUserId()]);
        $facilityId = $facilityResult['facility_id'] ?? 0;
    }

    // Check for conflicts with existing appointments and availability blocks
    // Only check conflicts for patient appointments (not for availability blocks themselves)
    $conflicts = [];
    if ($patientId > 0) {
        foreach ($occurrenceDates as $occurrenceDate) {
            // Calculate start and end datetime for this occurrence
            $occurrenceStartDT = new DateTime($occurrenceDate . ' ' . $startTime);
            $occurrenceEndDT = clone $occurrenceStartDT;
            $occurrenceEndDT->add(new DateInterval('PT' . $duration . 'M'));

            $conflictSql = "SELECT
                a.id,
                a.title,
                a.start_datetime,
                a.end_datetime,
                a.client_id,
                c.name AS category_name,
                c.category_type
            FROM appointments a
            LEFT JOIN appointment_categories c ON a.category_id = c.id
            WHERE a.provider_id = ?
              AND DATE(a.start_datetime) = ?
              AND a.status NOT IN ('deleted', 'cancelled')
              AND (
                  -- New appointment overlaps with existing event
                  (? < a.end_datetime AND ? > a.start_datetime)
              )";

            $conflictParams = [
                $providerId,
                $occurrenceDate,
                $occurrenceStartDT->format('Y-m-d H:i:s'),
                $occurrenceEndDT->format('Y-m-d H:i:s')
            ];

            $conflictResult = $db->query($conflictSql, $conflictParams);

            if ($conflictResult) {
                // Determine conflict type
                $conflictType = intval($conflictResult['category_type']);
                $isBlocking = false;
                $conflictReason = '';

                if ($conflictType === 1) {
                    // Availability block - check if it's a blocking type
                    $categoryName = strtolower($conflictResult['category_name']);

                    // Keywords that indicate unavailability (blocks appointments)
                    $blockingKeywords = ['out', 'vacation', 'meeting', 'lunch', 'break', 'unavailable', 'holiday', 'away'];

                    foreach ($blockingKeywords as $keyword) {
                        if (strpos($categoryName, $keyword) !== false) {
                            $isBlocking = true;
                            $conflictReason = "Provider unavailable: " . $conflictResult['category_name'];
                            break;
                        }
                    }
                } else {
                    // Conflict with another appointment
                    $isBlocking = true;
                    $conflictReason = "Existing appointment: " . $conflictResult['title'];
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

    // Generate a unique recurrence group ID if this is recurring
    $recurrenceGroupId = $isRecurring ? uniqid('recur_', true) : null;

    // Create appointments for all occurrences
    $createdAppointments = [];
    $appointmentIds = [];

    foreach ($occurrenceDates as $occurrenceDate) {
        // Calculate start and end datetime for this occurrence
        $occurrenceStartDT = new DateTime($occurrenceDate . ' ' . $startTime);
        $occurrenceEndDT = clone $occurrenceStartDT;
        $occurrenceEndDT->add(new DateInterval('PT' . $duration . 'M'));

        // Build INSERT query
        $sql = "INSERT INTO appointments (
            category_id,
            provider_id,
            client_id,
            title,
            start_datetime,
            end_datetime,
            duration_minutes,
            comments,
            status,
            room,
            facility_id,
            is_recurring,
            recurrence_group_id,
            created_at,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";

        $params = [
            $categoryId,
            $providerId,
            $patientId,
            $title,
            $occurrenceStartDT->format('Y-m-d H:i:s'),
            $occurrenceEndDT->format('Y-m-d H:i:s'),
            $duration,
            $comments,
            $mindlineStatus,
            $room,
            $facilityId,
            $isRecurring ? 1 : 0,
            $recurrenceGroupId
        ];

        error_log("Create appointment SQL for date $occurrenceDate: " . $sql);

        // Execute insert
        $result = $db->insert($sql, $params);

        if ($result === false) {
            throw new Exception("Failed to insert appointment for date $occurrenceDate");
        }

        $appointmentIds[] = $result;

        error_log("Create appointment: Successfully created appointment ID $result for date $occurrenceDate");
    }

    // Fetch all created appointments to return full details
    $placeholders = implode(',', array_fill(0, count($appointmentIds), '?'));
    $createdApptsQuery = "SELECT
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
            a.is_recurring,
            a.recurrence_group_id,
            c.name AS category_name,
            c.color AS category_color,
            cl.first_name AS patient_fname,
            cl.last_name AS patient_lname,
            CONCAT(u.first_name, ' ', u.last_name) AS provider_name
        FROM appointments a
        LEFT JOIN appointment_categories c ON a.category_id = c.id
        LEFT JOIN clients cl ON a.client_id = cl.id
        LEFT JOIN users u ON a.provider_id = u.id
        WHERE a.id IN ($placeholders)
        ORDER BY a.start_datetime";

    $createdApptsResult = $db->queryAll($createdApptsQuery, $appointmentIds);

    // Map Mindline status back to OpenEMR symbols for frontend compatibility
    $reverseStatusMap = array_flip($statusMap);

    foreach ($createdApptsResult as $row) {
        // Extract date and time components from TIMESTAMP fields
        $startDT = new DateTime($row['start_datetime']);
        $endDT = new DateTime($row['end_datetime']);

        $createdAppointments[] = [
            'id' => $row['id'],
            'eventDate' => $startDT->format('Y-m-d'),
            'startTime' => $startDT->format('H:i:s'),
            'endTime' => $endDT->format('H:i:s'),
            'duration' => $row['duration_minutes'] * 60, // Convert minutes to seconds for frontend
            'categoryId' => $row['category_id'],
            'categoryName' => $row['category_name'],
            'categoryColor' => $row['category_color'],
            'status' => $reverseStatusMap[$row['status']] ?? '-', // Map back to symbol
            'title' => $row['title'],
            'comments' => $row['comments'],
            'patientId' => $row['client_id'],
            'patientName' => trim(($row['patient_fname'] ?? '') . ' ' . ($row['patient_lname'] ?? '')),
            'providerId' => $row['provider_id'],
            'providerName' => $row['provider_name'],
            'isRecurring' => intval($row['is_recurring']) === 1,
            'recurrenceId' => $row['recurrence_group_id']
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
        'recurrenceId' => $recurrenceGroupId,
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
