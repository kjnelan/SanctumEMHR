<?php
/**
 * Mindline EMHR
 * Get Treatment Goals API - Session-based authentication (MIGRATED TO MINDLINE)
 * Returns treatment goals for a patient
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

    $patientId = $_GET['patient_id'] ?? null;

    if (!$patientId) {
        http_response_code(400);
        echo json_encode(['error' => 'Patient ID is required']);
        exit;
    }

    $status = $_GET['status'] ?? 'active';
    $includeAll = isset($_GET['include_all']) ? boolval($_GET['include_all']) : false;

    $sql = "SELECT
        g.id,
        g.patient_id,
        g.provider_id,
        g.goal_text,
        g.goal_category,
        g.target_date,
        g.status,
        g.progress_level,
        g.created_at,
        g.updated_at,
        g.achieved_at,
        g.discontinued_at,
        CONCAT(p.first_name, ' ', p.last_name) AS provider_name
    FROM treatment_goals g
    LEFT JOIN users p ON p.id = g.provider_id
    WHERE g.patient_id = ?";

    $params = [$patientId];

    if (!$includeAll && $status) {
        $sql .= " AND g.status = ?";
        $params[] = $status;
    }

    $sql .= " ORDER BY
        CASE g.status
            WHEN 'active' THEN 1
            WHEN 'achieved' THEN 2
            WHEN 'revised' THEN 3
            WHEN 'discontinued' THEN 4
            ELSE 5
        END,
        g.target_date ASC,
        g.created_at DESC";

    $goals = $db->queryAll($sql, $params);

    $grouped = [
        'active' => [],
        'achieved' => [],
        'revised' => [],
        'discontinued' => []
    ];

    foreach ($goals as $goal) {
        $goalStatus = $goal['status'];
        if (isset($grouped[$goalStatus])) {
            $grouped[$goalStatus][] = $goal;
        }
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'patient_id' => $patientId,
        'goals' => $goals,
        'grouped' => $grouped,
        'total_count' => count($goals),
        'active_count' => count($grouped['active'])
    ]);

} catch (Exception $e) {
    error_log("Error fetching treatment goals: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch treatment goals',
        'message' => $e->getMessage()
    ]);
}
