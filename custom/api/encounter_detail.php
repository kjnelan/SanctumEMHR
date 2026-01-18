<?php
/**
 * Encounter Detail API - Session-based (MIGRATED TO MINDLINE)
 * Returns detailed information for a specific encounter
 * Note: Mindline doesn't use the concept of "encounters" - notes are standalone
 * This API returns note detail for backward compatibility
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

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

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Encounter detail: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    // Get encounter ID from query parameter
    // In Mindline, this maps to a note_id
    $encounterId = $_GET['encounter_id'] ?? null;

    if (!$encounterId) {
        error_log("Encounter detail: No encounter ID provided");
        http_response_code(400);
        echo json_encode(['error' => 'Encounter ID is required']);
        exit;
    }

    error_log("Encounter detail: User authenticated - " . $session->getUserId() . ", fetching encounter/note ID: " . $encounterId);

    // Initialize database
    $db = Database::getInstance();

    // Fetch note details (acts as "encounter" in Mindline)
    // Note: Mindline doesn't use traditional encounters - notes are standalone
    $noteSql = "SELECT
        n.id AS encounter,
        n.client_id AS pid,
        n.note_date AS date,
        n.note_type AS reason,
        n.created_by AS provider_id,
        0 AS facility_id,
        '' AS encounter_type_code,
        n.note_type AS encounter_type_description,
        n.note_date AS onset_date,
        '' AS sensitivity,
        '' AS billing_note,
        0 AS pc_catid,
        CONCAT(u.first_name, ' ', u.last_name) AS provider_name,
        '' AS facility_name,
        CONCAT(c.first_name, ' ', c.last_name) AS patient_name
    FROM clinical_notes n
    LEFT JOIN users u ON u.id = n.created_by
    LEFT JOIN clients c ON c.id = n.client_id
    WHERE n.id = ?";

    error_log("Encounter/Note SQL: " . $noteSql);
    $encounter = $db->query($noteSql, [$encounterId]);

    if (!$encounter) {
        error_log("Encounter detail: Encounter/note not found - " . $encounterId);
        http_response_code(404);
        echo json_encode(['error' => 'Encounter not found']);
        exit;
    }

    error_log("Encounter detail: Found note for client " . $encounter['patient_name']);

    // Return this note as a "form" for backward compatibility
    $forms = [[
        'id' => $encounter['encounter'],
        'form_id' => $encounter['encounter'],
        'form_name' => $encounter['reason'],
        'formdir' => strtolower(str_replace(' ', '_', $encounter['reason'])),
        'date' => $encounter['date'],
        'encounter' => $encounter['encounter'],
        'authorized' => 1,
        'deleted' => 0,
        'user_name' => $encounter['provider_name']
    ]];

    // Fetch billing/charges for this note (if any)
    $billing = [];
    $totalCharges = 0;

    try {
        $billingSql = "SELECT
            bc.id,
            bc.code_type,
            bc.code,
            bc.description AS code_text,
            bc.modifier,
            bc.units,
            bc.unit_price AS fee,
            bc.justification AS justify,
            bc.is_authorized AS authorized,
            bc.is_billed AS billed,
            bc.is_active AS activity,
            bc.payer_id,
            bc.billed_date AS bill_date,
            CONCAT(u.first_name, ' ', u.last_name) AS provider_name
        FROM billing_charges bc
        LEFT JOIN users u ON u.id = bc.provider_id
        WHERE bc.encounter_id = ? AND bc.is_active = 1
        ORDER BY bc.code_type, bc.code";

        error_log("Billing SQL: " . $billingSql);
        $billingRows = $db->queryAll($billingSql, [$encounterId]);

        foreach ($billingRows as $row) {
            $billing[] = $row;
            $totalCharges += floatval($row['fee']) * floatval($row['units']);
        }
        error_log("Found " . count($billing) . " billing entries for encounter");
    } catch (Exception $e) {
        error_log("Billing query failed: " . $e->getMessage());
        // Continue without billing data
    }

    // Fetch vitals (Mindline doesn't track vitals separately - they're in note content)
    $vitals = [];

    // Fetch diagnoses added with this note
    $diagnoses = [];

    try {
        $diagnosesSql = "SELECT
            d.id,
            d.diagnosis_code AS diagnosis,
            d.diagnosis_description AS title,
            d.start_date AS begdate,
            d.end_date AS enddate,
            d.occurrence,
            d.outcome
        FROM diagnoses d
        WHERE d.client_id = ? AND d.encounter_id = ?
        ORDER BY d.start_date DESC";

        error_log("Diagnoses SQL: " . $diagnosesSql);
        $diagnosesRows = $db->queryAll($diagnosesSql, [$encounter['pid'], $encounterId]);

        foreach ($diagnosesRows as $row) {
            $diagnoses[] = $row;
        }
        error_log("Found " . count($diagnoses) . " diagnoses for encounter");
    } catch (Exception $e) {
        error_log("Diagnoses query failed: " . $e->getMessage());
        // Continue without diagnoses data
    }

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
        'vitals' => $vitals, // Empty in Mindline
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
