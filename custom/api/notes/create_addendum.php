<?php
/**
 * Mindline EMHR
 * Create Addendum API - Session-based authentication (MIGRATED TO MINDLINE)
 * Creates an addendum to a locked clinical note
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

    $userId = $session->getUserId();
    $db = Database::getInstance();

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    // Validate required fields
    $required = ['parentNoteId', 'addendumReason', 'addendumContent'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || $input[$field] === '') {
            throw new Exception("Missing required field: $field");
        }
    }

    $parentNoteId = intval($input['parentNoteId']);
    $addendumReason = $input['addendumReason'];
    $addendumContent = $input['addendumContent'];

    // Verify parent note exists and is locked
    $checkSql = "SELECT id, patient_id, created_by, note_type, service_date, is_locked
                 FROM clinical_notes
                 WHERE id = ?";
    $parentNote = $db->query($checkSql, [$parentNoteId]);

    if (!$parentNote) {
        throw new Exception("Parent note not found");
    }

    // Check system setting for post-signature edits
    $settingSql = "SELECT setting_value FROM clinical_settings WHERE setting_key = 'allow_post_signature_edits'";
    $setting = $db->query($settingSql);
    $allowAddenda = $setting && $setting['setting_value'] === 'true';

    if (!$allowAddenda) {
        throw new Exception("System does not allow post-signature addenda");
    }

    if (!$parentNote['is_locked']) {
        throw new Exception("Can only create addenda for locked notes. Edit the note directly instead.");
    }

    // Generate UUID for addendum
    $addendumUuid = sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );

    // Create addendum as new note linked to parent
    $addendumSql = "INSERT INTO clinical_notes (
        note_uuid,
        patient_id,
        created_by,
        note_type,
        template_type,
        service_date,
        parent_note_id,
        is_addendum,
        addendum_reason,
        plan,
        status,
        is_locked
    ) VALUES (?, ?, ?, ?, 'addendum', ?, ?, 1, ?, ?, 'draft', 0)";

    $addendumParams = [
        $addendumUuid,
        $parentNote['patient_id'],
        $userId,
        $parentNote['note_type'],
        $parentNote['service_date'],
        $parentNoteId,
        $addendumReason,
        $addendumContent
    ];

    $addendumId = $db->insert($addendumSql, $addendumParams);

    $response = [
        'success' => true,
        'addendumId' => $addendumId,
        'addendumUuid' => $addendumUuid,
        'parentNoteId' => $parentNoteId,
        'message' => 'Addendum created successfully'
    ];

    http_response_code(201);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error creating addendum: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to create addendum',
        'message' => $e->getMessage()
    ]);
}
