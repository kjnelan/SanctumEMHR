<?php
/**
 * Document Categories Management API (MIGRATED TO MINDLINE)
 * CRUD operations for document categories
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    // Initialize database
    $db = Database::getInstance();

    // TODO: Check if user has admin privileges
    // For now, allowing all authenticated users

    $method = $_SERVER['REQUEST_METHOD'];

    // Parse JSON input for POST/PUT requests
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
            // List all document categories
            $categoriesSql = "SELECT id, name, parent, lft, rght, aco_spec
                              FROM categories
                              WHERE name != 'Categories'
                              ORDER BY name";
            $rows = $db->queryAll($categoriesSql);

            $categories = [];
            foreach ($rows as $row) {
                // Ensure numeric fields are integers, convert parent=0 to null
                $categories[] = [
                    'id' => (int)$row['id'],
                    'name' => $row['name'],
                    'parent' => ($row['parent'] == 0) ? null : (int)$row['parent'],
                    'lft' => (int)$row['lft'],
                    'rght' => (int)$row['rght'],
                    'aco_spec' => $row['aco_spec']
                ];
            }

            http_response_code(200);
            echo json_encode(['categories' => $categories]);
            break;

        case 'POST':
            // Create new category
            $name = $input['name'] ?? null;
            $parentId = $input['parent_id'] ?? null;

            // Convert parent_id to integer - use 0 for top-level (parent field is NOT NULL)
            if ($parentId !== null && $parentId !== '') {
                $parentId = intval($parentId);
            } else {
                $parentId = 0;  // Database requires 0 for top-level, not NULL
            }

            if (!$name || trim($name) === '') {
                http_response_code(400);
                echo json_encode(['error' => 'Category name is required']);
                exit;
            }

            // Check if category already exists
            $checkSql = "SELECT id FROM categories WHERE name = ?";
            $existing = $db->query($checkSql, [trim($name)]);

            if ($existing) {
                http_response_code(409);
                echo json_encode(['error' => 'Category already exists']);
                exit;
            }

            // Get the highest rght value to append new category
            $maxRghtSql = "SELECT MAX(rght) as max_rght FROM categories";
            $maxRghtResult = $db->query($maxRghtSql);
            $maxRght = intval($maxRghtResult['max_rght'] ?? 1);

            // Insert new category
            $insertSql = "INSERT INTO categories (name, parent, lft, rght, aco_spec)
                          VALUES (?, ?, ?, ?, ?)";
            $newLft = $maxRght + 1;
            $newRght = $maxRght + 2;

            $categoryId = $db->insert($insertSql, [
                trim($name),
                $parentId,
                $newLft,
                $newRght,
                'patients|docs'
            ]);

            if (!$categoryId) {
                throw new Exception('Failed to insert category');
            }

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'category_id' => $categoryId,
                'message' => 'Category created successfully'
            ]);
            break;

        case 'PUT':
            // Update category
            $categoryId = $input['id'] ?? null;
            $name = $input['name'] ?? null;
            $parentId = $input['parent_id'] ?? null;

            // Convert IDs to integers
            if ($categoryId !== null) {
                $categoryId = intval($categoryId);
            }
            // Convert parent_id to integer - use 0 for top-level (parent field is NOT NULL)
            if ($parentId !== null && $parentId !== '') {
                $parentId = intval($parentId);
            } else {
                $parentId = 0;  // Database requires 0 for top-level, not NULL
            }

            if (!$categoryId || !$name || trim($name) === '') {
                http_response_code(400);
                echo json_encode(['error' => 'Category ID and name are required']);
                exit;
            }

            // Check if new name conflicts with existing category
            $checkSql = "SELECT id FROM categories WHERE name = ? AND id != ?";
            $existing = $db->query($checkSql, [trim($name), $categoryId]);

            if ($existing) {
                http_response_code(409);
                echo json_encode(['error' => 'Category name already exists']);
                exit;
            }

            // Prevent circular parent reference
            if ($parentId == $categoryId) {
                http_response_code(400);
                echo json_encode(['error' => 'A category cannot be its own parent']);
                exit;
            }

            // Update category
            $updateSql = "UPDATE categories SET name = ?, parent = ? WHERE id = ?";
            $db->execute($updateSql, [trim($name), $parentId, $categoryId]);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Category updated successfully'
            ]);
            break;

        case 'DELETE':
            // Delete category
            $categoryId = $_GET['id'] ?? null;

            if (!$categoryId) {
                http_response_code(400);
                echo json_encode(['error' => 'Category ID is required']);
                exit;
            }

            // Check if category has subcategories
            $checkSubcatsSql = "SELECT COUNT(*) as subcat_count FROM categories WHERE parent = ?";
            $subcatCheck = $db->query($checkSubcatsSql, [$categoryId]);

            if ($subcatCheck && $subcatCheck['subcat_count'] > 0) {
                http_response_code(409);
                echo json_encode([
                    'error' => 'Cannot delete category with subcategories',
                    'subcategory_count' => $subcatCheck['subcat_count']
                ]);
                exit;
            }

            // Check if category has documents
            $checkDocsSql = "SELECT COUNT(*) as doc_count
                             FROM categories_to_documents
                             WHERE category_id = ?";
            $docCheck = $db->query($checkDocsSql, [$categoryId]);

            if ($docCheck && $docCheck['doc_count'] > 0) {
                http_response_code(409);
                echo json_encode([
                    'error' => 'Cannot delete category with documents',
                    'document_count' => $docCheck['doc_count']
                ]);
                exit;
            }

            // Delete category
            $deleteSql = "DELETE FROM categories WHERE id = ?";
            $db->execute($deleteSql, [$categoryId]);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Category deleted successfully'
            ]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    error_log("Document categories error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}
