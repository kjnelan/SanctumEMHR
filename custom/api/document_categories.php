<?php
/**
 * Document Categories Management API (MIGRATED TO MINDLINE)
 * CRUD operations for document categories
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
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
    $method = $_SERVER['REQUEST_METHOD'];

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
        }
    }

    switch ($method) {
        case 'GET':
            // List all active document categories
            $sql = "SELECT
                id,
                name,
                parent_id,
                description,
                lft,
                rght,
                is_active,
                sort_order
            FROM document_categories
            WHERE is_active = 1
            ORDER BY sort_order, name";

            $rows = $db->queryAll($sql);

            $categories = [];
            foreach ($rows as $row) {
                $categories[] = [
                    'id' => (int)$row['id'],
                    'name' => $row['name'],
                    'parent' => $row['parent_id'] ? (int)$row['parent_id'] : null,
                    'parent_id' => $row['parent_id'] ? (int)$row['parent_id'] : null,
                    'description' => $row['description'],
                    'lft' => (int)$row['lft'],
                    'rght' => (int)$row['rght'],
                    'is_active' => (bool)$row['is_active'],
                    'sort_order' => (int)$row['sort_order']
                ];
            }

            http_response_code(200);
            echo json_encode(['categories' => $categories]);
            break;

        case 'POST':
            // Create new category
            if (!$input || !isset($input['name'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Category name is required']);
                exit;
            }

            $sql = "INSERT INTO document_categories (name, parent_id, description, lft, rght, sort_order, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, 1)";

            $params = [
                $input['name'],
                $input['parent_id'] ?? null,
                $input['description'] ?? null,
                $input['lft'] ?? 0,
                $input['rght'] ?? 0,
                $input['sort_order'] ?? 0
            ];

            $id = $db->insert($sql, $params);

            http_response_code(201);
            echo json_encode(['success' => true, 'id' => $id]);
            break;

        case 'PUT':
            // Update category
            if (!$input || !isset($input['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Category ID is required']);
                exit;
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
            if (isset($input['parent_id'])) {
                $updates[] = "parent_id = ?";
                $params[] = $input['parent_id'];
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

            $params[] = $input['id'];
            $sql = "UPDATE document_categories SET " . implode(', ', $updates) . " WHERE id = ?";
            $db->execute($sql, $params);

            http_response_code(200);
            echo json_encode(['success' => true]);
            break;

        case 'DELETE':
            // Soft delete (set inactive)
            $id = $_GET['id'] ?? $input['id'] ?? null;

            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Category ID is required']);
                exit;
            }

            $sql = "UPDATE document_categories SET is_active = 0 WHERE id = ?";
            $db->execute($sql, [$id]);

            http_response_code(200);
            echo json_encode(['success' => true]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }

} catch (\Exception $e) {
    error_log("Document categories API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error', 'message' => $e->getMessage()]);
}
