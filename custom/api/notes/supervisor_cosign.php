<?php
/**
 * SanctumEMHR EMHR
 * Supervisor Co-sign Note API
 * Allows supervisors to co-sign notes from their supervisees
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

    $supervisorId = $session->getUserId();
    $db = Database::getInstance();
    $permissionChecker = new PermissionChecker($db);

    // Check if user is a supervisor
    if (!$permissionChecker->isSupervisor()) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied - supervisor role required']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['noteId'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Note ID is required']);
        exit;
    }

    $noteId = intval($input['noteId']);
    $comments = $input['comments'] ?? null;

    // Get the note and verify supervisor has access
    $noteSql = "SELECT n.id, n.created_by, n.supervisor_review_required, n.status, n.supervisor_reviewed_by
                FROM clinical_notes n
                WHERE n.id = ?";
    $note = $db->query($noteSql, [$noteId]);

    if (!$note) {
        http_response_code(404);
        echo json_encode(['error' => 'Note not found']);
        exit;
    }

    if ($note['status'] !== 'signed') {
        http_response_code(400);
        echo json_encode(['error' => 'Note must be signed by the provider before supervisor review']);
        exit;
    }

    if (!$note['supervisor_review_required']) {
        http_response_code(400);
        echo json_encode(['error' => 'This note does not require supervisor review']);
        exit;
    }

    if ($note['supervisor_reviewed_by']) {
        http_response_code(400);
        echo json_encode(['error' => 'Note has already been reviewed by a supervisor']);
        exit;
    }

    // Verify this supervisor supervises the note creator
    $supervisesSql = "SELECT id FROM user_supervisors
                      WHERE supervisor_id = ? AND user_id = ?
                      AND (ended_at IS NULL OR ended_at > CURDATE())";
    $supervises = $db->query($supervisesSql, [$supervisorId, $note['created_by']]);

    if (!$supervises) {
        http_response_code(403);
        echo json_encode(['error' => 'You are not assigned as a supervisor for this provider']);
        exit;
    }

    // Co-sign the note
    $cosignSql = "UPDATE clinical_notes SET
        supervisor_reviewed_by = ?,
        supervisor_reviewed_at = NOW(),
        supervisor_comments = ?
        WHERE id = ?";

    $db->execute($cosignSql, [$supervisorId, $comments, $noteId]);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'noteId' => $noteId,
        'message' => 'Note co-signed successfully',
        'reviewedAt' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    error_log("Error co-signing note: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to co-sign note',
        'message' => $e->getMessage()
    ]);
}
