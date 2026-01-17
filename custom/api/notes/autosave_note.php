<?php
/**
 * Mindline EMHR
 * Auto-save Note API - Session-based authentication (MIGRATED TO MINDLINE)
 * Saves note draft for auto-recovery
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
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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

    $db = Database::getInstance();
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    $patientId = intval($input['patientId']);
    $providerId = $session->getUserId();
    $noteType = $input['noteType'];
    $serviceDate = $input['serviceDate'];
    $draftContent = json_encode($input['draftContent']);

    $noteId = isset($input['noteId']) ? intval($input['noteId']) : null;
    $appointmentId = isset($input['appointmentId']) ? intval($input['appointmentId']) : null;

    $checkSql = "SELECT id FROM note_drafts WHERE provider_id = ? AND patient_id = ?";
    $checkParams = [$providerId, $patientId];

    if ($noteId) {
        $checkSql .= " AND note_id = ?";
        $checkParams[] = $noteId;
    } elseif ($appointmentId) {
        $checkSql .= " AND appointment_id = ?";
        $checkParams[] = $appointmentId;
    } else {
        $checkSql .= " AND note_type = ? AND service_date = ? AND note_id IS NULL";
        $checkParams[] = $noteType;
        $checkParams[] = $serviceDate;
    }

    $existingDraft = $db->query($checkSql, $checkParams);

    if ($existingDraft) {
        $updateSql = "UPDATE note_drafts SET
            draft_content = ?,
            note_type = ?,
            service_date = ?,
            saved_at = NOW()
            WHERE id = ?";

        $db->execute($updateSql, [$draftContent, $noteType, $serviceDate, $existingDraft['id']]);
        $draftId = $existingDraft['id'];
    } else {
        $insertSql = "INSERT INTO note_drafts (
            note_id,
            provider_id,
            patient_id,
            appointment_id,
            draft_content,
            note_type,
            service_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?)";

        $draftId = $db->insert($insertSql, [$noteId, $providerId, $patientId, $appointmentId, $draftContent, $noteType, $serviceDate]);
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'draftId' => $draftId,
        'message' => 'Draft saved successfully',
        'savedAt' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    error_log("Error auto-saving note: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to save draft',
        'message' => $e->getMessage()
    ]);
}
