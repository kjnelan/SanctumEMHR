<?php
/**
 * Reference Lists Management API
 * CRUD operations for clinical and demographic lookup lists
 * Handles: Sexual Orientation, Gender Identity, Marital Status, Client Status,
 * Pronouns, Ethnicity/Race, Insurance Types, Referral Sources, etc.
 *
 * Author: Kenneth J. Nelan
 * Copyright © 2026 Sacred Wandering
 */

// Turn off all error display - we'll handle errors as JSON
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(E_ALL);

// Prevent any output before JSON
ob_start();

// Catch all errors and convert to JSON
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
});

try {
    require_once(__DIR__ . '/../init.php');
} catch (Exception $e) {
    ob_clean();
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Init error: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
    ob_end_flush();
    exit;
}

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

// Clear any output that might have happened during init
ob_clean();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    error_log("Reference Lists API: Starting request - Method: " . $_SERVER['REQUEST_METHOD']);

    $session = SessionManager::getInstance();
    $session->start();

    error_log("Reference Lists API: Session started");

    if (!$session->isAuthenticated()) {
        error_log("Reference Lists API: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    error_log("Reference Lists API: Authenticated");

    // Get Database instance
    $db = Database::getInstance();
    error_log("Reference Lists API: Database instance created");

    // Admin-only check
    $userId = $session->getUserId();
    error_log("Reference Lists API: Got user ID - " . $userId);

    $userSql = "SELECT user_type FROM users WHERE id = ?";
    $userResult = $db->query($userSql, [$userId]);

    if (!$userResult || $userResult['user_type'] !== 'admin') {
        error_log("Reference Lists API: No admin access - User ID: " . $userId);
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }

    error_log("Reference Lists API: Admin check passed - User ID: " . $userId);
    $method = $_SERVER['REQUEST_METHOD'];

    // Get list type from query parameter
    $listType = $_GET['type'] ?? null;

    // Validate list type
    $validTypes = [
        'sexual-orientation',
        'gender-identity',
        'pronouns',
        'marital-status',
        'client-status',
        'ethnicity',
        'insurance-type',
        'referral-source',
        'treatment-modality',
        'discharge-reason',
        'calendar-category'
    ];

    if ($method !== 'GET' || !$listType) {
        // For POST/PUT, type comes from body
        $input = null;
        if (in_array($method, ['POST', 'PUT'])) {
            $rawInput = file_get_contents('php://input');
            if ($rawInput) {
                $input = json_decode($rawInput, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid JSON input: ' . json_last_error_msg()]);
                    exit;
                }
                $listType = $input['type'] ?? null;
            }
        }
    }

    if (!$listType || !in_array($listType, $validTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid or missing list type. Valid types: ' . implode(', ', $validTypes)]);
        exit;
    }

    switch ($method) {
        case 'GET':
            error_log("Reference Lists API: GET request for type: " . $listType);

            // List all items for the specified type
            $sql = "SELECT
                id,
                list_type,
                name,
                description,
                is_active,
                sort_order,
                created_at,
                updated_at
            FROM reference_lists
            WHERE list_type = ?
            ORDER BY sort_order ASC, name ASC";

            error_log("Reference Lists API: Executing query");
            $rows = $db->queryAll($sql, [$listType]);
            error_log("Reference Lists API: Query returned " . count($rows) . " rows");

            $items = [];
            foreach ($rows as $row) {
                $items[] = [
                    'id' => (int)$row['id'],
                    'type' => $row['list_type'],
                    'name' => $row['name'],
                    'description' => $row['description'],
                    'active' => (bool)$row['is_active'],
                    'sort_order' => (int)$row['sort_order'],
                    'created_at' => $row['created_at'],
                    'updated_at' => $row['updated_at']
                ];
            }

            error_log("Reference Lists API: Sending response with " . count($items) . " items");
            http_response_code(200);
            echo json_encode(['items' => $items]);
            error_log("Reference Lists API: Response sent successfully");
            break;

        case 'POST':
            // Create new item
            if (!$input || !isset($input['name'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Name is required']);
                exit;
            }

            // Check for duplicate name within the same list type
            $checkSql = "SELECT COUNT(*) as count FROM reference_lists WHERE list_type = ? AND name = ?";
            $exists = $db->query($checkSql, [$listType, $input['name']]);
            if ($exists && $exists['count'] > 0) {
                http_response_code(409);
                echo json_encode(['error' => 'An item with this name already exists']);
                exit;
            }

            // Get the next sort order
            $sortSql = "SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM reference_lists WHERE list_type = ?";
            $sortResult = $db->query($sortSql, [$listType]);
            $nextOrder = $sortResult ? (int)$sortResult['next_order'] : 1;

            $sql = "INSERT INTO reference_lists (list_type, name, description, is_active, sort_order, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, NOW(), NOW())";

            $params = [
                $listType,
                $input['name'],
                $input['description'] ?? null,
                isset($input['active']) ? ($input['active'] ? 1 : 0) : 1,
                $input['sort_order'] ?? $nextOrder
            ];

            $id = $db->insert($sql, $params);

            http_response_code(201);
            echo json_encode(['success' => true, 'id' => $id]);
            break;

        case 'PUT':
            // Update item
            if (!$input || !isset($input['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Item ID is required']);
                exit;
            }

            // Verify the item exists and belongs to this list type
            $checkSql = "SELECT id FROM reference_lists WHERE id = ? AND list_type = ?";
            $exists = $db->query($checkSql, [$input['id'], $listType]);
            if (!$exists) {
                http_response_code(404);
                echo json_encode(['error' => 'Item not found']);
                exit;
            }

            // Check for duplicate name (excluding current item)
            if (isset($input['name'])) {
                $dupSql = "SELECT COUNT(*) as count FROM reference_lists WHERE list_type = ? AND name = ? AND id != ?";
                $dupCheck = $db->query($dupSql, [$listType, $input['name'], $input['id']]);
                if ($dupCheck && $dupCheck['count'] > 0) {
                    http_response_code(409);
                    echo json_encode(['error' => 'An item with this name already exists']);
                    exit;
                }
            }

            $updates = [];
            $params = [];

            if (isset($input['name'])) {
                $updates[] = "name = ?";
                $params[] = $input['name'];
            }
            if (isset($input['description'])) {
                $updates[] = "description = ?";
                $params[] = $input['description'];
            }
            if (isset($input['active'])) {
                $updates[] = "is_active = ?";
                $params[] = $input['active'] ? 1 : 0;
            }
            if (isset($input['sort_order'])) {
                $updates[] = "sort_order = ?";
                $params[] = $input['sort_order'];
            }

            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                exit;
            }

            $updates[] = "updated_at = NOW()";
            $params[] = $input['id'];
            $sql = "UPDATE reference_lists SET " . implode(', ', $updates) . " WHERE id = ?";
            $db->execute($sql, $params);

            http_response_code(200);
            echo json_encode(['success' => true]);
            break;

        case 'DELETE':
            // Delete item
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Item ID is required']);
                exit;
            }

            // Verify the item exists and belongs to this list type
            $checkSql = "SELECT id FROM reference_lists WHERE id = ? AND list_type = ?";
            $exists = $db->query($checkSql, [$id, $listType]);
            if (!$exists) {
                http_response_code(404);
                echo json_encode(['error' => 'Item not found']);
                exit;
            }

            // TODO: Add check to prevent deletion if item is in use
            // This would require checking various patient/client tables depending on list type

            $sql = "DELETE FROM reference_lists WHERE id = ? AND list_type = ?";
            $db->execute($sql, [$id, $listType]);

            http_response_code(200);
            echo json_encode(['success' => true]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }

} catch (Exception $e) {
    error_log("Reference Lists API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error: ' . $e->getMessage()]);
}

// Flush output buffer
ob_end_flush();
