<?php
/**
 * SanctumEMHR - Client Portal Appointments API
 *
 * GET - Returns upcoming and past appointments for the authenticated client
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright (c) 2026 Sacred Wandering
 * Proprietary and Confidential
 */

require_once dirname(__FILE__, 3) . "/init.php";

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $session = SessionManager::getInstance();
    $session->start();

    $clientId = $_SESSION['portal_client_id'] ?? null;
    if (!$clientId || ($_SESSION['session_type'] ?? '') !== 'portal') {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $db = Database::getInstance();
    $view = $_GET['view'] ?? 'upcoming'; // 'upcoming' or 'past'

    if ($view === 'upcoming') {
        $sql = "SELECT a.id, a.appointment_date, a.start_time, a.end_time,
                       a.appointment_type, a.status, a.notes,
                       CONCAT(u.first_name, ' ', u.last_name) AS provider_name,
                       sl.title AS room_name,
                       f.name AS facility_name
                FROM appointments a
                LEFT JOIN users u ON u.id = a.provider_id
                LEFT JOIN settings_lists sl ON sl.option_id = a.room AND sl.list_id = 'rooms'
                LEFT JOIN facilities f ON f.id = a.facility_id
                WHERE a.client_id = ?
                  AND (a.appointment_date > CURDATE()
                       OR (a.appointment_date = CURDATE() AND a.end_time >= CURTIME()))
                  AND a.status NOT IN ('cancelled', 'deleted')
                ORDER BY a.appointment_date ASC, a.start_time ASC
                LIMIT 20";
    } else {
        $sql = "SELECT a.id, a.appointment_date, a.start_time, a.end_time,
                       a.appointment_type, a.status, a.notes,
                       CONCAT(u.first_name, ' ', u.last_name) AS provider_name,
                       sl.title AS room_name,
                       f.name AS facility_name
                FROM appointments a
                LEFT JOIN users u ON u.id = a.provider_id
                LEFT JOIN settings_lists sl ON sl.option_id = a.room AND sl.list_id = 'rooms'
                LEFT JOIN facilities f ON f.id = a.facility_id
                WHERE a.client_id = ?
                  AND (a.appointment_date < CURDATE()
                       OR (a.appointment_date = CURDATE() AND a.end_time < CURTIME()))
                  AND a.status NOT IN ('deleted')
                ORDER BY a.appointment_date DESC, a.start_time DESC
                LIMIT 50";
    }

    $appointments = $db->queryAll($sql, [$clientId]) ?: [];

    // Format for frontend — only expose what clients should see
    $formatted = array_map(function ($appt) {
        return [
            'id' => $appt['id'],
            'date' => $appt['appointment_date'],
            'startTime' => $appt['start_time'],
            'endTime' => $appt['end_time'],
            'type' => $appt['appointment_type'],
            'status' => $appt['status'],
            'providerName' => $appt['provider_name'],
            'roomName' => $appt['room_name'],
            'facilityName' => $appt['facility_name']
        ];
    }, $appointments);

    echo json_encode([
        'success' => true,
        'view' => $view,
        'appointments' => $formatted
    ]);

} catch (\Exception $e) {
    error_log("Portal appointments error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
