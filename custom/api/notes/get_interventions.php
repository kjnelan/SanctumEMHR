<?php
/**
 * Mindline EMHR
 * Get Interventions API - Session-based authentication (MIGRATED TO MINDLINE)
 * Returns intervention library with optional tier and modality filtering
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

    $userId = $session->getUserId();
    $db = Database::getInstance();

    // Optional filters
    $tier = $_GET['tier'] ?? null;
    $modality = $_GET['modality'] ?? null;
    $includeInactive = isset($_GET['include_inactive']) ? boolval($_GET['include_inactive']) : false;

    // Build SQL query
    $sql = "SELECT
        i.id,
        i.intervention_name,
        i.intervention_tier,
        i.modality,
        i.is_system_intervention,
        i.display_order,
        i.is_active,
        CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END AS is_favorite,
        f.display_order AS favorite_order
    FROM intervention_library i
    LEFT JOIN user_favorite_interventions f ON f.intervention_id = i.id AND f.user_id = ?
    WHERE 1=1";

    $params = [$userId];

    // Add filters
    if (!$includeInactive) {
        $sql .= " AND i.is_active = 1";
    }

    if ($tier) {
        $sql .= " AND i.intervention_tier = ?";
        $params[] = intval($tier);
    }

    if ($modality) {
        $sql .= " AND i.modality = ?";
        $params[] = $modality;
    }

    // Order by tier, then modality, then display order
    $sql .= " ORDER BY i.intervention_tier, i.modality, i.display_order, i.intervention_name";

    $rows = $db->queryAll($sql, $params);
    $interventions = [];

    // Group by tier and modality
    $grouped = [
        'tier1' => [], // Core interventions
        'tier2' => [], // Modality-specific (grouped by modality)
        'tier3' => [], // Crisis/Risk
        'tier4' => []  // Administrative
    ];

    foreach ($rows as $row) {
        $row['is_favorite'] = (bool)$row['is_favorite'];
        $row['is_system_intervention'] = (bool)$row['is_system_intervention'];
        $row['is_active'] = (bool)$row['is_active'];

        $tier = intval($row['intervention_tier']);

        if ($tier === 1) {
            $grouped['tier1'][] = $row;
        } elseif ($tier === 2) {
            // Group Tier 2 by modality
            $mod = $row['modality'] ?? 'Other';
            if (!isset($grouped['tier2'][$mod])) {
                $grouped['tier2'][$mod] = [];
            }
            $grouped['tier2'][$mod][] = $row;
        } elseif ($tier === 3) {
            $grouped['tier3'][] = $row;
        } elseif ($tier === 4) {
            $grouped['tier4'][] = $row;
        }

        $interventions[] = $row;
    }

    // Get user's favorites (for quick access)
    $favoritesSql = "SELECT
        i.id,
        i.intervention_name,
        i.intervention_tier,
        i.modality,
        f.display_order
    FROM user_favorite_interventions f
    JOIN intervention_library i ON i.id = f.intervention_id
    WHERE f.user_id = ? AND i.is_active = 1
    ORDER BY f.display_order, i.intervention_name";

    $favorites = $db->queryAll($favoritesSql, [$userId]);

    $response = [
        'success' => true,
        'interventions' => $interventions,
        'grouped' => $grouped,
        'favorites' => $favorites,
        'total_count' => count($interventions)
    ];

    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error fetching interventions: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch interventions',
        'message' => $e->getMessage()
    ]);
}
