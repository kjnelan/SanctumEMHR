<?php
/**
 * Mindline EMHR
 * Delete Note API - Session-based authentication (MIGRATED TO MINDLINE)
 * Deletes unsigned clinical notes only
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4B
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

require_once(__DIR__ . '/../../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

error_log("Delete note API called");

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

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Delete note: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $userId = $session->getUserId();

    // Initialize database
    $db = Database::getInstance();

    // Get request body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    $noteId = $data['note_id'] ?? null;

    if (!$noteId) {
        http_response_code(400);
        echo json_encode(['error' => 'Note ID required']);
        exit;
    }

    error_log("Delete note: User $userId attempting to delete note $noteId");

    // Get note details - Phase 4 schema (no is_locked column)
    $noteSql = "SELECT id, created_by, status, signed_at
                FROM clinical_notes
                WHERE id = ?";
    $note = $db->query($noteSql, [$noteId]);

    if (!$note) {
        http_response_code(404);
        echo json_encode(['error' => 'Note not found']);
        exit;
    }

    // Check if note is signed (Phase 4: only check status and signed_at)
    if ($note['status'] === 'signed' || !empty($note['signed_at'])) {
        error_log("Delete note: Note $noteId is signed - cannot delete");
        http_response_code(403);
        echo json_encode(['error' => 'Cannot delete signed notes']);
        exit;
    }

    // Check if user is the provider (or admin)
    $userSql = "SELECT is_admin FROM users WHERE id = ?";
    $user = $db->query($userSql, [$userId]);
    $isAdmin = ($user && $user['is_admin'] == 1);

    if (!$isAdmin && $note['created_by'] != $userId) {
        error_log("Delete note: User $userId is not authorized to delete note $noteId");
        http_response_code(403);
        echo json_encode(['error' => 'Not authorized to delete this note']);
        exit;
    }

    // Delete related drafts first
    $deleteDraftsSql = "DELETE FROM note_drafts WHERE note_id = ?";
    $db->execute($deleteDraftsSql, [$noteId]);

    // Delete the note
    $deleteNoteSql = "DELETE FROM clinical_notes WHERE id = ?";
    $db->execute($deleteNoteSql, [$noteId]);

    error_log("Delete note: Successfully deleted note $noteId");

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
