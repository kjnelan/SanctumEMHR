<?php
/**
 * Mindline EMHR
 * Get Note API - Session-based authentication (MIGRATED TO MINDLINE)
 * Returns a specific clinical note by ID or UUID
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

require_once(__DIR__ . '/../../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $db = Database::getInstance();

    // Get note ID or UUID from query parameter
    $noteId = $_GET['note_id'] ?? null;
    $noteUuid = $_GET['note_uuid'] ?? null;

    if (!$noteId && !$noteUuid) {
        http_response_code(400);
        echo json_encode(['error' => 'Note ID or UUID is required']);
        exit;
    }

    // Build SQL query
    $sql = "SELECT
        n.id,
        n.note_uuid,
        n.patient_id,
        n.created_by,
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
        n.symptoms_reported,
        n.symptoms_observed,
        n.clinical_justification,
        n.differential_diagnosis,
        n.severity_specifiers,
        n.functional_impairment,
        n.duration_of_symptoms,
        n.previous_diagnoses,
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
        CONCAT(p.first_name, ' ', p.last_name) AS provider_name,
        CONCAT(sb.first_name, ' ', sb.last_name) AS signed_by_name,
        CONCAT(ss.first_name, ' ', ss.last_name) AS supervisor_name,
        CONCAT(pt.first_name, ' ', pt.last_name) AS patient_name
    FROM clinical_notes n
    LEFT JOIN users p ON p.id = n.created_by
    LEFT JOIN users sb ON sb.id = n.signed_by
    LEFT JOIN users ss ON ss.id = n.supervisor_signed_by
    LEFT JOIN clients pt ON pt.id = n.patient_id
    WHERE ";

    $params = [];

    if ($noteId) {
        $sql .= "n.id = ?";
        $params[] = intval($noteId);
    } else {
        $sql .= "n.note_uuid = ?";
        $params[] = $noteUuid;
    }

    $note = $db->query($sql, $params);

    if (!$note) {
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
        CONCAT(u.first_name, ' ', u.last_name) AS provider_name
    FROM clinical_notes n
    LEFT JOIN users u ON u.id = n.created_by
    WHERE n.parent_note_id = ? AND n.is_addendum = 1
    ORDER BY n.created_at DESC";

    $addenda = $db->queryAll($addendaSql, [$note['id']]);
    $note['addenda'] = $addenda;

    $response = [
        'success' => true,
        'note' => $note
    ];

    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error fetching note: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch note',
        'message' => $e->getMessage()
    ]);
}
