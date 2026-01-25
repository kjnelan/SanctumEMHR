<?php
/**
 * SanctumEMHR EMHR
 * Get Appointment Categories API - Session-based authentication (MIGRATED TO SanctumEMHR)
 * Returns list of active appointment categories/types
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
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
    error_log("Get appointment categories: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Get appointment categories: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    error_log("Get appointment categories: User authenticated - " . $session->getUserId());

    // Initialize database
    $db = Database::getInstance();

    // Get optional category type filter from query parameter
    // type can be: 'client', 'clinic', 'holiday', or null/0 for all
    $categoryType = isset($_GET['type']) ? $_GET['type'] : null;

    // Normalize type=0 or empty string to null (show all)
    if ($categoryType === '0' || $categoryType === 0 || $categoryType === '') {
        $categoryType = null;
    }

    // Get optional exclude parameter to filter out certain category types
    // exclude can be: 'holiday' to exclude vacation/out of office categories
    $excludeType = isset($_GET['exclude']) ? $_GET['exclude'] : null;

    error_log("Get appointment categories (type: " . ($categoryType ?? 'all') . ", exclude: " . ($excludeType ?? 'none') . ")");

    // Fetch all active appointment categories with new billing fields
    $sql = "SELECT
        id,
        name,
        color,
        description,
        default_duration,
        is_billable,
        category_type,
        requires_cpt_selection,
        blocks_availability,
        sort_order
    FROM appointment_categories
    WHERE is_active = 1";

    $params = [];

    // Add category type filter if provided and valid
    if ($categoryType !== null && in_array($categoryType, ['client', 'clinic', 'holiday'])) {
        $sql .= " AND category_type = ?";
        $params[] = $categoryType;
    }

    // Exclude certain category types if specified
    if ($excludeType !== null && in_array($excludeType, ['client', 'clinic', 'holiday'])) {
        $sql .= " AND category_type != ?";
        $params[] = $excludeType;
    }

    $sql .= " ORDER BY sort_order, name";

    error_log("Get appointment categories SQL: " . $sql);
    $rows = $db->queryAll($sql, $params);

    $categories = [];
    foreach ($rows as $row) {
        // Fetch linked CPT codes for this category
        $linkedCptCodes = [];
        if ($row['requires_cpt_selection'] == 1) {
            $cptSql = "SELECT
                c.id,
                c.code,
                c.description,
                c.standard_duration_minutes,
                c.standard_fee,
                c.is_addon,
                cc.is_default
            FROM category_cpt_codes cc
            INNER JOIN cpt_codes c ON cc.cpt_code_id = c.id
            WHERE cc.category_id = ? AND c.is_active = 1
            ORDER BY cc.is_default DESC, c.code";

            $cptRows = $db->queryAll($cptSql, [$row['id']]);

            foreach ($cptRows as $cptRow) {
                $linkedCptCodes[] = [
                    'id' => $cptRow['id'],
                    'code' => $cptRow['code'],
                    'description' => $cptRow['description'],
                    'standardDuration' => $cptRow['standard_duration_minutes'],
                    'standardFee' => $cptRow['standard_fee'],
                    'isAddon' => (bool)$cptRow['is_addon'],
                    'isDefault' => (bool)$cptRow['is_default']
                ];
            }
        }

        $categories[] = [
            'id' => $row['id'],
            'name' => $row['name'],
            'color' => $row['color'],
            'description' => $row['description'],
            'defaultDuration' => $row['default_duration'],
            'isBillable' => (bool)$row['is_billable'],
            'categoryType' => $row['category_type'],
            'requiresCptSelection' => (bool)$row['requires_cpt_selection'],
            'blocksAvailability' => (bool)$row['blocks_availability'],
            'sortOrder' => $row['sort_order'],
            'linkedCptCodes' => $linkedCptCodes
        ];
    }

    error_log("Get appointment categories: Found " . count($categories) . " active categories");

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'categories' => $categories
    ]);

} catch (Exception $e) {
    error_log("Error fetching appointment categories: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch appointment categories',
        'message' => $e->getMessage()
    ]);
}
