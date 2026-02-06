<?php
/**
 * SanctumEMHR EMHR
 * Pending Supervisor Review API
 * Returns notes awaiting supervisor co-signature for the current user
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
use Custom\Lib\Auth\PermissionChecker;

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

    $supervisorId = $session->getUserId();
    $db = Database::getInstance();
    $permissionChecker = new PermissionChecker($db);

    // Check if user is a supervisor
    if (!$permissionChecker->isSupervisor()) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied - supervisor role required']);
        exit;
    }

    // Get all supervisees for this supervisor
    $superviseesSql = "SELECT user_id FROM user_supervisors
                       WHERE supervisor_id = ?
                       AND (ended_at IS NULL OR ended_at > CURDATE())";
    $supervisees = $db->queryAll($superviseesSql, [$supervisorId]);

    if (empty($supervisees)) {
        // No supervisees - return empty result
        http_response_code(200);
        echo json_encode([
            'count' => 0,
            'notes' => []
        ]);
        exit;
    }

    $superviseeIds = array_column($supervisees, 'user_id');
    $placeholders = implode(',', array_fill(0, count($superviseeIds), '?'));

    // Get notes that:
    // 1. Were created by supervisees
    // 2. Require supervisor review
    // 3. Have been signed by the provider (is_locked = 1)
    // 4. Have NOT been reviewed by supervisor yet
    $notesSql = "SELECT
        n.id,
        n.note_uuid,
        n.patient_id,
        n.note_type,
        n.service_date,
        n.created_at,
        n.signed_at,
        n.status,
        CONCAT(c.first_name, ' ', c.last_name) AS patient_name,
        CONCAT(u.first_name, ' ', u.last_name) AS provider_name,
        u.title AS provider_title
    FROM clinical_notes n
    LEFT JOIN clients c ON c.id = n.patient_id
    LEFT JOIN users u ON u.id = n.created_by
    WHERE n.created_by IN ($placeholders)
    AND n.supervisor_review_required = 1
    AND n.status = 'signed'
    AND n.supervisor_reviewed_by IS NULL
    ORDER BY n.signed_at ASC";

    $notes = $db->queryAll($notesSql, $superviseeIds);

    // Format response
    $formattedNotes = array_map(function($note) {
        return [
            'id' => $note['id'],
            'uuid' => $note['note_uuid'],
            'patientId' => $note['patient_id'],
            'patientName' => $note['patient_name'],
            'providerName' => $note['provider_name'],
            'providerTitle' => $note['provider_title'],
            'noteType' => $note['note_type'],
            'serviceDate' => $note['service_date'],
            'signedAt' => $note['signed_at'],
            'status' => $note['status']
        ];
    }, $notes);

    http_response_code(200);
    echo json_encode([
        'count' => count($formattedNotes),
        'notes' => $formattedNotes
    ]);

} catch (Exception $e) {
    error_log("Error fetching pending supervisor reviews: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch pending reviews',
        'message' => $e->getMessage()
    ]);
}
