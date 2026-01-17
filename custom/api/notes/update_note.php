<?php
/**
 * Mindline EMHR
 * Update Note API - Session-based authentication (MIGRATED TO MINDLINE)
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

    // First, check if note exists and is not locked
    $checkSql = "SELECT id, is_locked, status, created_by FROM clinical_notes WHERE id = ?";
    $existingNote = $db->query($checkSql, [$noteId]);

    if (!$existingNote) {
        throw new Exception("Note not found");
    }

    // Check if note is locked
    if ($existingNote['is_locked']) {
        throw new Exception("Cannot update locked note. Create an addendum instead.");
    }

    // Build UPDATE query dynamically based on provided fields
    $updateFields = [];
    $params = [];

    // Optional updatable fields
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
        'riskAssessment' => 'risk_assessment',
        'presentingConcerns' => 'presenting_concerns',
        'clinicalObservations' => 'clinical_observations',
        'mentalStatusExam' => 'mental_status_exam',
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

    // Boolean fields
    if (isset($input['riskPresent'])) {
        $updateFields[] = "risk_present = ?";
        $params[] = boolval($input['riskPresent']);
    }

    if (isset($input['supervisorReviewRequired'])) {
        $updateFields[] = "supervisor_review_required = ?";
        $params[] = boolval($input['supervisorReviewRequired']);
    }

    // JSON fields
    if (isset($input['goalsAddressed'])) {
        $updateFields[] = "goals_addressed = ?";
        $params[] = json_encode($input['goalsAddressed']);
    }

    if (isset($input['interventionsSelected'])) {
        $updateFields[] = "interventions_selected = ?";
        $params[] = json_encode($input['interventionsSelected']);
    }

    if (isset($input['clientPresentation'])) {
        $updateFields[] = "client_presentation = ?";
        $params[] = json_encode($input['clientPresentation']);
    }

    // diagnosis_codes - may be string (from frontend) or array (from loaded note)
    if (isset($input['diagnosis_codes'])) {
        $updateFields[] = "diagnosis_codes = ?";
        // If it's already a string, use as-is. If it's an array, encode it.
        $params[] = is_string($input['diagnosis_codes'])
            ? $input['diagnosis_codes']
            : json_encode($input['diagnosis_codes']);
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
