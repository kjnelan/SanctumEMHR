<?php
/**
 * Update Demographics API - Session-based
 * Updates patient demographic information with audit trail
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
error_log("Update demographics API called - Session ID: " . session_id());

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

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Update demographics: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$userId = $_SESSION['authUserID'];
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

// Build update query with only the fields that can be edited
$updateFields = [];
$params = [];

// Define allowed fields with their database column names
$allowedFields = [
    // Personal Information
    'fname' => 'fname',
    'mname' => 'mname',
    'lname' => 'lname',
    'preferred_name' => 'preferred_name',
    'DOB' => 'DOB',
    'sex' => 'sex',
    'gender_identity' => 'gender_identity',
    'sexual_orientation' => 'sexual_orientation',
    'marital_status' => 'status',
    'previous_names' => 'name_history',
    'patient_categories' => 'patient_groups',
    'ss' => 'ss',

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
    'phone_biz' => 'phone_biz',
    'email' => 'email',
    'email_direct' => 'email_direct',

    // Risk & Protection
    'protect_indicator' => 'protect_indicator',

    // Care Team Status
    'care_team_status' => 'care_team_status',

    // Payment Type (stored in userlist1)
    'payment_type' => 'userlist1',

    // Clinician Information
    'provider_id' => 'providerID',
    'referring_provider_id' => 'ref_providerID',

    // Portal Settings
    'allow_patient_portal' => 'allow_patient_portal',
    'cmsportal_login' => 'cmsportal_login',

    // HIPAA Preferences
    'hipaa_notice' => 'hipaa_notice',
    'hipaa_allowsms' => 'hipaa_allowsms',
    'hipaa_voice' => 'hipaa_voice',
    'hipaa_mail' => 'hipaa_mail',
    'hipaa_email' => 'hipaa_allowemail'
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

// Add patient ID to params for WHERE clause
$params[] = $patientId;

// Build and execute update query
try {
    $sql = "UPDATE patient_data SET " . implode(', ', $updateFields) . " WHERE pid = ?";
    error_log("Update demographics SQL: " . $sql);

    sqlStatement($sql, $params);

    // Log the update in audit log
    $auditSql = "INSERT INTO log (
        date,
        event,
        user,
        patient_id,
        comments
    ) VALUES (
        NOW(),
        'patient-record',
        ?,
        ?,
        ?
    )";

    $changedFields = array_keys(array_intersect_key($data, $allowedFields));
    $auditComment = "Demographics updated: " . implode(', ', $changedFields) . " by user " . $userId;

    sqlStatement($auditSql, [$userId, $patientId, $auditComment]);
    error_log("Update demographics: Audit trail created - " . $auditComment);

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
