<?php
/**
 * Clinical Notes API - Session-based
 * Returns all clinical notes/forms for a patient across all encounters
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
error_log("Clinical notes API called - Session ID: " . session_id());

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
    error_log("Clinical notes: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Clinical notes: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

// Get patient ID from query parameter
$patientId = $_GET['patient_id'] ?? null;

if (!$patientId) {
    error_log("Clinical notes: No patient ID provided");
    http_response_code(400);
    echo json_encode(['error' => 'Patient ID is required']);
    exit;
}

error_log("Clinical notes: User authenticated - " . $_SESSION['authUserID'] . ", fetching notes for patient ID: " . $patientId);

try {
    // Fetch all forms/notes for this patient with encounter information
    $notesSql = "SELECT
        f.id,
        f.form_id,
        f.form_name,
        f.formdir,
        f.date,
        f.encounter,
        f.authorized,
        f.deleted,
        CONCAT(u.fname, ' ', u.lname) AS user_name,
        fe.date AS encounter_date,
        fe.reason AS encounter_reason,
        CONCAT(prov.fname, ' ', prov.lname) AS encounter_provider,
        fac.name AS facility_name
    FROM forms f
    LEFT JOIN users u ON u.id = f.user
    LEFT JOIN form_encounter fe ON fe.encounter = f.encounter
    LEFT JOIN users prov ON prov.id = fe.provider_id
    LEFT JOIN facility fac ON fac.id = fe.facility_id
    WHERE f.pid = ? AND f.deleted = 0 AND f.formdir != 'newpatient'
    ORDER BY f.date DESC, f.encounter DESC";

    error_log("Notes SQL: " . $notesSql);
    $notesResult = sqlStatement($notesSql, [$patientId]);
    $notes = [];
    while ($row = sqlFetchArray($notesResult)) {
        $notes[] = $row;
    }
    error_log("Found " . count($notes) . " clinical notes for patient");

    // Build response
    $response = [
        'patient_id' => $patientId,
        'notes' => $notes,
        'total_count' => count($notes)
    ];

    error_log("Clinical notes: Successfully built response for patient " . $patientId);
    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error fetching clinical notes: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch clinical notes',
        'message' => $e->getMessage()
    ]);
}
