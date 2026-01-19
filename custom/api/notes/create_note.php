<?php
/**
 * Mindline EMHR
 * Create Clinical Note API - Session-based authentication (MIGRATED TO MINDLINE)
 * Creates a new clinical note
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
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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

    $providerId = $session->getUserId();
    $db = Database::getInstance();

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    // Validate required fields
    $required = ['patientId', 'noteType', 'serviceDate'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || $input[$field] === '') {
            throw new Exception("Missing required field: $field");
        }
    }

    // Extract inputs
    $patientId = intval($input['patientId']);
    $noteType = $input['noteType']; // 'progress', 'intake', 'crisis', 'discharge', 'admin', 'mse', 'treatment_plan'
    $serviceDate = $input['serviceDate']; // YYYY-MM-DD format

    // Optional fields
    $appointmentId = isset($input['appointmentId']) ? intval($input['appointmentId']) : null;
    $billingId = isset($input['billingId']) ? intval($input['billingId']) : null;
    $templateType = $input['templateType'] ?? 'BIRP'; // BIRP, PIRP, SOAP, custom
    $serviceDuration = isset($input['serviceDuration']) ? intval($input['serviceDuration']) : null;
    $serviceLocation = $input['serviceLocation'] ?? null;

    // BIRP/PIRP content (all nullable)
    $behaviorProblem = $input['behaviorProblem'] ?? null;
    $intervention = $input['intervention'] ?? null;
    $response = $input['response'] ?? null;
    $plan = $input['plan'] ?? null;

    // Risk assessment - convert to integer for MySQL
    $riskPresent = 0;
    if (isset($input['riskPresent']) && $input['riskPresent'] !== '' && $input['riskPresent'] !== null) {
        $riskPresent = ($input['riskPresent'] === true || $input['riskPresent'] === 'true' || $input['riskPresent'] === 1 || $input['riskPresent'] === '1') ? 1 : 0;
    }
    $riskAssessment = $input['riskAssessment'] ?? null;

    // JSON fields - diagnosis_codes already JSON stringified by frontend
    $goalsAddressed = isset($input['goalsAddressed']) ? json_encode($input['goalsAddressed']) : null;
    $interventionsSelected = isset($input['interventionsSelected']) ? json_encode($input['interventionsSelected']) : null;
    $clientPresentation = isset($input['clientPresentation']) ? json_encode($input['clientPresentation']) : null;
    $diagnosisCodes = $input['diagnosis_codes'] ?? null; // Already stringified by frontend, don't encode again

    // Free-form fields
    $presentingConcerns = $input['presentingConcerns'] ?? null;
    $clinicalObservations = $input['clinicalObservations'] ?? null;
    $mentalStatusExam = $input['mentalStatusExam'] ?? null;

    // Diagnosis note fields (Phase 4B)
    $symptomsReported = $input['symptoms_reported'] ?? null;
    $symptomsObserved = $input['symptoms_observed'] ?? null;
    $clinicalJustification = $input['clinical_justification'] ?? null;
    $differentialDiagnosis = $input['differential_diagnosis'] ?? null;
    $severitySpecifiers = $input['severity_specifiers'] ?? null;
    $functionalImpairment = $input['functional_impairment'] ?? null;
    $durationOfSymptoms = $input['duration_of_symptoms'] ?? null;
    $previousDiagnoses = $input['previous_diagnoses'] ?? null;

    // Supervision - convert to integer for MySQL
    $supervisorReviewRequired = 0;
    if (isset($input['supervisorReviewRequired']) && $input['supervisorReviewRequired'] !== '' && $input['supervisorReviewRequired'] !== null) {
        $supervisorReviewRequired = ($input['supervisorReviewRequired'] === true || $input['supervisorReviewRequired'] === 'true' || $input['supervisorReviewRequired'] === 1 || $input['supervisorReviewRequired'] === '1') ? 1 : 0;
    }

    // Generate UUID for API security
    $noteUuid = sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );

    // Insert note
    $sql = "INSERT INTO clinical_notes (
        note_uuid,
        patient_id,
        created_by,
        appointment_id,
        billing_id,
        note_type,
        template_type,
        service_date,
        service_duration,
        service_location,
        behavior_problem,
        intervention,
        response,
        plan,
        risk_assessment,
        risk_present,
        goals_addressed,
        interventions_selected,
        client_presentation,
        diagnosis_codes,
        presenting_concerns,
        clinical_observations,
        mental_status_exam,
        symptoms_reported,
        symptoms_observed,
        clinical_justification,
        differential_diagnosis,
        severity_specifiers,
        functional_impairment,
        duration_of_symptoms,
        previous_diagnoses,
        supervisor_review_required,
        status,
        last_autosave_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', NOW())";

    $params = [
        $noteUuid,
        $patientId,
        $providerId,
        $appointmentId,
        $billingId,
        $noteType,
        $templateType,
        $serviceDate,
        $serviceDuration,
        $serviceLocation,
        $behaviorProblem,
        $intervention,
        $response,
        $plan,
        $riskAssessment,
        $riskPresent,
        $goalsAddressed,
        $interventionsSelected,
        $clientPresentation,
        $diagnosisCodes,
        $presentingConcerns,
        $clinicalObservations,
        $mentalStatusExam,
        $symptomsReported,
        $symptomsObserved,
        $clinicalJustification,
        $differentialDiagnosis,
        $severitySpecifiers,
        $functionalImpairment,
        $durationOfSymptoms,
        $previousDiagnoses,
        $supervisorReviewRequired
    ];

    $noteId = $db->insert($sql, $params);

    if (!$noteId) {
        throw new Exception("Failed to create note - could not retrieve ID");
    }

    // If this note is linked to an appointment, update the appointment's clinical_note_id
    if ($appointmentId) {
        $updateApptSql = "UPDATE appointments SET clinical_note_id = ? WHERE id = ?";
        $db->execute($updateApptSql, [$noteId, $appointmentId]);
    }

    // Return the created note
    $response = [
        'success' => true,
        'noteId' => $noteId,
        'noteUuid' => $noteUuid,
        'message' => 'Clinical note created successfully'
    ];

    http_response_code(201);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error creating note: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to create note',
        'message' => $e->getMessage()
    ]);
}
