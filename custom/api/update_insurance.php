<?php
/**
 * Update Insurance API - Session-based (MIGRATED TO MINDLINE)
 * Updates insurance policy information with audit trail
 */

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
    error_log("Update insurance: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Update insurance: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $userId = $session->getUserId();
    error_log("Update insurance: User authenticated - " . $userId);

    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        error_log("Update insurance: Invalid JSON input");
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        exit;
    }

    // Initialize database
    $db = Database::getInstance();

    // Check if this is a create or update operation
    $isCreate = !isset($data['insurance_id']) || empty($data['insurance_id']) || $data['insurance_id'] === null;

    if ($isCreate) {
        // For creating new insurance, we need client_id and insurance_type
        if (!isset($data['patient_id']) || empty($data['patient_id'])) {
            error_log("Update insurance: Missing patient_id for new insurance");
            http_response_code(400);
            echo json_encode(['error' => 'Patient ID is required for new insurance']);
            exit;
        }
        if (!isset($data['type']) || empty($data['type'])) {
            error_log("Update insurance: Missing type for new insurance");
            http_response_code(400);
            echo json_encode(['error' => 'Insurance type is required for new insurance']);
            exit;
        }
        $clientId = intval($data['patient_id']);
        $insuranceType = $data['type'];
        error_log("Update insurance: Creating new $insuranceType insurance for client ID: " . $clientId);
    } else {
        // For updating existing insurance
        $insuranceId = intval($data['insurance_id']);
        error_log("Update insurance: Updating insurance ID: " . $insuranceId);
    }

    // Build update query with only the fields that can be edited
    $updateFields = [];
    $params = [];

    // Define allowed fields with their database column names (Mindline schema)
    $allowedFields = [
        // Insurance Details
        'provider' => 'provider_id',
        'plan_name' => 'plan_name',
        'date' => 'effective_date',
        'date_end' => 'end_date',
        'policy_number' => 'policy_number',
        'group_number' => 'group_number',
        'copay' => 'copay_amount',
        'accept_assignment' => 'accepts_assignment',
        'policy_type' => 'policy_type',

        // Subscriber Information
        'subscriber_relationship' => 'subscriber_relationship',
        'subscriber_fname' => 'subscriber_first_name',
        'subscriber_mname' => 'subscriber_middle_name',
        'subscriber_lname' => 'subscriber_last_name',
        'subscriber_DOB' => 'subscriber_date_of_birth',
        'subscriber_sex' => 'subscriber_sex',
        'subscriber_ss' => 'subscriber_ssn',
        'subscriber_street' => 'subscriber_street',
        'subscriber_street_line_2' => 'subscriber_street_line_2',
        'subscriber_city' => 'subscriber_city',
        'subscriber_state' => 'subscriber_state',
        'subscriber_postal_code' => 'subscriber_postal_code',
        'subscriber_country' => 'subscriber_country',
        'subscriber_phone' => 'subscriber_phone',

        // Subscriber Employer
        'subscriber_employer' => 'subscriber_employer_name',
        'subscriber_employer_street' => 'subscriber_employer_street',
        'subscriber_employer_street_line_2' => 'subscriber_employer_street_line_2',
        'subscriber_employer_city' => 'subscriber_employer_city',
        'subscriber_employer_state' => 'subscriber_employer_state',
        'subscriber_employer_postal_code' => 'subscriber_employer_postal_code',
        'subscriber_employer_country' => 'subscriber_employer_country',

        // Type
        'type' => 'insurance_type'
    ];

    // Build the SET clause
    foreach ($allowedFields as $field => $column) {
        if (isset($data[$field])) {
            $updateFields[] = "$column = ?";
            // Handle empty date fields
            if (($field === 'date_end' || $field === 'date' || $field === 'subscriber_DOB') && empty($data[$field])) {
                $params[] = null;
            } else {
                $params[] = $data[$field];
            }
        }
    }

    // Build and execute query
    if ($isCreate) {
        // INSERT new insurance record
        $updateFields[] = "client_id = ?";
        $params[] = $clientId;
        $updateFields[] = "insurance_type = ?";
        $params[] = $insuranceType;
        $updateFields[] = "created_at = NOW()";
        $updateFields[] = "updated_at = NOW()";

        $sql = "INSERT INTO client_insurance SET " . implode(', ', $updateFields);
        error_log("Create insurance SQL: " . $sql);

        $insuranceId = $db->insert($sql, $params);
        error_log("Created new insurance with ID: " . $insuranceId);

        // Log the creation in audit log
        $auditDescription = ucfirst($insuranceType) . " insurance created";
        $auditSql = "INSERT INTO audit_logs (user_id, action, table_name, record_id, description, created_at)
                     VALUES (?, 'create', 'client_insurance', ?, ?, NOW())";
        $db->execute($auditSql, [$userId, $insuranceId, $auditDescription]);
        error_log("Create insurance: Audit trail created - " . $auditDescription);

        // Return success
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Insurance created successfully',
            'insurance_id' => $insuranceId,
            'created_fields' => count($updateFields)
        ]);

    } else {
        // UPDATE existing insurance record
        if (empty($updateFields)) {
            error_log("Update insurance: No valid fields to update");
            http_response_code(400);
            echo json_encode(['error' => 'No valid fields to update']);
            exit;
        }

        // Add updated_at timestamp
        $updateFields[] = "updated_at = NOW()";

        // Add insurance ID to params for WHERE clause
        $params[] = $insuranceId;

        $sql = "UPDATE client_insurance SET " . implode(', ', $updateFields) . " WHERE id = ?";
        error_log("Update insurance SQL: " . $sql);

        $db->execute($sql, $params);

        // Get the client ID for audit logging
        $clientSql = "SELECT client_id, insurance_type FROM client_insurance WHERE id = ?";
        $clientResult = $db->query($clientSql, [$insuranceId]);
        $clientId = $clientResult['client_id'] ?? null;
        $insuranceType = $clientResult['insurance_type'] ?? 'unknown';

        if ($clientId) {
            // Log the update in audit log
            $changedFields = array_keys(array_intersect_key($data, $allowedFields));
            $auditDescription = ucfirst($insuranceType) . " insurance updated: " . implode(', ', $changedFields);
            $auditSql = "INSERT INTO audit_logs (user_id, action, table_name, record_id, description, created_at)
                         VALUES (?, 'update', 'client_insurance', ?, ?, NOW())";
            $db->execute($auditSql, [$userId, $insuranceId, $auditDescription]);
            error_log("Update insurance: Audit trail created - " . $auditDescription);
        }

        // Return success
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Insurance updated successfully',
            'updated_fields' => count($updateFields)
        ]);

        error_log("Update insurance: Successfully updated insurance " . $insuranceId);
    }

} catch (Exception $e) {
    error_log("Update insurance: Database error - " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
