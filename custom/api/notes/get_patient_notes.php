<?php
/**
 * Mindline EMHR
 * Get Patient Notes API - Session-based authentication (MIGRATED TO MINDLINE)
 * Returns all clinical notes for a patient
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

    // Get patient ID from query parameter
    $patientId = $_GET['patient_id'] ?? null;

    if (!$patientId) {
        http_response_code(400);
        echo json_encode(['error' => 'Patient ID is required']);
        exit;
    }

    // Optional filters
    $noteType = $_GET['note_type'] ?? null;
    $status = $_GET['status'] ?? null;
    $startDate = $_GET['start_date'] ?? null;
    $endDate = $_GET['end_date'] ?? null;

    // Build SQL query with optional filters - mapped to Mindline schema
    $sql = "SELECT
        n.id,
        n.id AS note_uuid,
        n.client_id AS patient_id,
        n.provider_id AS created_by,
        n.encounter_id AS appointment_id,
        NULL AS billing_id,
        n.note_type,
        n.note_type AS template_type,
        e.encounter_date AS service_date,
        NULL AS service_duration,
        f.name AS service_location,
        n.subjective AS behavior_problem,
        n.treatment_interventions AS intervention,
        n.objective AS response,
        n.plan,
        n.risk_assessment,
        NULL AS risk_present,
        n.treatment_goals AS goals_addressed,
        n.treatment_interventions AS interventions_selected,
        NULL AS client_presentation,
        n.billing_codes AS diagnosis_codes,
        n.subjective AS presenting_concerns,
        n.objective AS clinical_observations,
        n.mental_status_exam,
        n.status,
        NULL AS is_locked,
        n.signed_at,
        n.signed_by,
        NULL AS supervisor_review_required,
        NULL AS supervisor_review_status,
        NULL AS supervisor_signed_at,
        NULL AS supervisor_signed_by,
        NULL AS supervisor_comments,
        NULL AS parent_note_id,
        NULL AS is_addendum,
        n.amendment_reason AS addendum_reason,
        n.created_at,
        n.updated_at,
        NULL AS locked_at,
        CONCAT(p.first_name, ' ', p.last_name) AS provider_name,
        CONCAT(sb.first_name, ' ', sb.last_name) AS signed_by_name,
        NULL AS supervisor_name
    FROM clinical_notes n
    LEFT JOIN users p ON p.id = n.provider_id
    LEFT JOIN users sb ON sb.id = n.signed_by
    LEFT JOIN encounters e ON e.id = n.encounter_id
    LEFT JOIN facilities f ON f.id = e.facility_id
    WHERE n.client_id = ?";

    $params = [$patientId];

    // Add optional filters
    if ($noteType) {
        $sql .= " AND n.note_type = ?";
        $params[] = $noteType;
    }

    if ($status) {
        $sql .= " AND n.status = ?";
        $params[] = $status;
    }

    if ($startDate) {
        $sql .= " AND e.encounter_date >= ?";
        $params[] = $startDate;
    }

    if ($endDate) {
        $sql .= " AND e.encounter_date <= ?";
        $params[] = $endDate;
    }

    // Order by created date descending (most recent first)
    $sql .= " ORDER BY n.created_at DESC";

    $rows = $db->queryAll($sql, $params);
    $notes = [];

    foreach ($rows as $row) {
        // Decode JSON fields
        $row['goals_addressed'] = $row['goals_addressed'] ? json_decode($row['goals_addressed'], true) : null;
        $row['interventions_selected'] = $row['interventions_selected'] ? json_decode($row['interventions_selected'], true) : null;
        $row['client_presentation'] = $row['client_presentation'] ? json_decode($row['client_presentation'], true) : null;
        $row['diagnosis_codes'] = $row['diagnosis_codes'] ? json_decode($row['diagnosis_codes'], true) : null;
        $row['intervention'] = $row['intervention'] ? json_decode($row['intervention'], true) : null;
        $row['risk_assessment'] = $row['risk_assessment'] ? json_decode($row['risk_assessment'], true) : null;
        $row['mental_status_exam'] = $row['mental_status_exam'] ? json_decode($row['mental_status_exam'], true) : null;

        // Convert boolean fields
        $row['risk_present'] = (bool)($row['risk_present'] ?? false);
        $row['is_locked'] = (bool)($row['is_locked'] ?? false);
        $row['supervisor_review_required'] = (bool)($row['supervisor_review_required'] ?? false);
        $row['is_addendum'] = (bool)($row['is_addendum'] ?? false);

        $notes[] = $row;
    }

    // Build response
    $response = [
        'success' => true,
        'patient_id' => $patientId,
        'notes' => $notes,
        'total_count' => count($notes),
        'filters' => [
            'note_type' => $noteType,
            'status' => $status,
            'start_date' => $startDate,
            'end_date' => $endDate
        ]
    ];

    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error fetching patient notes: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch patient notes',
        'message' => $e->getMessage()
    ]);
}
