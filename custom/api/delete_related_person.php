<?php
/**
 * Delete Related Person API - Session-based (MIGRATED TO MINDLINE)
 * Soft deletes a related person (guardian) relationship for a patient
 */

// Load Mindline initialization
require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("Delete related person: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Delete related person: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $userId = $session->getUserId();
    error_log("Delete related person: User authenticated - $userId");

    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        error_log("Delete related person: Invalid JSON input");
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        exit;
    }

    // Validate required fields
    if (!isset($data['relation_id']) || empty($data['relation_id'])) {
        error_log("Delete related person: Missing relation_id");
        http_response_code(400);
        echo json_encode(['error' => 'relation_id is required']);
        exit;
    }

    $relationId = intval($data['relation_id']);

    // Initialize database
    $db = Database::getInstance();

    // Soft delete by setting updated_at in MINDLINE client_contacts table
    // Note: Mindline doesn't have 'active' field, so we use hard delete or add deleted_at
    $deleteSql = "DELETE FROM client_contacts WHERE id = ?";

    error_log("Delete related person: Deleting contact ID: $relationId");
    $db->execute($deleteSql, [$relationId]);

    error_log("Delete related person: Successfully deleted contact $relationId");

    // Return success
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Related person deleted successfully'
    ]);

} catch (Exception $e) {
    error_log("Delete related person: Database error - " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to delete related person',
        'message' => $e->getMessage()
    ]);
}
