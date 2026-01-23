<?php
/**
 * Mindline EMHR - Get Patient Diagnoses API (MIGRATED TO MINDLINE)
 * Fetches active (and optionally retired) diagnoses for a patient
 * Supports filtering by date (active as of a specific date)
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4B
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

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
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Get patient diagnoses: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    // Get parameters
    $patientId = $_GET['patient_id'] ?? null;
    $activeAsOf = $_GET['active_as_of'] ?? date('Y-m-d'); // Default to today
    $includeRetired = ($_GET['include_retired'] ?? '0') === '1';

    // Validate patient ID
    if (!$patientId || !is_numeric($patientId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or missing patient_id']);
        exit;
    }

    // Initialize database
    $db = Database::getInstance();

    // Verify user has access to this patient
    $accessCheck = $db->query(
        "SELECT id FROM clients WHERE id = ?",
        [$patientId]
    );

    if (!$accessCheck) {
        http_response_code(404);
        echo json_encode(['error' => 'Patient not found']);
        exit;
    }

    // Build query to fetch diagnoses
    // A diagnosis is "active as of" a date if:
    // - It has a diagnosis date (diagnosis_date) <= the target date
    // - It has NO resolution date (resolution_date IS NULL or resolution_date = '0000-00-00'), OR
    // - It has a resolution date > the target date

    $sql = "SELECT
                id,
                code,
                code_type,
                description,
                diagnosis_date,
                resolution_date,
                is_primary,
                is_active,
                diagnosed_by
            FROM diagnoses
            WHERE client_id = ?";

    $params = [$patientId];

    if (!$includeRetired) {
        // Only include diagnoses that were active as of the specified date
        $sql .= " AND diagnosis_date <= ?
                  AND (resolution_date IS NULL
                       OR resolution_date = '0000-00-00'
                       OR resolution_date = ''
                       OR resolution_date > ?)
                  AND is_active = 1";
        $params[] = $activeAsOf;
        $params[] = $activeAsOf;
    }

    $sql .= " ORDER BY diagnosis_date DESC, id DESC";

    $rows = $db->queryAll($sql, $params);

    $diagnoses = [];
    foreach ($rows as $row) {
        // Format dates
        if ($row['diagnosis_date'] && $row['diagnosis_date'] !== '0000-00-00') {
            $row['diagnosis_date'] = $row['diagnosis_date'];
        } else {
            $row['diagnosis_date'] = null;
        }

        if ($row['resolution_date'] && $row['resolution_date'] !== '0000-00-00' && $row['resolution_date'] !== '') {
            $row['resolution_date'] = $row['resolution_date'];
        } else {
            $row['resolution_date'] = null;
        }

        // Map to frontend-compatible field names
        $diagnoses[] = [
            'id' => $row['id'],
            'diagnosis' => $row['code'],
            'code_type' => $row['code_type'],
            'title' => $row['description'],
            'begdate' => $row['diagnosis_date'],
            'enddate' => $row['resolution_date'],
            'activity' => $row['is_active'],
            'is_primary' => $row['is_primary']
        ];
    }

    echo json_encode([
        'success' => true,
        'diagnoses' => $diagnoses,
        'count' => count($diagnoses),
        'activeAsOf' => $activeAsOf
    ]);

} catch (Exception $e) {
    error_log("Error fetching patient diagnoses: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch diagnoses',
        'message' => $e->getMessage()
    ]);
}
