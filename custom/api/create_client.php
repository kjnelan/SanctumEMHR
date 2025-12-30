<?php
/**
 * Create Client API - Session-based
 * Creates a new patient/client record with audit trail
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
error_log("Create client API called - Session ID: " . session_id());

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

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Create client: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$userId = $_SESSION['authUserID'];
error_log("Create client: User authenticated - " . $userId);

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

// Build insert query with provided fields
$fields = ['fname', 'lname', 'DOB', 'date']; // date = registration date
$values = [$data['fname'], $data['lname'], $data['DOB'], date('Y-m-d H:i:s')];
$placeholders = ['?', '?', '?', '?'];

// Optional fields mapping
$optionalFields = [
    'mname' => 'mname',
    'sex' => 'sex',
    'ss' => 'ss',
    'street' => 'street',
    'city' => 'city',
    'state' => 'state',
    'postal_code' => 'postal_code',
    'phone_cell' => 'phone_cell',
    'phone_home' => 'phone_home',
    'email' => 'email',
    'care_team_status' => 'care_team_status'
];

// Add optional fields if provided
foreach ($optionalFields as $key => $column) {
    if (isset($data[$key]) && $data[$key] !== '') {
        $fields[] = $column;
        $values[] = $data[$key];
        $placeholders[] = '?';
    }
}

// Generate unique pubpid (public patient ID)
$pubpid = 'C' . date('Ymd') . '-' . sprintf('%04d', rand(1, 9999));
$fields[] = 'pubpid';
$values[] = $pubpid;
$placeholders[] = '?';

// Build and execute insert query
try {
    $sql = "INSERT INTO patient_data (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
    error_log("Create client SQL: " . $sql);
    error_log("Create client values: " . print_r($values, true));

    $patientId = sqlInsert($sql, $values);

    if (!$patientId) {
        throw new Exception("Failed to create patient record");
    }

    error_log("Create client: Created patient with ID " . $patientId);

    // Log the creation in audit log
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

    $auditComment = "New client created: " . $data['fname'] . " " . $data['lname'] . " by user " . $userId;
    sqlStatement($auditSql, [$userId, $patientId, $auditComment]);
    error_log("Create client: Audit trail created - " . $auditComment);

    // Return success with new patient ID
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Client created successfully',
        'patient_id' => $patientId,
        'pubpid' => $pubpid
    ]);

} catch (Exception $e) {
    error_log("Create client: Database error - " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
