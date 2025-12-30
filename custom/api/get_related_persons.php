<?php
/**
 * Get Related Persons API - Session-based
 * Returns all related persons (guardians) for a patient
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
error_log("Get related persons API called - Session ID: " . session_id());

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
    error_log("Get related persons: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Get related persons: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

// Get patient ID from query parameter
$patientId = $_GET['patient_id'] ?? null;

if (!$patientId) {
    error_log("Get related persons: No patient_id provided");
    http_response_code(400);
    echo json_encode(['error' => 'patient_id parameter is required']);
    exit;
}

error_log("Get related persons: User authenticated - " . $_SESSION['authUserID'] . ", fetching for patient: " . $patientId);

try {
    // Fetch all active related persons for this patient
    // Join person table with contact_relation table
    $sql = "SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.middle_name,
        p.birth_date,
        p.street,
        p.city,
        p.state,
        p.postal_code,
        p.phone,
        p.email,
        p.notes,
        cr.id as relation_id,
        cr.role,
        cr.contact_id
    FROM person p
    INNER JOIN contact_relation cr ON p.id = cr.contact_id
    WHERE cr.target_table = 'patient_data'
        AND cr.target_id = ?
        AND cr.active = 1
        AND p.active = 1
    ORDER BY p.last_name, p.first_name";

    error_log("Get related persons SQL: " . $sql . " [patient_id: " . $patientId . "]");
    $result = sqlStatement($sql, [$patientId]);

    $relatedPersons = [];
    while ($row = sqlFetchArray($result)) {
        $relatedPersons[] = [
            'id' => $row['id'],
            'relation_id' => $row['relation_id'],
            'contact_id' => $row['contact_id'],
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'middle_name' => $row['middle_name'],
            'birth_date' => $row['birth_date'],
            'street' => $row['street'],
            'city' => $row['city'],
            'state' => $row['state'],
            'postal_code' => $row['postal_code'],
            'phone' => $row['phone'],
            'email' => $row['email'],
            'notes' => $row['notes'],
            'role' => $row['role']
        ];
    }

    error_log("Get related persons: Found " . count($relatedPersons) . " related persons for patient: " . $patientId);

    http_response_code(200);
    echo json_encode([
        'patient_id' => $patientId,
        'related_persons' => $relatedPersons
    ]);

} catch (Exception $e) {
    error_log("Error fetching related persons: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch related persons',
        'message' => $e->getMessage()
    ]);
}
