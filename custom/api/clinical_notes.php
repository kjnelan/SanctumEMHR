<?php
/**
 * Clinical Notes API - Session-based (MIGRATED TO MINDLINE)
 * Returns all clinical notes for a client
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

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

    // Get patient ID from query parameter
    $patientId = $_GET['patient_id'] ?? null;

    if (!$patientId) {
        error_log("Clinical notes: No patient ID provided");
        http_response_code(400);
        echo json_encode(['error' => 'Patient ID is required']);
        exit;
    }

    error_log("Clinical notes: User authenticated - " . $session->getUserId() . ", fetching notes for patient ID: " . $patientId);

    // Initialize database
    $db = Database::getInstance();

    // Fetch all clinical notes for this client
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
    WHERE n.client_id = ? AND n.is_deleted = 0
    ORDER BY n.note_date DESC, n.created_at DESC";

    error_log("Notes SQL: " . $notesSql);
    $rows = $db->queryAll($notesSql, [$patientId]);

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

    error_log("Found " . count($notes) . " clinical notes for patient");

    // Build response
    $response = [
        'patient_id' => $patientId,
        'notes' => $notes,
        'total_count' => count($notes)
    ];

    error_log("Clinical notes: Successfully built response for patient " . $patientId);
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
