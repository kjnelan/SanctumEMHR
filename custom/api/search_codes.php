<?php
/**
 * Mindline EMHR
 * Search Codes API - Session-based authentication (MIGRATED TO MINDLINE)
 * Returns diagnosis codes (ICD-10) and procedure codes (CPT) from codes table
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
    error_log("Search codes: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Search codes: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    // Get search parameters
    $search = $_GET['search'] ?? '';
    $codeType = $_GET['code_type'] ?? 'ICD10';
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;

    // Validate limit
    if ($limit < 1 || $limit > 200) {
        $limit = 50;
    }

    // Validate code type
    $validCodeTypes = ['ICD10', 'ICD9', 'CPT4', 'HCPCS', 'SNOMED-CT'];
    if (!in_array($codeType, $validCodeTypes)) {
        error_log("Search codes: Invalid code type - " . $codeType);
        http_response_code(400);
        echo json_encode(['error' => 'Invalid code type']);
        exit;
    }

    error_log("Search codes: User authenticated - " . $session->getUserId() . ", searching for: " . $search . ", code type: " . $codeType);

    // Initialize database
    $db = Database::getInstance();

    // Build SQL query
    // The codes table structure:
    // - code_type: 'ICD10', 'CPT4', etc.
    // - code: The actual code (e.g., 'F41.1')
    // - code_text: Description
    // - active: 1 or 0

    $sql = "SELECT
        code,
        code_text,
        code_type,
        active
    FROM codes
    WHERE code_type = ?
    AND active = 1";

    $params = [$codeType];

    // Add search filter if provided
    if (!empty($search)) {
        $sql .= " AND (
            code LIKE ? OR
            code_text LIKE ?
        )";
        $searchParam = "%$search%";
        $params[] = $searchParam;
        $params[] = $searchParam;
    }

    // Order by relevance: exact code match first, then alphabetically
    if (!empty($search)) {
        $sql .= " ORDER BY
            CASE
                WHEN code = ? THEN 0
                WHEN code LIKE ? THEN 1
                WHEN code_text LIKE ? THEN 2
                ELSE 3
            END,
            code ASC";
        $params[] = $search;
        $params[] = "$search%";
        $params[] = "$search%";
    } else {
        $sql .= " ORDER BY code ASC";
    }

    $sql .= " LIMIT ?";
    $params[] = $limit;

    error_log("Search codes SQL: " . $sql);
    error_log("Params: " . print_r($params, true));

    $rows = $db->queryAll($sql, $params);
    $codes = [];

    foreach ($rows as $row) {
        $codes[] = [
            'code' => $row['code'],
            'description' => $row['code_text'],
            'code_type' => $row['code_type'],
            'active' => (bool)$row['active']
        ];
    }

    error_log("Found " . count($codes) . " codes");

    $response = [
        'success' => true,
        'codes' => $codes,
        'count' => count($codes),
        'search_term' => $search,
        'code_type' => $codeType
    ];

    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error searching codes: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to search codes',
        'message' => $e->getMessage()
    ]);
}
