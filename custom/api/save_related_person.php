<?php
/**
 * Save Related Person API - Session-based
 * Creates or updates a related person (guardian) for a patient
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
error_log("Save related person API called - Session ID: " . session_id());

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
    error_log("Save related person: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Save related person: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$userId = $_SESSION['authUserID'];
error_log("Save related person: User authenticated - " . $userId);

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    error_log("Save related person: Invalid JSON input");
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON input']);
    exit;
}

// Validate required fields
if (!isset($data['patient_id']) || empty($data['patient_id'])) {
    error_log("Save related person: Missing patient_id");
    http_response_code(400);
    echo json_encode(['error' => 'patient_id is required']);
    exit;
}

if (!isset($data['first_name']) || empty($data['first_name'])) {
    error_log("Save related person: Missing first_name");
    http_response_code(400);
    echo json_encode(['error' => 'first_name is required']);
    exit;
}

if (!isset($data['last_name']) || empty($data['last_name'])) {
    error_log("Save related person: Missing last_name");
    http_response_code(400);
    echo json_encode(['error' => 'last_name is required']);
    exit;
}

if (!isset($data['role']) || empty($data['role'])) {
    error_log("Save related person: Missing role");
    http_response_code(400);
    echo json_encode(['error' => 'role is required']);
    exit;
}

$patientId = intval($data['patient_id']);
$personId = isset($data['person_id']) ? intval($data['person_id']) : null;

try {
    if ($personId) {
        // UPDATE existing person
        error_log("Save related person: Updating person ID: " . $personId);

        $updateSql = "UPDATE person SET
            first_name = ?,
            last_name = ?,
            middle_name = ?,
            birth_date = ?,
            street = ?,
            city = ?,
            state = ?,
            postal_code = ?,
            phone = ?,
            email = ?,
            notes = ?
            WHERE id = ?";

        sqlStatement($updateSql, [
            $data['first_name'],
            $data['last_name'],
            $data['middle_name'] ?? null,
            $data['birth_date'] ?? null,
            $data['street'] ?? null,
            $data['city'] ?? null,
            $data['state'] ?? null,
            $data['postal_code'] ?? null,
            $data['phone'] ?? null,
            $data['email'] ?? null,
            $data['notes'] ?? null,
            $personId
        ]);

        // Update role in contact_relation
        $updateRelationSql = "UPDATE contact_relation SET
            role = ?
            WHERE contact_id = ? AND target_table = 'patient_data' AND target_id = ?";

        sqlStatement($updateRelationSql, [
            $data['role'],
            $personId,
            $patientId
        ]);

        error_log("Save related person: Updated person " . $personId . " for patient " . $patientId);

    } else {
        // INSERT new person
        error_log("Save related person: Creating new person for patient: " . $patientId);

        $insertPersonSql = "INSERT INTO person (
            first_name,
            last_name,
            middle_name,
            birth_date,
            street,
            city,
            state,
            postal_code,
            phone,
            email,
            notes,
            active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)";

        sqlStatement($insertPersonSql, [
            $data['first_name'],
            $data['last_name'],
            $data['middle_name'] ?? null,
            $data['birth_date'] ?? null,
            $data['street'] ?? null,
            $data['city'] ?? null,
            $data['state'] ?? null,
            $data['postal_code'] ?? null,
            $data['phone'] ?? null,
            $data['email'] ?? null,
            $data['notes'] ?? null
        ]);

        // Get the newly created person ID
        $personId = sqlInsert("SELECT LAST_INSERT_ID()");

        // Create contact_relation entry
        $insertRelationSql = "INSERT INTO contact_relation (
            contact_id,
            target_table,
            target_id,
            role,
            active
        ) VALUES (?, 'patient_data', ?, ?, 1)";

        sqlStatement($insertRelationSql, [
            $personId,
            $patientId,
            $data['role']
        ]);

        error_log("Save related person: Created person " . $personId . " for patient " . $patientId);
    }

    // Return success
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Related person saved successfully',
        'person_id' => $personId
    ]);

} catch (Exception $e) {
    error_log("Save related person: Database error - " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to save related person',
        'message' => $e->getMessage()
    ]);
}
