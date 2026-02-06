<?php
/**
 * SanctumEMHR EMHR
 * My Pending Notes API
 * Returns the current user's incomplete notes and sessions without notes
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

require_once(__DIR__ . '/../../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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

    if (!$session->isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $userId = $session->getUserId();
    $db = Database::getInstance();

    // Get draft/incomplete notes (not signed/locked)
    $draftNotesSql = "SELECT
        n.id,
        n.note_uuid,
        n.patient_id,
        n.note_type,
        n.service_date,
        n.created_at,
        n.updated_at,
        n.status,
        CONCAT(c.first_name, ' ', c.last_name) AS patient_name
    FROM clinical_notes n
    LEFT JOIN clients c ON c.id = n.patient_id
    WHERE n.created_by = ?
    AND n.is_locked = 0
    AND n.is_deleted = 0
    AND n.status IN ('draft', 'in_progress')
    ORDER BY n.service_date DESC, n.updated_at DESC
    LIMIT 20";

    $draftNotes = $db->queryAll($draftNotesSql, [$userId]);

    // Get recent appointments without clinical notes (last 30 days)
    // Only client appointments (not availability blocks, not admin meetings)
    $missingNotesSql = "SELECT
        a.id AS appointment_id,
        a.event_date,
        a.start_time,
        a.duration,
        a.client_id,
        CONCAT(c.first_name, ' ', c.last_name) AS patient_name,
        ac.name AS category_name
    FROM appointments a
    LEFT JOIN clients c ON c.id = a.client_id
    LEFT JOIN appointment_categories ac ON ac.id = a.category_id
    LEFT JOIN clinical_notes n ON n.appointment_id = a.id AND n.is_deleted = 0
    WHERE a.provider_id = ?
    AND a.client_id IS NOT NULL
    AND a.event_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    AND a.event_date <= CURDATE()
    AND a.status NOT IN ('cancelled', 'no_show')
    AND n.id IS NULL
    AND (ac.category_type IS NULL OR ac.category_type != 1)
    ORDER BY a.event_date DESC, a.start_time DESC
    LIMIT 20";

    $missingNotes = $db->queryAll($missingNotesSql, [$userId]);

    // Format draft notes
    $formattedDrafts = array_map(function($note) {
        return [
            'id' => $note['id'],
            'uuid' => $note['note_uuid'],
            'patientId' => $note['patient_id'],
            'patientName' => $note['patient_name'],
            'noteType' => $note['note_type'],
            'serviceDate' => $note['service_date'],
            'status' => $note['status'],
            'updatedAt' => $note['updated_at'],
            'type' => 'draft'
        ];
    }, $draftNotes);

    // Format missing notes (appointments without notes)
    $formattedMissing = array_map(function($appt) {
        return [
            'appointmentId' => $appt['appointment_id'],
            'patientId' => $appt['client_id'],
            'patientName' => $appt['patient_name'],
            'serviceDate' => $appt['event_date'],
            'startTime' => $appt['start_time'],
            'duration' => $appt['duration'],
            'categoryName' => $appt['category_name'],
            'type' => 'missing'
        ];
    }, $missingNotes);

    // Combine and sort by date
    $allPending = array_merge($formattedDrafts, $formattedMissing);
    usort($allPending, function($a, $b) {
        return strtotime($b['serviceDate']) - strtotime($a['serviceDate']);
    });

    http_response_code(200);
    echo json_encode([
        'draftCount' => count($formattedDrafts),
        'missingCount' => count($formattedMissing),
        'totalCount' => count($allPending),
        'drafts' => $formattedDrafts,
        'missing' => $formattedMissing,
        'combined' => array_slice($allPending, 0, 10) // Top 10 most recent
    ]);

} catch (Exception $e) {
    error_log("Error fetching my pending notes: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch pending notes',
        'message' => $e->getMessage()
    ]);
}
