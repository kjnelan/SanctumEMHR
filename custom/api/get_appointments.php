<?php
/**
 * Get Appointments API - Session-based (MIGRATED TO SanctumEMHR)
 * Fetches appointments for calendar view with optional filters
 */

// Load SanctumEMHR initialization
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

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_log("Get appointments: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Get appointments: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $userId = $session->getUserId();
    error_log("Get appointments: User authenticated - $userId");

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

    // Initialize database
    $db = Database::getInstance();

    // Check if appointment_attendees table exists (may not be created yet)
    $attendeesTableExists = false;
    try {
        $tableCheck = $db->query("SHOW TABLES LIKE 'appointment_attendees'");
        $attendeesTableExists = !empty($tableCheck);
    } catch (Exception $e) {
        error_log("Could not check for appointment_attendees table: " . $e->getMessage());
    }

    // Build SQL query for SanctumEMHR schema
    // Use COALESCE for color and blocks_availability in case columns don't exist
    $sql = "SELECT DISTINCT
        a.id,
        a.start_datetime,
        a.end_datetime,
        a.duration,
        a.category_id,
        a.status,
        a.title,
        a.notes,
        a.room,
        a.cancellation_reason,
        a.cpt_code_id,
        a.client_id,
        a.provider_id,
        a.facility_id,
        c.name AS category_name,
        c.category_type,
        c.color AS category_color,
        c.is_billable,
        COALESCE(c.blocks_availability, 0) AS blocks_availability,
        CONCAT(cl.first_name, ' ', cl.last_name) AS client_name,
        cl.date_of_birth AS client_dob,
        u.first_name AS provider_first_name,
        u.last_name AS provider_last_name,
        CONCAT(u.first_name, ' ', u.last_name) AS provider_name,
        u.color AS provider_color,
        f.name AS facility_name,
        (SELECT id FROM appointment_recurrence WHERE parent_appointment_id = a.id LIMIT 1) AS recurrence_id
    FROM appointments a
    LEFT JOIN appointment_categories c ON a.category_id = c.id
    LEFT JOIN clients cl ON a.client_id = cl.id
    LEFT JOIN users u ON a.provider_id = u.id
    LEFT JOIN facilities f ON a.facility_id = f.id";

    // Only join attendees table if it exists
    if ($attendeesTableExists) {
        $sql .= " LEFT JOIN appointment_attendees aa ON a.id = aa.appointment_id";
    }

    $sql .= " WHERE DATE(a.start_datetime) >= ? AND DATE(a.start_datetime) <= ?";

    $params = [$start_date, $end_date];

    // Add provider filter if specified
    if ($provider_id && $provider_id !== 'all') {
        if ($attendeesTableExists) {
            // Include appointments where they're primary provider OR an attendee
            $sql .= " AND (a.provider_id = ? OR aa.user_id = ?)";
            $params[] = $provider_id;
            $params[] = $provider_id;
        } else {
            $sql .= " AND a.provider_id = ?";
            $params[] = $provider_id;
        }
    }

    $sql .= " ORDER BY a.start_datetime";

    error_log("Appointments SQL: " . $sql);

    // Execute query using Database class
    $rows = $db->queryAll($sql, $params);

    // Collect all appointment IDs to batch-fetch attendees
    $appointmentIds = array_column($rows, 'id');

    // Fetch all attendees for these appointments in one query (only if table exists)
    $attendeesByAppointment = [];
    if ($attendeesTableExists && !empty($appointmentIds)) {
        try {
            $placeholders = implode(',', array_fill(0, count($appointmentIds), '?'));
            $attendeeSql = "SELECT
                aa.appointment_id,
                aa.user_id,
                aa.role,
                u.first_name,
                u.last_name,
                u.color
            FROM appointment_attendees aa
            JOIN users u ON aa.user_id = u.id
            WHERE aa.appointment_id IN ($placeholders)
            ORDER BY aa.role, u.last_name, u.first_name";

            $attendeeRows = $db->queryAll($attendeeSql, $appointmentIds);

            foreach ($attendeeRows as $attendee) {
                $aptId = $attendee['appointment_id'];
                if (!isset($attendeesByAppointment[$aptId])) {
                    $attendeesByAppointment[$aptId] = [];
                }
                $attendeesByAppointment[$aptId][] = [
                    'userId' => $attendee['user_id'],
                    'firstName' => $attendee['first_name'],
                    'lastName' => $attendee['last_name'],
                    'role' => $attendee['role'],
                    'color' => $attendee['color']
                ];
            }
        } catch (Exception $e) {
            error_log("Failed to fetch attendees: " . $e->getMessage());
            // Continue without attendee data
        }
    }

    // Format appointments for frontend
    $appointments = [];
    foreach ($rows as $row) {
        // Extract date and time from TIMESTAMP fields
        $startDT = new DateTime($row['start_datetime']);
        $endDT = new DateTime($row['end_datetime']);

        $appointments[] = [
            'id' => $row['id'],
            'eventDate' => $startDT->format('Y-m-d'),
            'startTime' => $startDT->format('H:i:s'),
            'endTime' => $endDT->format('H:i:s'),
            'duration' => intval($row['duration']),
            'categoryId' => $row['category_id'],
            'categoryName' => $row['category_name'],
            'categoryType' => $row['category_type'],
            'categoryColor' => $row['category_color'] ?? null,
            'blocksAvailability' => (bool)($row['blocks_availability'] ?? 0),
            'isBillable' => (bool)($row['is_billable'] ?? 0),
            'apptstatus' => $row['status'],
            'status' => $row['status'],
            'title' => $row['title'],
            'comments' => $row['notes'],
            'patientId' => $row['client_id'],
            'patientName' => $row['client_name'],
            'patientDOB' => $row['client_dob'],
            'providerId' => $row['provider_id'],
            'providerName' => $row['provider_name'],
            'providerFirstName' => $row['provider_first_name'],
            'providerLastName' => $row['provider_last_name'],
            'providerColor' => $row['provider_color'],
            'facilityName' => $row['facility_name'],
            'room' => $row['room'],
            'roomId' => $row['room'],
            'cancellationReason' => $row['cancellation_reason'],
            'cptCodeId' => $row['cpt_code_id'],
            'isRecurring' => !empty($row['recurrence_id']),
            'recurrenceId' => $row['recurrence_id'],
            'attendees' => $attendeesByAppointment[$row['id']] ?? []
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
