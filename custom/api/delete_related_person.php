<?php
/**
 * Delete Related Person API - Session-based
 * Soft deletes a related person (guardian) relationship for a patient
 */

// Start output buffering to prevent any PHP warnings/notices from breaking JSON
ob_start();

// IMPORTANT: Set these BEFORE loading globals.php to prevent redirects
$ignoreAuth = true;
$ignoreAuth_onsite_portal = true;
$ignoreAuth_onsite_portal_two = true;

require_once(__DIR__ . '/../../interface/globals.php');

// Clear any output that globals.php might have generated
ob_end_clean();

// Enable error logging
error_log("Delete related person API called - Session ID: " . session_id());

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

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Delete related person: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$userId = $_SESSION['authUserID'];
error_log("Delete related person: User authenticated - " . $userId);

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

try {
    // Soft delete by setting active = 0 in contact_relation
    $deleteSql = "UPDATE contact_relation SET active = 0 WHERE id = ?";

    error_log("Delete related person: Soft deleting relation ID: " . $relationId);
    sqlStatement($deleteSql, [$relationId]);

    error_log("Delete related person: Successfully deleted relation " . $relationId);

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
