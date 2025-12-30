<?php
/**
 * Update Insurance API - Session-based
 * Updates insurance policy information with audit trail
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
error_log("Update insurance API called - Session ID: " . session_id());

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

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Update insurance: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$userId = $_SESSION['authUserID'];
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

// Check if this is a create or update operation
$isCreate = !isset($data['insurance_id']) || empty($data['insurance_id']) || $data['insurance_id'] === null;

if ($isCreate) {
    // For creating new insurance, we need patient_id and type
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
    $patientId = intval($data['patient_id']);
    $insuranceType = $data['type'];
    error_log("Update insurance: Creating new $insuranceType insurance for patient ID: " . $patientId);
} else {
    // For updating existing insurance
    $insuranceId = intval($data['insurance_id']);
    error_log("Update insurance: Updating insurance ID: " . $insuranceId);
}

// Build update query with only the fields that can be edited
$updateFields = [];
$params = [];

// Define allowed fields with their database column names
$allowedFields = [
    // Insurance Details
    'provider' => 'provider',
    'plan_name' => 'plan_name',
    'date' => 'date',
    'date_end' => 'date_end',
    'policy_number' => 'policy_number',
    'group_number' => 'group_number',
    'copay' => 'copay',
    'accept_assignment' => 'accept_assignment',
    'policy_type' => 'policy_type',

    // Subscriber Information
    'subscriber_relationship' => 'subscriber_relationship',
    'subscriber_fname' => 'subscriber_fname',
    'subscriber_mname' => 'subscriber_mname',
    'subscriber_lname' => 'subscriber_lname',
    'subscriber_DOB' => 'subscriber_DOB',
    'subscriber_sex' => 'subscriber_sex',
    'subscriber_ss' => 'subscriber_ss',
    'subscriber_street' => 'subscriber_street',
    'subscriber_street_line_2' => 'subscriber_street_line_2',
    'subscriber_city' => 'subscriber_city',
    'subscriber_state' => 'subscriber_state',
    'subscriber_postal_code' => 'subscriber_postal_code',
    'subscriber_country' => 'subscriber_country',
    'subscriber_phone' => 'subscriber_phone',

    // Subscriber Employer
    'subscriber_employer' => 'subscriber_employer',
    'subscriber_employer_street' => 'subscriber_employer_street',
    'subscriber_employer_street_line_2' => 'subscriber_employer_street_line_2',
    'subscriber_employer_city' => 'subscriber_employer_city',
    'subscriber_employer_state' => 'subscriber_employer_state',
    'subscriber_employer_postal_code' => 'subscriber_employer_postal_code',
    'subscriber_employer_country' => 'subscriber_employer_country',

    // Type
    'type' => 'type'
];

// Build the SET clause
foreach ($allowedFields as $field => $column) {
    if (isset($data[$field])) {
        $updateFields[] = "$column = ?";
        // Handle empty date fields
        if (($field === 'date_end' || $field === 'date') && empty($data[$field])) {
            $params[] = null;
        } else {
            $params[] = $data[$field];
        }
    }
}

// Build and execute query
try {
    if ($isCreate) {
        // INSERT new insurance record
        // Add required fields for new record
        $updateFields[] = "pid = ?";
        $params[] = $patientId;
        $updateFields[] = "type = ?";
        $params[] = $insuranceType;
        $updateFields[] = "date = NOW()";  // Set creation date

        $sql = "INSERT INTO insurance_data SET " . implode(', ', $updateFields);
        error_log("Create insurance SQL: " . $sql);

        sqlStatement($sql, $params);

        // Get the newly created insurance ID
        $insuranceId = sqlInsert("SELECT LAST_INSERT_ID()");
        error_log("Created new insurance with ID: " . $insuranceId);

        // Log the creation in audit log
        $auditComment = ucfirst($insuranceType) . " insurance created by user " . $userId;
        $auditSql = "INSERT INTO log (date, event, user, patient_id, comments) VALUES (NOW(), 'insurance', ?, ?, ?)";
        sqlStatement($auditSql, [$userId, $patientId, $auditComment]);
        error_log("Create insurance: Audit trail created - " . $auditComment);

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

        // Add insurance ID to params for WHERE clause
        $params[] = $insuranceId;

        $sql = "UPDATE insurance_data SET " . implode(', ', $updateFields) . " WHERE id = ?";
        error_log("Update insurance SQL: " . $sql);

        sqlStatement($sql, $params);

        // Get the patient ID for audit logging
        $patientSql = "SELECT pid, type FROM insurance_data WHERE id = ?";
        $patientResult = sqlQuery($patientSql, [$insuranceId]);
        $patientId = $patientResult['pid'] ?? null;
        $insuranceType = $patientResult['type'] ?? 'unknown';

        if ($patientId) {
            // Log the update in audit log
            $changedFields = array_keys(array_intersect_key($data, $allowedFields));
            $auditComment = ucfirst($insuranceType) . " insurance updated: " . implode(', ', $changedFields) . " by user " . $userId;
            $auditSql = "INSERT INTO log (date, event, user, patient_id, comments) VALUES (NOW(), 'insurance', ?, ?, ?)";
            sqlStatement($auditSql, [$userId, $patientId, $auditComment]);
            error_log("Update insurance: Audit trail created - " . $auditComment);
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
