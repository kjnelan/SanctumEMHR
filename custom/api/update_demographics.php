<?php
/**
 * Update Demographics API - Session-based (MIGRATED TO MINDLINE)
 * Updates patient demographic information with audit trail
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

    // Validate patient ID
    if (!isset($data['patient_id']) || empty($data['patient_id'])) {
        error_log("Update demographics: Missing patient_id");
        http_response_code(400);
        echo json_encode(['error' => 'Patient ID is required']);
        exit;
    }

    $patientId = intval($data['patient_id']);
    error_log("Update demographics: Updating patient ID: " . $patientId);

    // Initialize database
    $db = Database::getInstance();

    // Build update query with only the fields that can be edited
    $updateFields = [];
    $params = [];

    // Define allowed fields with their database column names (Mindline schema)
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
        'marital_status' => 'marital_status',
        'previous_names' => 'previous_names',
        'patient_categories' => 'patient_categories',
        'ss' => 'ssn_encrypted',

        // Contact Information
        'street' => 'street',
        'street_line_2' => 'street_line_2',
        'city' => 'city',
        'state' => 'state',
        'postal_code' => 'postal_code',
        'county' => 'county',
        'contact_relationship' => 'contact_relationship',
        'phone_contact' => 'phone_contact',
        'phone_home' => 'phone_home',
        'phone_cell' => 'phone_cell',
        'phone_biz' => 'phone_work',
        'email' => 'email',
        'email_direct' => 'email_direct',

        // Risk & Protection
        'protect_indicator' => 'protect_indicator',

        // Care Team Status
        'care_team_status' => 'status',

        // Payment Type
        'payment_type' => 'payment_type',

        // Clinician Information
        'provider_id' => 'provider_id',
        'referring_provider_id' => 'referring_provider_id',

        // Portal Settings
        'allow_patient_portal' => 'allow_patient_portal',
        'cmsportal_login' => 'portal_username',

        // HIPAA Preferences
        'hipaa_notice' => 'hipaa_notice_received',
        'hipaa_allowsms' => 'hipaa_allow_sms',
        'hipaa_voice' => 'hipaa_allow_voice',
        'hipaa_mail' => 'hipaa_allow_mail',
        'hipaa_email' => 'hipaa_allow_email'
    ];

    // Build the SET clause
    foreach ($allowedFields as $field => $column) {
        if (isset($data[$field])) {
            $updateFields[] = "$column = ?";
            $params[] = $data[$field];
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

    // Add patient ID to params for WHERE clause
    $params[] = $patientId;

    // Build and execute update query
    $sql = "UPDATE clients SET " . implode(', ', $updateFields) . " WHERE id = ?";
    error_log("Update demographics SQL: " . $sql);

    $db->execute($sql, $params);

    // Log the update in audit log
    $auditSql = "INSERT INTO audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        description,
        created_at
    ) VALUES (
        ?,
        'update',
        'clients',
        ?,
        ?,
        NOW()
    )";

    $changedFields = array_keys(array_intersect_key($data, $allowedFields));
    $auditDescription = "Demographics updated: " . implode(', ', $changedFields);

    $db->execute($auditSql, [$userId, $patientId, $auditDescription]);
    error_log("Update demographics: Audit trail created - " . $auditDescription);

    // Return success
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Demographics updated successfully',
        'updated_fields' => count($changedFields)
    ]);

    error_log("Update demographics: Successfully updated patient " . $patientId);

} catch (Exception $e) {
    error_log("Update demographics: Database error - " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
