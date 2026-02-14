<?php
/**
 * Update Demographics API - Session-based (MIGRATED TO SanctumEMHR)
 * Updates client demographic information with audit trail
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;
use Custom\Lib\Audit\AuditLogger;

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
    error_log("Update demographics: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Update demographics: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $userId = $session->getUserId();
    error_log("Update demographics: User authenticated - " . $userId);

    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!$data) {
        error_log("Update demographics: Invalid JSON input");
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        exit;
    }

    // Validate client ID
    $rawClientId = $data['client_id'] ?? $data['patient_id'] ?? null;
    if (!isset($rawClientId) || empty($rawClientId)) {
        error_log("Update demographics: Missing client_id");
        http_response_code(400);
        echo json_encode(['error' => 'Client ID is required']);
        exit;
    }

    $clientId = intval($rawClientId);
    error_log("Update demographics: Updating client ID: " . $clientId);

    // Initialize database
    $db = Database::getInstance();

    // Build update query with only the fields that can be edited
    $updateFields = [];
    $params = [];

    // Define allowed fields with their database column names (SanctumEMHR schema)
    // Frontend field name => Database column name
    $allowedFields = [
        // Personal Information
        'fname' => 'first_name',
        'mname' => 'middle_name',
        'lname' => 'last_name',
        'preferred_name' => 'preferred_name',
        'DOB' => 'date_of_birth',
        'sex' => 'sex',
        'gender_identity' => 'gender_identity',
        'sexual_orientation' => 'sexual_orientation',
        'pronouns' => 'pronouns',
        'pronouns_visibility' => 'pronouns_visibility',
        'marital_status' => 'marital_status',
        'ethnicity' => 'ethnicity',
        'race' => 'race',
        'ss' => 'ssn_encrypted',

        // Contact Information - Address
        'street' => 'address_line1',
        'street_line_2' => 'address_line2',
        'city' => 'city',
        'state' => 'state',
        'postal_code' => 'zip',
        'county' => 'county',

        // Contact Information - Phone
        'phone_home' => 'phone_home',
        'phone_cell' => 'phone_mobile',
        'phone_biz' => 'phone_work',

        // Contact Information - Email
        'email' => 'email',

        // Emergency Contact
        'contact_relationship' => 'emergency_contact_relation',
        'phone_contact' => 'emergency_contact_phone',

        // Client Status
        'status' => 'status',

        // Payment Type
        'payment_type' => 'payment_type',
        'custom_session_fee' => 'custom_session_fee',

        // Clinician Information
        'provider_id' => 'primary_provider_id',

        // Portal Settings
        'allow_patient_portal' => 'portal_access',
        'cmsportal_login' => 'portal_username'
    ];

    // Fields that should be converted to NULL if empty (decimal/numeric/integer types or unique constraints)
    $nullableFields = ['custom_session_fee', 'primary_provider_id', 'cmsportal_login'];

    // Fields that should be converted to boolean (0/1)
    $booleanFields = ['allow_patient_portal'];

    // Build the SET clause
    foreach ($allowedFields as $field => $column) {
        if (isset($data[$field])) {
            $value = $data[$field];

            // Convert empty strings to NULL for numeric/nullable fields
            if (in_array($field, $nullableFields) && $value === '') {
                $value = null;
            }

            // Convert YES/NO/true/false to 0/1 for boolean fields
            if (in_array($field, $booleanFields)) {
                if ($value === 'YES' || $value === 'yes' || $value === true || $value === 1 || $value === '1') {
                    $value = 1;
                } else {
                    $value = 0;
                }
            }

            $updateFields[] = "$column = ?";
            $params[] = $value;
        }
    }

    if (empty($updateFields)) {
        error_log("Update demographics: No valid fields to update");
        http_response_code(400);
        echo json_encode(['error' => 'No valid fields to update']);
        exit;
    }

    // Add updated_at timestamp
    $updateFields[] = "updated_at = NOW()";

    // Add client ID to params for WHERE clause
    $params[] = $clientId;

    // Build and execute update query
    $sql = "UPDATE clients SET " . implode(', ', $updateFields) . " WHERE id = ?";
    error_log("Update demographics SQL: " . $sql);

    $db->execute($sql, $params);

    // Audit log: demographics edit
    $changedFields = array_keys(array_intersect_key($data, $allowedFields));
    $auditLogger = new AuditLogger($db, $session);
    $auditLogger->logEditDemographics($clientId, $changedFields);
    error_log("Update demographics: Audit trail created - " . count($changedFields) . " fields changed");

    // Return success
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Demographics updated successfully',
        'updated_fields' => count($changedFields)
    ]);

    error_log("Update demographics: Successfully updated client " . $clientId);

} catch (Exception $e) {
    error_log("Update demographics: Database error - " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
