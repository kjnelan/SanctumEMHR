<?php
/**
 * Get Related Persons API - Session-based (MIGRATED TO MINDLINE)
 * Returns list of related persons (guardians, family) for a client
 */

// Load Mindline initialization
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
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Get related persons: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $userId = $session->getUserId();

    // Get patient ID from query parameter
    $patientId = $_GET['patient_id'] ?? null;

    if (!$patientId) {
        error_log("Get related persons: No patient_id provided");
        http_response_code(400);
        echo json_encode(['error' => 'patient_id parameter is required']);
        exit;
    }

    error_log("Get related persons: User $userId fetching for client: $patientId");

    // Initialize database
    $db = Database::getInstance();

    // Fetch all client contacts from MINDLINE schema
    $sql = "SELECT
        id,
        relationship,
        first_name,
        last_name,
        phone,
        email,
        address,
        is_emergency_contact,
        is_authorized_contact,
        can_receive_information,
        notes
    FROM client_contacts
    WHERE client_id = ?
    ORDER BY relationship, last_name, first_name";

    error_log("Get related persons SQL: $sql [client_id: $patientId]");

    // Execute query using Database class
    $rows = $db->queryAll($sql, [$patientId]);

    // Format related persons for frontend (keep compatible field names)
    $relatedPersons = [];
    foreach ($rows as $row) {
        $relatedPersons[] = [
            'id' => $row['id'],
            'relation_id' => $row['id'], // Keep old key for frontend
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'middle_name' => null, // Not in new schema
            'relationship' => $row['relationship'],
            'phone' => $row['phone'],
            'email' => $row['email'],
            'address' => $row['address'],
            'is_emergency_contact' => $row['is_emergency_contact'],
            'is_authorized' => $row['is_authorized_contact'],
            'can_receive_info' => $row['can_receive_information'],
            'notes' => $row['notes']
        ];
    }

    error_log("Get related persons: Found " . count($relatedPersons) . " related persons");

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'related_persons' => $relatedPersons
    ]);

} catch (Exception $e) {
    error_log("Get related persons: Error - " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
