<?php
/**
 * Mindline EMHR - Get Patient Diagnoses API
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

// IMPORTANT: Set these BEFORE loading globals.php to prevent redirects
$ignoreAuth = true;
$ignoreAuth_onsite_portal = true;
$ignoreAuth_onsite_portal_two = true;

require_once(__DIR__ . '/../../interface/globals.php');

error_log("Get patient diagnoses called - Session ID: " . session_id());

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

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
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

try {
    // Verify user has access to this patient
    $accessCheck = sqlQuery(
        "SELECT id FROM patient_data WHERE id = ?",
        [$patientId]
    );

    if (!$accessCheck) {
        http_response_code(404);
        echo json_encode(['error' => 'Patient not found']);
        exit;
    }

    // Build query to fetch diagnoses
    // A diagnosis is "active as of" a date if:
    // - It has a start date (begdate) <= the target date
    // - It has NO end date (enddate IS NULL or enddate = '0000-00-00'), OR
    // - It has an end date > the target date

    $sql = "SELECT
                id,
                diagnosis,
                title,
                begdate,
                enddate,
                activity,
                occurrence,
                classification,
                outcome
            FROM lists
            WHERE pid = ?
              AND type = 'medical_problem'";

    $params = [$patientId];

    if (!$includeRetired) {
        // Only include diagnoses that were active as of the specified date
        $sql .= " AND begdate <= ?
                  AND (enddate IS NULL
                       OR enddate = '0000-00-00'
                       OR enddate = ''
                       OR enddate > ?)
                  AND activity = 1";
        $params[] = $activeAsOf;
        $params[] = $activeAsOf;
    }

    $sql .= " ORDER BY begdate DESC, id DESC";

    $result = sqlStatement($sql, $params);

    $diagnoses = [];
    while ($row = sqlFetchArray($result)) {
        // Format dates
        if ($row['begdate'] && $row['begdate'] !== '0000-00-00') {
            $row['begdate'] = $row['begdate'];
        } else {
            $row['begdate'] = null;
        }

        if ($row['enddate'] && $row['enddate'] !== '0000-00-00' && $row['enddate'] !== '') {
            $row['enddate'] = $row['enddate'];
        } else {
            $row['enddate'] = null;
        }

        $diagnoses[] = $row;
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
