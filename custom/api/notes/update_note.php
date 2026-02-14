<?php
/**
 * SanctumEMHR EMHR
 * Update Note API - Session-based authentication (MIGRATED TO SanctumEMHR)
 * Updates an existing clinical note
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
use Custom\Lib\Audit\AuditLogger;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'POST'])) {
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

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    // Validate required fields
    if (!isset($input['noteId']) || $input['noteId'] === '') {
        throw new Exception("Missing required field: noteId");
    }

    $noteId = intval($input['noteId']);

    // First, check if note exists and is not signed (Phase 4: no is_locked column)
    $checkSql = "SELECT id, status, created_by, signed_at, patient_id FROM clinical_notes WHERE id = ?";
    $existingNote = $db->query($checkSql, [$noteId]);

    if (!$existingNote) {
        throw new Exception("Note not found");
    }

    // Check if note is signed (Phase 4: signed notes cannot be updated)
    if ($existingNote['status'] === 'signed' || !empty($existingNote['signed_at'])) {
        throw new Exception("Cannot update signed note. Create an addendum instead.");
    }

    // Build UPDATE query dynamically based on provided fields
    $updateFields = [];
    $params = [];

    // Optional updatable fields (non-JSON, non-boolean)
    $updatableFields = [
        'noteType' => 'note_type',
        'templateType' => 'template_type',
        'serviceDate' => 'service_date',
        'serviceDuration' => 'service_duration',
        'serviceLocation' => 'service_location',
        'behaviorProblem' => 'behavior_problem',
        'intervention' => 'intervention',
        'response' => 'response',
        'plan' => 'plan',
        'presentingConcerns' => 'presenting_concerns',
        'clinicalObservations' => 'clinical_observations',
        // Diagnosis note fields (Phase 4B) - using snake_case to match frontend
        'symptoms_reported' => 'symptoms_reported',
        'symptoms_observed' => 'symptoms_observed',
        'clinical_justification' => 'clinical_justification',
        'differential_diagnosis' => 'differential_diagnosis',
        'severity_specifiers' => 'severity_specifiers',
        'functional_impairment' => 'functional_impairment',
        'duration_of_symptoms' => 'duration_of_symptoms',
        'previous_diagnoses' => 'previous_diagnoses'
    ];

    foreach ($updatableFields as $inputKey => $dbField) {
        if (array_key_exists($inputKey, $input)) {
            $updateFields[] = "$dbField = ?";
            $params[] = $input[$inputKey];
        }
    }

    // Handle JSON field: riskAssessment
    if (isset($input['riskAssessment'])) {
        $updateFields[] = "risk_assessment = ?";
        if ($input['riskAssessment'] === '' || $input['riskAssessment'] === null) {
            $params[] = null;
        } else if (is_array($input['riskAssessment']) || is_object($input['riskAssessment'])) {
            $params[] = json_encode($input['riskAssessment']);
        } else if (is_string($input['riskAssessment'])) {
            $decoded = json_decode($input['riskAssessment']);
            if (json_last_error() === JSON_ERROR_NONE) {
                $params[] = $input['riskAssessment'];
            } else {
                $params[] = null;
            }
        } else {
            $params[] = null;
        }
    }

    // Handle JSON field: mentalStatusExam
    if (isset($input['mentalStatusExam'])) {
        $updateFields[] = "mental_status_exam = ?";
        if ($input['mentalStatusExam'] === '' || $input['mentalStatusExam'] === null) {
            $params[] = null;
        } else if (is_array($input['mentalStatusExam']) || is_object($input['mentalStatusExam'])) {
            $params[] = json_encode($input['mentalStatusExam']);
        } else if (is_string($input['mentalStatusExam'])) {
            $decoded = json_decode($input['mentalStatusExam']);
            if (json_last_error() === JSON_ERROR_NONE) {
                $params[] = $input['mentalStatusExam'];
            } else {
                $params[] = null;
            }
        } else {
            $params[] = null;
        }
    }

    // Boolean fields - convert to integer for MySQL
    if (isset($input['riskPresent'])) {
        $updateFields[] = "risk_present = ?";
        $riskPresent = 0;
        if ($input['riskPresent'] !== '' && $input['riskPresent'] !== null) {
            $riskPresent = ($input['riskPresent'] === true || $input['riskPresent'] === 'true' || $input['riskPresent'] === 1 || $input['riskPresent'] === '1') ? 1 : 0;
        }
        $params[] = $riskPresent;
    }

    if (isset($input['supervisorReviewRequired'])) {
        $updateFields[] = "supervisor_review_required = ?";
        $supervisorReviewRequired = 0;
        if ($input['supervisorReviewRequired'] !== '' && $input['supervisorReviewRequired'] !== null) {
            $supervisorReviewRequired = ($input['supervisorReviewRequired'] === true || $input['supervisorReviewRequired'] === 'true' || $input['supervisorReviewRequired'] === 1 || $input['supervisorReviewRequired'] === '1') ? 1 : 0;
        }
        $params[] = $supervisorReviewRequired;
    }

    // JSON fields - must be valid JSON or NULL
    if (isset($input['goalsAddressed'])) {
        $updateFields[] = "goals_addressed = ?";
        if ($input['goalsAddressed'] === '' || $input['goalsAddressed'] === null) {
            $params[] = null;
        } else if (is_array($input['goalsAddressed']) || is_object($input['goalsAddressed'])) {
            $params[] = json_encode($input['goalsAddressed']);
        } else if (is_string($input['goalsAddressed'])) {
            $decoded = json_decode($input['goalsAddressed']);
            if (json_last_error() === JSON_ERROR_NONE) {
                $params[] = $input['goalsAddressed'];
            } else {
                $params[] = null;
            }
        } else {
            $params[] = null;
        }
    }

    if (isset($input['interventionsSelected'])) {
        $updateFields[] = "interventions_selected = ?";
        if ($input['interventionsSelected'] === '' || $input['interventionsSelected'] === null) {
            $params[] = null;
        } else if (is_array($input['interventionsSelected']) || is_object($input['interventionsSelected'])) {
            $params[] = json_encode($input['interventionsSelected']);
        } else if (is_string($input['interventionsSelected'])) {
            $decoded = json_decode($input['interventionsSelected']);
            if (json_last_error() === JSON_ERROR_NONE) {
                $params[] = $input['interventionsSelected'];
            } else {
                $params[] = null;
            }
        } else {
            $params[] = null;
        }
    }

    if (isset($input['clientPresentation'])) {
        $updateFields[] = "client_presentation = ?";
        if ($input['clientPresentation'] === '' || $input['clientPresentation'] === null) {
            $params[] = null;
        } else if (is_array($input['clientPresentation']) || is_object($input['clientPresentation'])) {
            $params[] = json_encode($input['clientPresentation']);
        } else if (is_string($input['clientPresentation'])) {
            $decoded = json_decode($input['clientPresentation']);
            if (json_last_error() === JSON_ERROR_NONE) {
                $params[] = $input['clientPresentation'];
            } else {
                $params[] = null;
            }
        } else {
            $params[] = null;
        }
    }

    // diagnosis_codes - may be string (from frontend) or array (from loaded note)
    if (isset($input['diagnosis_codes'])) {
        $updateFields[] = "diagnosis_codes = ?";
        if ($input['diagnosis_codes'] === '' || $input['diagnosis_codes'] === null) {
            $params[] = null;
        } else if (is_array($input['diagnosis_codes']) || is_object($input['diagnosis_codes'])) {
            $params[] = json_encode($input['diagnosis_codes']);
        } else if (is_string($input['diagnosis_codes'])) {
            $decoded = json_decode($input['diagnosis_codes']);
            if (json_last_error() === JSON_ERROR_NONE) {
                $params[] = $input['diagnosis_codes'];
            } else {
                $params[] = null;
            }
        } else {
            $params[] = null;
        }
    }

    // Status update
    if (isset($input['status'])) {
        $updateFields[] = "status = ?";
        $params[] = $input['status'];
    }

    // Always update last_autosave_at
    $updateFields[] = "last_autosave_at = NOW()";

    if (empty($updateFields)) {
        throw new Exception("No fields to update");
    }

    // Add note ID to params
    $params[] = $noteId;

    // Build and execute UPDATE query
    $sql = "UPDATE clinical_notes SET " . implode(', ', $updateFields) . " WHERE id = ?";

    $db->execute($sql, $params);

    // Audit log: note edit
    $auditLogger = new AuditLogger($db, $session);
    $auditLogger->logEditNote($noteId, $existingNote['patient_id'], 'note_update');

    $response = [
        'success' => true,
        'noteId' => $noteId,
        'message' => 'Note updated successfully'
    ];

    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error updating note: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to update note',
        'message' => $e->getMessage()
    ]);
}
