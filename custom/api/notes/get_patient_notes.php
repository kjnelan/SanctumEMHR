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

    // Build SQL query with optional filters
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
        n.status,
        n.is_locked,
        n.signed_at,
        n.signed_by,
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
        CONCAT(p.first_name, ' ', p.last_name) AS provider_name,
        CONCAT(sb.first_name, ' ', sb.last_name) AS signed_by_name,
        CONCAT(ss.first_name, ' ', ss.last_name) AS supervisor_name
    FROM clinical_notes n
    LEFT JOIN users p ON p.id = n.created_by
    LEFT JOIN users sb ON sb.id = n.signed_by
    LEFT JOIN users ss ON ss.id = n.supervisor_signed_by
    WHERE n.patient_id = ?";

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
        $sql .= " AND n.service_date >= ?";
        $params[] = $startDate;
    }

    if ($endDate) {
        $sql .= " AND n.service_date <= ?";
        $params[] = $endDate;
    }

    // Order by service date descending (most recent first)
    $sql .= " ORDER BY n.service_date DESC, n.created_at DESC";

    $rows = $db->queryAll($sql, $params);
    $notes = [];

    foreach ($rows as $row) {
        // Decode JSON fields
        $row['goals_addressed'] = $row['goals_addressed'] ? json_decode($row['goals_addressed'], true) : null;
        $row['interventions_selected'] = $row['interventions_selected'] ? json_decode($row['interventions_selected'], true) : null;
        $row['client_presentation'] = $row['client_presentation'] ? json_decode($row['client_presentation'], true) : null;
        $row['diagnosis_codes'] = $row['diagnosis_codes'] ? json_decode($row['diagnosis_codes'], true) : null;

        // Convert boolean fields
        $row['risk_present'] = (bool)$row['risk_present'];
        $row['is_locked'] = (bool)$row['is_locked'];
        $row['supervisor_review_required'] = (bool)$row['supervisor_review_required'];
        $row['is_addendum'] = (bool)$row['is_addendum'];

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
