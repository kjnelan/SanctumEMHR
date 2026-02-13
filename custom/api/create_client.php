<?php
/**
 * Create Client API - Session-based (MIGRATED TO SanctumEMHR)
 * Creates a new client record with audit trail
 */

// Load SanctumEMHR initialization
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
    error_log("Create client: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Create client: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $userId = $session->getUserId();
    error_log("Create client: User authenticated - $userId");

    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        error_log("Create client: Invalid JSON input");
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        exit;
    }

    // Validate required fields
    if (!isset($data['fname']) || empty($data['fname'])) {
        error_log("Create client: Missing first name");
        http_response_code(400);
        echo json_encode(['error' => 'First name is required']);
        exit;
    }

    if (!isset($data['lname']) || empty($data['lname'])) {
        error_log("Create client: Missing last name");
        http_response_code(400);
        echo json_encode(['error' => 'Last name is required']);
        exit;
    }

    if (!isset($data['DOB']) || empty($data['DOB'])) {
        error_log("Create client: Missing date of birth");
        http_response_code(400);
        echo json_encode(['error' => 'Date of birth is required']);
        exit;
    }

    error_log("Create client: Creating new client - " . $data['fname'] . " " . $data['lname']);

    // Initialize database
    $db = Database::getInstance();

    // Build insert query with SanctumEMHR schema field names
    $fields = ['first_name', 'last_name', 'date_of_birth', 'created_at'];
    $values = [$data['fname'], $data['lname'], $data['DOB'], date('Y-m-d H:i:s')];
    $placeholders = ['?', '?', '?', '?'];

    // Optional fields mapping (OLD API field => NEW DB column)
    $optionalFields = [
        'mname' => 'middle_name',
        'sex' => 'sex',
        'ss' => 'ssn_encrypted',
        'street' => 'address_line1',
        'city' => 'city',
        'state' => 'state',
        'postal_code' => 'zip',
        'phone_cell' => 'phone_mobile',
        'phone_home' => 'phone_home',
        'email' => 'email',
        'care_team_status' => 'status'
    ];

    // Add optional fields if provided
    foreach ($optionalFields as $apiKey => $dbColumn) {
        if (isset($data[$apiKey]) && $data[$apiKey] !== '') {
            $fields[] = $dbColumn;
            $values[] = $data[$apiKey];
            $placeholders[] = '?';
        }
    }

    // Generate UUID for client
    $uuid = sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
    $fields[] = 'uuid';
    $values[] = $uuid;
    $placeholders[] = '?';

    // Set intake_date to today
    $fields[] = 'intake_date';
    $values[] = date('Y-m-d');
    $placeholders[] = '?';

    // Build and execute insert query
    $sql = "INSERT INTO clients (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
    error_log("Create client SQL: " . $sql);
    error_log("Create client values: " . print_r($values, true));

    $clientId = $db->insert($sql, $values);

    if (!$clientId) {
        throw new Exception("Failed to create client record");
    }

    error_log("Create client: Created client with ID " . $clientId);

    // Log the creation in audit log
    $auditSql = "INSERT INTO audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        details,
        created_at
    ) VALUES (?, ?, ?, ?, ?, NOW())";

    $auditDetails = "New client created: " . $data['fname'] . " " . $data['lname'];
    $db->execute($auditSql, [$userId, 'create', 'clients', $clientId, $auditDetails]);
    error_log("Create client: Audit trail created - " . $auditDetails);

    // Return success with new client ID
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Client created successfully',
        'client_id' => $clientId,
        'uuid' => $uuid
    ]);

} catch (Exception $e) {
    error_log("Create client: Database error - " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
