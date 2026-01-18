<?php
/**
 * Mindline EMHR
 * Get Draft API - Session-based authentication (MIGRATED TO MINDLINE)
 * Retrieves saved draft for a note
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4
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

    $noteId = $_GET['note_id'] ?? null;
    $appointmentId = $_GET['appointment_id'] ?? null;
    $patientId = $_GET['patient_id'] ?? null;

    $sql = "SELECT
        d.id,
        d.note_id,
        d.provider_id,
        d.patient_id,
        d.appointment_id,
        d.draft_content,
        d.note_type,
        d.service_date,
        d.saved_at
    FROM note_drafts d
    WHERE d.provider_id = ?";

    $params = [$userId];

    if ($noteId) {
        $sql .= " AND d.note_id = ?";
        $params[] = intval($noteId);
    } elseif ($appointmentId) {
        $sql .= " AND d.appointment_id = ?";
        $params[] = intval($appointmentId);
    } elseif ($patientId) {
        $sql .= " AND d.patient_id = ?";
        $params[] = intval($patientId);
        $sql .= " ORDER BY d.saved_at DESC LIMIT 1";
    } else {
        $sql .= " ORDER BY d.saved_at DESC";
    }

    $rows = $db->queryAll($sql, $params);
    $drafts = [];

    foreach ($rows as $row) {
        $row['draft_content'] = json_decode($row['draft_content'], true);
        $drafts[] = $row;
    }

    if (empty($drafts)) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'No draft found'
        ]);
        exit;
    }

    if ($noteId || $appointmentId) {
        $response = [
            'success' => true,
            'draft' => $drafts[0]
        ];
    } else {
        $response = [
            'success' => true,
            'drafts' => $drafts,
            'count' => count($drafts)
        ];
    }

    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error fetching draft: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch draft',
        'message' => $e->getMessage()
    ]);
}
