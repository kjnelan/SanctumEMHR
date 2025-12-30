<?php
/**
 * Encounter Detail API - Session-based
 * Returns detailed information for a specific encounter including notes, billing, vitals, etc.
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
error_log("Encounter detail API called - Session ID: " . session_id());

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
    error_log("Encounter detail: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Encounter detail: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

// Get encounter ID from query parameter
$encounterId = $_GET['encounter_id'] ?? null;

if (!$encounterId) {
    error_log("Encounter detail: No encounter ID provided");
    http_response_code(400);
    echo json_encode(['error' => 'Encounter ID is required']);
    exit;
}

error_log("Encounter detail: User authenticated - " . $_SESSION['authUserID'] . ", fetching encounter ID: " . $encounterId);

try {
    // Fetch encounter details
    $encounterSql = "SELECT
        fe.encounter,
        fe.pid,
        fe.date,
        fe.reason,
        fe.provider_id,
        fe.facility_id,
        fe.encounter_type_code,
        fe.encounter_type_description,
        fe.onset_date,
        fe.sensitivity,
        fe.billing_note,
        fe.pc_catid,
        CONCAT(u.fname, ' ', u.lname) AS provider_name,
        f.name AS facility_name,
        CONCAT(p.fname, ' ', p.lname) AS patient_name
    FROM form_encounter fe
    LEFT JOIN users u ON u.id = fe.provider_id
    LEFT JOIN facility f ON f.id = fe.facility_id
    LEFT JOIN patient_data p ON p.pid = fe.pid
    WHERE fe.encounter = ?";

    error_log("Encounter SQL: " . $encounterSql);
    $encounterResult = sqlStatement($encounterSql, [$encounterId]);
    $encounter = sqlFetchArray($encounterResult);

    if (!$encounter) {
        error_log("Encounter detail: Encounter not found - " . $encounterId);
        http_response_code(404);
        echo json_encode(['error' => 'Encounter not found']);
        exit;
    }

    error_log("Encounter detail: Found encounter for patient " . $encounter['patient_name']);

    // Fetch all forms/notes for this encounter
    $formsSql = "SELECT
        f.id,
        f.form_id,
        f.form_name,
        f.formdir,
        f.date,
        f.encounter,
        f.authorized,
        f.deleted,
        CONCAT(u.fname, ' ', u.lname) AS user_name
    FROM forms f
    LEFT JOIN users u ON u.id = f.user
    WHERE f.encounter = ? AND f.deleted = 0
    ORDER BY f.date DESC";

    error_log("Forms SQL: " . $formsSql);
    $formsResult = sqlStatement($formsSql, [$encounterId]);
    $forms = [];
    while ($row = sqlFetchArray($formsResult)) {
        $forms[] = $row;
    }
    error_log("Found " . count($forms) . " forms for encounter");

    // Fetch billing/charges for this encounter
    $billingSql = "SELECT
        b.id,
        b.code_type,
        b.code,
        b.code_text,
        b.modifier,
        b.units,
        b.fee,
        b.justify,
        b.authorized,
        b.billed,
        b.activity,
        b.payer_id,
        b.bill_date,
        CONCAT(u.fname, ' ', u.lname) AS provider_name
    FROM billing b
    LEFT JOIN users u ON u.id = b.provider_id
    WHERE b.encounter = ? AND b.activity = 1
    ORDER BY b.code_type, b.code";

    error_log("Billing SQL: " . $billingSql);
    $billingResult = sqlStatement($billingSql, [$encounterId]);
    $billing = [];
    $totalCharges = 0;
    while ($row = sqlFetchArray($billingResult)) {
        $billing[] = $row;
        $totalCharges += floatval($row['fee']) * floatval($row['units']);
    }
    error_log("Found " . count($billing) . " billing entries for encounter");

    // Fetch vitals for this encounter
    $vitalsSql = "SELECT
        v.id,
        v.date,
        v.bps,
        v.bpd,
        v.weight,
        v.height,
        v.temperature,
        v.pulse,
        v.respiration,
        v.oxygen_saturation,
        v.BMI,
        CONCAT(u.fname, ' ', u.lname) AS user_name
    FROM form_vitals v
    LEFT JOIN users u ON u.id = v.user
    WHERE v.pid = ? AND v.encounter = ?
    ORDER BY v.date DESC";

    error_log("Vitals SQL: " . $vitalsSql);
    $vitalsResult = sqlStatement($vitalsSql, [$encounter['pid'], $encounterId]);
    $vitals = [];
    while ($row = sqlFetchArray($vitalsResult)) {
        $vitals[] = $row;
    }
    error_log("Found " . count($vitals) . " vitals records for encounter");

    // Fetch diagnoses added during this encounter
    $diagnosesSql = "SELECT
        l.id,
        l.diagnosis,
        l.title,
        l.begdate,
        l.enddate,
        l.occurrence,
        l.outcome
    FROM lists l
    WHERE l.pid = ? AND l.type = 'medical_problem' AND l.encounter = ?
    ORDER BY l.begdate DESC";

    error_log("Diagnoses SQL: " . $diagnosesSql);
    $diagnosesResult = sqlStatement($diagnosesSql, [$encounter['pid'], $encounterId]);
    $diagnoses = [];
    while ($row = sqlFetchArray($diagnosesResult)) {
        $diagnoses[] = $row;
    }
    error_log("Found " . count($diagnoses) . " diagnoses for encounter");

    // Build response
    $response = [
        'encounter' => [
            'encounter_id' => $encounter['encounter'],
            'pid' => $encounter['pid'],
            'date' => $encounter['date'],
            'reason' => $encounter['reason'],
            'provider_id' => $encounter['provider_id'],
            'provider_name' => $encounter['provider_name'],
            'facility_id' => $encounter['facility_id'],
            'facility_name' => $encounter['facility_name'],
            'encounter_type_code' => $encounter['encounter_type_code'],
            'encounter_type_description' => $encounter['encounter_type_description'],
            'onset_date' => $encounter['onset_date'],
            'sensitivity' => $encounter['sensitivity'],
            'billing_note' => $encounter['billing_note'],
            'patient_name' => $encounter['patient_name']
        ],
        'forms' => $forms,
        'billing' => $billing,
        'total_charges' => $totalCharges,
        'vitals' => $vitals,
        'diagnoses' => $diagnoses
    ];

    error_log("Encounter detail: Successfully built response for encounter " . $encounterId);
    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error fetching encounter detail: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch encounter detail',
        'message' => $e->getMessage()
    ]);
}
