<?php
/**
 * SanctumEMHR EMHR
 * Get Client Notes API - Session-based authentication (MIGRATED TO SanctumEMHR)
 * Returns all clinical notes for a client
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
use Custom\Lib\Auth\PermissionChecker;

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
    $permissionChecker = new PermissionChecker($db);

    // Get client ID from query parameter
    $clientId = $_GET['client_id'] ?? $_GET['patient_id'] ?? null;

    if (!$clientId) {
        http_response_code(400);
        echo json_encode(['error' => 'Client ID is required']);
        exit;
    }

    // Check if user can access this client
    if (!$permissionChecker->canAccessClient((int) $clientId)) {
        http_response_code(403);
        echo json_encode([
            'error' => 'Access denied',
            'message' => $permissionChecker->getAccessDeniedMessage()
        ]);
        exit;
    }

    // Check permissions - social workers can only see their own case management notes
    $canViewClinicalNotes = $permissionChecker->canViewClinicalNotes((int) $clientId);
    $canCreateCaseNotes = $permissionChecker->canCreateCaseNotes((int) $clientId);
    $isSocialWorker = $permissionChecker->isSocialWorker() && !$permissionChecker->isProvider();
    $currentUserId = $session->getUserId();

    // If user can't view clinical notes AND can't create case notes, deny access
    if (!$canViewClinicalNotes && !$canCreateCaseNotes) {
        http_response_code(403);
        echo json_encode([
            'error' => 'Access denied',
            'message' => 'You do not have permission to view notes for this client.'
        ]);
        exit;
    }

    // Optional filters
    $noteType = $_GET['note_type'] ?? null;
    $status = $_GET['status'] ?? null;
    $startDate = $_GET['start_date'] ?? null;
    $endDate = $_GET['end_date'] ?? null;

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
        n.status,
        NULL AS is_locked,
        n.signed_at,
        n.signed_by,
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
        CONCAT(p.first_name, ' ', p.last_name) AS provider_name,
        CONCAT(sb.first_name, ' ', sb.last_name) AS signed_by_name,
        CONCAT(sup.first_name, ' ', sup.last_name) AS supervisor_name
    FROM clinical_notes n
    LEFT JOIN users p ON p.id = n.created_by
    LEFT JOIN users sb ON sb.id = n.signed_by
    LEFT JOIN users sup ON sup.id = n.supervisor_reviewed_by
    WHERE n.patient_id = ?";

    $params = [$clientId];

    // Social workers can only see their own case management notes
    if ($isSocialWorker && !$canViewClinicalNotes) {
        $sql .= " AND n.note_type = 'case_management' AND n.created_by = ?";
        $params[] = $currentUserId;
    }

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
        'patient_id' => $clientId,
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
    error_log("Error fetching client notes: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch client notes',
        'message' => $e->getMessage()
    ]);
}
