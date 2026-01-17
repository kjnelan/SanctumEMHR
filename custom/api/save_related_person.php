<?php
/**
 * Save Related Person API - Session-based (MIGRATED TO MINDLINE)
 * Creates or updates a related person (guardian, family) for a client
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
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Save related person: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $userId = $session->getUserId();

    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        exit;
    }

    // Validate required fields
    if (!isset($data['patient_id']) || empty($data['patient_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'patient_id is required']);
        exit;
    }

    if (!isset($data['first_name']) || empty($data['first_name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'first_name is required']);
        exit;
    }

    if (!isset($data['last_name']) || empty($data['last_name'])) {
        http_response_code(400);
        echo json_encode(['error' => 'last_name is required']);
        exit;
    }

    $clientId = intval($data['patient_id']);
    $relationId = isset($data['relation_id']) ? intval($data['relation_id']) : null;

    error_log("Save related person: User $userId, client $clientId, relation " . ($relationId ?: 'NEW'));

    // Initialize database
    $db = Database::getInstance();

    if ($relationId) {
        // UPDATE existing contact
        $sql = "UPDATE client_contacts SET
            relationship = ?,
            first_name = ?,
            last_name = ?,
            phone = ?,
            email = ?,
            address = ?,
            is_emergency_contact = ?,
            is_authorized_contact = ?,
            can_receive_information = ?,
            notes = ?,
            updated_at = NOW()
        WHERE id = ? AND client_id = ?";

        $params = [
            $data['relationship'] ?? '',
            $data['first_name'],
            $data['last_name'],
            $data['phone'] ?? null,
            $data['email'] ?? null,
            $data['address'] ?? null,
            isset($data['is_emergency_contact']) ? 1 : 0,
            isset($data['is_authorized']) ? 1 : 0,
            isset($data['can_receive_info']) ? 1 : 0,
            $data['notes'] ?? null,
            $relationId,
            $clientId
        ];

        $db->execute($sql, $params);

        error_log("Save related person: Updated contact $relationId");

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Related person updated successfully',
            'relation_id' => $relationId
        ]);

    } else {
        // INSERT new contact
        $sql = "INSERT INTO client_contacts (
            client_id,
            relationship,
            first_name,
            last_name,
            phone,
            email,
            address,
            is_emergency_contact,
            is_authorized_contact,
            can_receive_information,
            notes,
            created_at,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";

        $params = [
            $clientId,
            $data['relationship'] ?? '',
            $data['first_name'],
            $data['last_name'],
            $data['phone'] ?? null,
            $data['email'] ?? null,
            $data['address'] ?? null,
            isset($data['is_emergency_contact']) ? 1 : 0,
            isset($data['is_authorized']) ? 1 : 0,
            isset($data['can_receive_info']) ? 1 : 0,
            $data['notes'] ?? null
        ];

        $newId = $db->insert($sql, $params);

        error_log("Save related person: Created new contact $newId");

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Related person created successfully',
            'relation_id' => $newId
        ]);
    }

} catch (Exception $e) {
    error_log("Save related person: Error - " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to save related person',
        'message' => $e->getMessage()
    ]);
}
