<?php
/**
 * Mindline EMHR
 * Get Note API - Session-based authentication
 * Returns a specific clinical note by ID or UUID
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

// Start output buffering to prevent any PHP warnings/notices from breaking JSON
ob_start();

// IMPORTANT: Set these BEFORE loading globals.php to prevent redirects
$ignoreAuth = true;
$ignoreAuth_onsite_portal = true;
$ignoreAuth_onsite_portal_two = true;

require_once(__DIR__ . '/../../../interface/globals.php');

// Clear any output that globals.php might have generated
ob_end_clean();

// Enable error logging
error_log("Get note API called - Session ID: " . session_id());

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
    error_log("Get note: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Get note: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

// Get note ID or UUID from query parameter
$noteId = $_GET['note_id'] ?? null;
$noteUuid = $_GET['note_uuid'] ?? null;

if (!$noteId && !$noteUuid) {
    error_log("Get note: No note ID or UUID provided");
    http_response_code(400);
    echo json_encode(['error' => 'Note ID or UUID is required']);
    exit;
}

error_log("Get note: User authenticated - " . $_SESSION['authUserID']);

try {
    // Build SQL query
    $sql = "SELECT
        n.id,
        n.note_uuid,
        n.patient_id,
        n.provider_id,
        n.appointment_id,
        n.billing_id,
        n.note_type,
        n.template_type,
        n.service_date,
        n.service_duration,
        n.service_location,
        n.behavior_problem,
        n.intervention,
        n.response,
        n.plan,
        n.risk_assessment,
        n.risk_present,
        n.goals_addressed,
        n.interventions_selected,
        n.client_presentation,
        n.diagnosis_codes,
        n.presenting_concerns,
        n.clinical_observations,
        n.mental_status_exam,
        n.status,
        n.is_locked,
        n.signed_at,
        n.signed_by,
        n.signature_data,
        n.supervisor_review_required,
        n.supervisor_review_status,
        n.supervisor_signed_at,
        n.supervisor_signed_by,
        n.supervisor_comments,
        n.parent_note_id,
        n.is_addendum,
        n.addendum_reason,
        n.created_at,
        n.updated_at,
        n.locked_at,
        n.last_autosave_at,
        CONCAT(p.fname, ' ', p.lname) AS provider_name,
        CONCAT(sb.fname, ' ', sb.lname) AS signed_by_name,
        CONCAT(ss.fname, ' ', ss.lname) AS supervisor_name,
        CONCAT(pt.fname, ' ', pt.lname) AS patient_name
    FROM clinical_notes n
    LEFT JOIN users p ON p.id = n.provider_id
    LEFT JOIN users sb ON sb.id = n.signed_by
    LEFT JOIN users ss ON ss.id = n.supervisor_signed_by
    LEFT JOIN patient_data pt ON pt.pid = n.patient_id
    WHERE ";

    $params = [];

    if ($noteId) {
        $sql .= "n.id = ?";
        $params[] = intval($noteId);
    } else {
        $sql .= "n.note_uuid = ?";
        $params[] = $noteUuid;
    }

    error_log("Note SQL: " . $sql);
    error_log("Params: " . print_r($params, true));

    $result = sqlStatement($sql, $params);
    $note = sqlFetchArray($result);

    if (!$note) {
        error_log("Note not found");
        http_response_code(404);
        echo json_encode(['error' => 'Note not found']);
        exit;
    }

    // Decode JSON fields
    $note['goals_addressed'] = $note['goals_addressed'] ? json_decode($note['goals_addressed'], true) : null;
    $note['interventions_selected'] = $note['interventions_selected'] ? json_decode($note['interventions_selected'], true) : null;
    $note['client_presentation'] = $note['client_presentation'] ? json_decode($note['client_presentation'], true) : null;
    $note['diagnosis_codes'] = $note['diagnosis_codes'] ? json_decode($note['diagnosis_codes'], true) : null;

    // Convert boolean fields
    $note['risk_present'] = (bool)$note['risk_present'];
    $note['is_locked'] = (bool)$note['is_locked'];
    $note['supervisor_review_required'] = (bool)$note['supervisor_review_required'];
    $note['is_addendum'] = (bool)$note['is_addendum'];

    // If this note has addenda, fetch them
    $addendaSql = "SELECT
        n.id,
        n.note_uuid,
        n.addendum_reason,
        n.created_at,
        n.updated_at,
        CONCAT(u.fname, ' ', u.lname) AS provider_name
    FROM clinical_notes n
    LEFT JOIN users u ON u.id = n.provider_id
    WHERE n.parent_note_id = ? AND n.is_addendum = 1
    ORDER BY n.created_at DESC";

    $addendaResult = sqlStatement($addendaSql, [$note['id']]);
    $addenda = [];
    while ($addRow = sqlFetchArray($addendaResult)) {
        $addenda[] = $addRow;
    }
    $note['addenda'] = $addenda;

    error_log("Successfully retrieved note ID: " . $note['id']);

    $response = [
        'success' => true,
        'note' => $note
    ];

    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error fetching note: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch note',
        'message' => $e->getMessage()
    ]);
}
