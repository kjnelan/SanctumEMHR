<?php
/**
 * Clinical Notes API - Session-based (MIGRATED TO SanctumEMHR)
 * Returns all clinical notes for a client
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;
use Custom\Lib\Auth\PermissionChecker;

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_log("Clinical notes: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Clinical notes: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    // Get client ID from query parameter
    $clientId = $_GET['client_id'] ?? $_GET['patient_id'] ?? null;

    if (!$clientId) {
        error_log("Clinical notes: No client ID provided");
        http_response_code(400);
        echo json_encode(['error' => 'Client ID is required']);
        exit;
    }

    // Initialize database and permission checker
    $db = Database::getInstance();
    $permissionChecker = new PermissionChecker($db);

    // Check if user can access this client
    if (!$permissionChecker->canAccessClient((int) $clientId)) {
        error_log("Clinical notes: Access denied for user " . $session->getUserId() . " to client " . $clientId);
        http_response_code(403);
        echo json_encode([
            'error' => 'Access denied',
            'message' => $permissionChecker->getAccessDeniedMessage()
        ]);
        exit;
    }

    // Check permissions - social workers can only see their own case management notes
    $canViewClinicalNotes = $permissionChecker->canViewClinicalNotes((int) $clientId);
    $canCreateCaseNotes = $permissionChecker->canCreateCaseNotes((int) $clientId);
    $isSocialWorker = $permissionChecker->isSocialWorker() && !$permissionChecker->isProvider();
    $userId = $session->getUserId();

    // If user can't view clinical notes AND can't create case notes, deny access
    if (!$canViewClinicalNotes && !$canCreateCaseNotes) {
        error_log("Clinical notes: Access denied for user " . $userId . " - no note permissions");
        http_response_code(403);
        echo json_encode([
            'error' => 'Access denied',
            'message' => 'You do not have permission to view notes for this client.'
        ]);
        exit;
    }

    error_log("Clinical notes: User authenticated - " . $userId . ", fetching notes for client ID: " . $clientId);

    // Build query based on user permissions
    // Social workers can only see case_management notes they created
    if ($isSocialWorker && !$canViewClinicalNotes) {
        $notesSql = "SELECT
            n.id,
            n.note_type,
            n.note_date,
            n.created_at,
            n.updated_at,
            CONCAT(u.first_name, ' ', u.last_name) AS user_name,
            u.id AS user_id,
            n.encounter_id
        FROM clinical_notes n
        LEFT JOIN users u ON u.id = n.created_by
        WHERE n.client_id = ?
        AND n.note_type = 'case_management'
        AND n.created_by = ?
        ORDER BY n.note_date DESC, n.created_at DESC";
        $queryParams = [$clientId, $userId];
    } else {
        // Full access - show all notes
        $notesSql = "SELECT
            n.id,
            n.note_type,
            n.note_date,
            n.created_at,
            n.updated_at,
            CONCAT(u.first_name, ' ', u.last_name) AS user_name,
            u.id AS user_id,
            n.encounter_id
        FROM clinical_notes n
        LEFT JOIN users u ON u.id = n.created_by
        WHERE n.client_id = ?
        ORDER BY n.note_date DESC, n.created_at DESC";
        $queryParams = [$clientId];
    }

    error_log("Notes SQL: " . $notesSql);
    $rows = $db->queryAll($notesSql, $queryParams);

    $notes = [];
    foreach ($rows as $row) {
        $notes[] = [
            'id' => $row['id'],
            'form_id' => $row['id'], // For backward compatibility
            'form_name' => $row['note_type'],
            'formdir' => strtolower(str_replace(' ', '_', $row['note_type'])),
            'date' => $row['note_date'] ?: $row['created_at'],
            'encounter' => $row['encounter_id'],
            'authorized' => 1, // All notes are considered authorized
            'deleted' => 0,
            'user_name' => $row['user_name'],
            'user_id' => $row['user_id']
        ];
    }

    error_log("Found " . count($notes) . " clinical notes for client");

    // Build response
    $response = [
        'patient_id' => $clientId,
        'notes' => $notes,
        'total_count' => count($notes)
    ];

    error_log("Clinical notes: Successfully built response for client " . $clientId);
    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error fetching clinical notes: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch clinical notes',
        'message' => $e->getMessage()
    ]);
}
