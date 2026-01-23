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

    // Build SQL query - using Phase 4 schema
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
        NULL AS is_locked,
        n.signed_at,
        n.signed_by,
        NULL AS signature_data,
        n.supervisor_review_required,
        NULL AS supervisor_review_status,
        n.supervisor_reviewed_at AS supervisor_signed_at,
        n.supervisor_reviewed_by AS supervisor_signed_by,
        n.supervisor_comments,
        NULL AS parent_note_id,
        NULL AS is_addendum,
        n.amendment_reason AS addendum_reason,
        n.created_at,
        n.updated_at,
        NULL AS locked_at,
        n.last_autosave_at,
        CONCAT(p.first_name, ' ', p.last_name) AS provider_name,
        CONCAT(sb.first_name, ' ', sb.last_name) AS signed_by_name,
        CONCAT(ss.first_name, ' ', ss.last_name) AS supervisor_name,
        CONCAT(pt.first_name, ' ', pt.last_name) AS patient_name
    FROM clinical_notes n
    LEFT JOIN users p ON p.id = n.created_by
    LEFT JOIN users sb ON sb.id = n.signed_by
    LEFT JOIN users ss ON ss.id = n.supervisor_reviewed_by
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
    $note['risk_assessment'] = $note['risk_assessment'] ? json_decode($note['risk_assessment'], true) : null;
    $note['goals_addressed'] = $note['goals_addressed'] ? json_decode($note['goals_addressed'], true) : null;
    $note['interventions_selected'] = $note['interventions_selected'] ? json_decode($note['interventions_selected'], true) : null;
    $note['client_presentation'] = $note['client_presentation'] ? json_decode($note['client_presentation'], true) : null;
    $note['diagnosis_codes'] = $note['diagnosis_codes'] ? json_decode($note['diagnosis_codes'], true) : null;
    $note['mental_status_exam'] = $note['mental_status_exam'] ? json_decode($note['mental_status_exam'], true) : null;

    // Convert boolean fields
    $note['risk_present'] = (bool)($note['risk_present'] ?? false);
    $note['is_locked'] = (bool)($note['is_locked'] ?? false);
    $note['supervisor_review_required'] = (bool)($note['supervisor_review_required'] ?? false);
    $note['is_addendum'] = (bool)($note['is_addendum'] ?? false);

    // Addenda feature not yet implemented in Phase 4 schema
    $note['addenda'] = [];

    // Map snake_case to camelCase for frontend editing (NoteEditor expects camelCase)
    $note['patientId'] = $note['patient_id'];
    $note['createdBy'] = $note['created_by'];
    $note['appointmentId'] = $note['appointment_id'];
    $note['billingId'] = $note['billing_id'];
    $note['noteType'] = $note['note_type'];
    $note['templateType'] = $note['template_type'];
    $note['serviceDate'] = $note['service_date'];
    $note['serviceDuration'] = $note['service_duration'];
    $note['serviceLocation'] = $note['service_location'];
    $note['behaviorProblem'] = $note['behavior_problem'];
    $note['riskAssessment'] = $note['risk_assessment'];
    $note['riskPresent'] = $note['risk_present'];
    $note['goalsAddressed'] = $note['goals_addressed'];
    $note['interventionsSelected'] = $note['interventions_selected'];
    $note['clientPresentation'] = $note['client_presentation'];
    $note['diagnosisCodes'] = $note['diagnosis_codes'];
    $note['presentingConcerns'] = $note['presenting_concerns'];
    $note['clinicalObservations'] = $note['clinical_observations'];
    $note['mentalStatusExam'] = $note['mental_status_exam'];
    $note['symptomsReported'] = $note['symptoms_reported'];
    $note['symptomsObserved'] = $note['symptoms_observed'];
    $note['clinicalJustification'] = $note['clinical_justification'];
    $note['differentialDiagnosis'] = $note['differential_diagnosis'];
    $note['severitySpecifiers'] = $note['severity_specifiers'];
    $note['functionalImpairment'] = $note['functional_impairment'];
    $note['durationOfSymptoms'] = $note['duration_of_symptoms'];
    $note['previousDiagnoses'] = $note['previous_diagnoses'];
    $note['supervisorReviewRequired'] = $note['supervisor_review_required'];
    $note['supervisorComments'] = $note['supervisor_comments'];
    $note['isLocked'] = $note['is_locked'];
    $note['signedAt'] = $note['signed_at'];
    $note['signedBy'] = $note['signed_by'];
    $note['createdAt'] = $note['created_at'];
    $note['updatedAt'] = $note['updated_at'];

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
