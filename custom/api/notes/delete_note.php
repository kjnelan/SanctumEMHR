<?php
/**
 * Mindline EMHR
 * Delete Note API - Session-based authentication
 * Deletes unsigned clinical notes only
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4B
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

// Start output buffering
ob_start();

$ignoreAuth = true;
$ignoreAuth_onsite_portal = true;
$ignoreAuth_onsite_portal_two = true;

require_once(__DIR__ . '/../../../interface/globals.php');

ob_end_clean();

error_log("Delete note API called - Session ID: " . session_id());

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Delete note: Not authenticated");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

// Get request body
$input = file_get_contents('php://input');
$data = json_decode($input, true);

$noteId = $data['note_id'] ?? null;

if (!$noteId) {
    http_response_code(400);
    echo json_encode(['error' => 'Note ID required']);
    exit;
}

error_log("Delete note: User " . $_SESSION['authUserID'] . " attempting to delete note " . $noteId);

try {
    // Get note details
    $noteSql = "SELECT id, provider_id, status, is_locked, signed_at
                FROM clinical_notes
                WHERE id = ?";
    $noteResult = sqlQuery($noteSql, [$noteId]);

    if (!$noteResult) {
        http_response_code(404);
        echo json_encode(['error' => 'Note not found']);
        exit;
    }

    // Check if note is signed or locked
    if ($noteResult['is_locked'] || $noteResult['status'] === 'signed' || !empty($noteResult['signed_at'])) {
        error_log("Delete note: Note " . $noteId . " is signed/locked - cannot delete");
        http_response_code(403);
        echo json_encode(['error' => 'Cannot delete signed or locked notes']);
        exit;
    }

    // Check if user is the provider (or admin)
    $userSql = "SELECT calendar FROM users WHERE id = ?";
    $userResult = sqlQuery($userSql, [$_SESSION['authUserID']]);
    $isAdmin = ($userResult && $userResult['calendar'] == 1);

    if (!$isAdmin && $noteResult['provider_id'] != $_SESSION['authUserID']) {
        error_log("Delete note: User " . $_SESSION['authUserID'] . " is not authorized to delete note " . $noteId);
        http_response_code(403);
        echo json_encode(['error' => 'Not authorized to delete this note']);
        exit;
    }

    // Delete related drafts first
    $deleteDraftsSql = "DELETE FROM note_drafts WHERE note_id = ?";
    sqlStatement($deleteDraftsSql, [$noteId]);

    // Delete the note
    $deleteNoteSql = "DELETE FROM clinical_notes WHERE id = ?";
    sqlStatement($deleteNoteSql, [$noteId]);

    error_log("Delete note: Successfully deleted note " . $noteId);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Note deleted successfully'
    ]);

} catch (Exception $e) {
    error_log("Delete note error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to delete note',
        'message' => $e->getMessage()
    ]);
}
