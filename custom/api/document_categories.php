<?php
/**
 * Document Categories Management API
 * CRUD operations for document categories
 */

// Start output buffering to prevent any PHP warnings/notices from breaking JSON
ob_start();

// IMPORTANT: Set these BEFORE loading globals.php to prevent redirects
$ignoreAuth = true;
$ignoreAuth_onsite_portal = true;
$ignoreAuth_onsite_portal_two = true;

require_once(__DIR__ . '/../../interface/globals.php');

// Clear any output that globals.php might have generated
ob_end_clean();

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

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Document categories: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

// TODO: Check if user has admin privileges
// For now, allowing all authenticated users

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            // List all document categories
            $categoriesSql = "SELECT id, name, parent, lft, rght, aco_spec
                              FROM categories
                              WHERE name != 'Categories'
                              ORDER BY name";
            $result = sqlStatement($categoriesSql);

            $categories = [];
            while ($row = sqlFetchArray($result)) {
                $categories[] = $row;
            }

            http_response_code(200);
            echo json_encode(['categories' => $categories]);
            break;

        case 'POST':
            // Create new category
            $name = $input['name'] ?? null;

            if (!$name || trim($name) === '') {
                http_response_code(400);
                echo json_encode(['error' => 'Category name is required']);
                exit;
            }

            // Check if category already exists
            $checkSql = "SELECT id FROM categories WHERE name = ?";
            $existing = sqlQuery($checkSql, [trim($name)]);

            if ($existing) {
                http_response_code(409);
                echo json_encode(['error' => 'Category already exists']);
                exit;
            }

            // Get the highest rght value to append new category
            $maxRghtSql = "SELECT MAX(rght) as max_rght FROM categories";
            $maxRghtResult = sqlQuery($maxRghtSql);
            $maxRght = $maxRghtResult['max_rght'] ?? 1;

            // Insert new category
            $insertSql = "INSERT INTO categories (name, parent, lft, rght, aco_spec)
                          VALUES (?, ?, ?, ?, ?)";
            $newLft = $maxRght + 1;
            $newRght = $maxRght + 2;

            $categoryId = sqlInsert($insertSql, [
                trim($name),
                null,  // parent
                $newLft,
                $newRght,
                'patients|docs'  // aco_spec for document access control
            ]);

            error_log("Category created - ID: $categoryId, Name: $name");

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

            if (!$categoryId || !$name || trim($name) === '') {
                http_response_code(400);
                echo json_encode(['error' => 'Category ID and name are required']);
                exit;
            }

            // Check if new name conflicts with existing category
            $checkSql = "SELECT id FROM categories WHERE name = ? AND id != ?";
            $existing = sqlQuery($checkSql, [trim($name), $categoryId]);

            if ($existing) {
                http_response_code(409);
                echo json_encode(['error' => 'Category name already exists']);
                exit;
            }

            // Update category
            $updateSql = "UPDATE categories SET name = ? WHERE id = ?";
            sqlStatement($updateSql, [trim($name), $categoryId]);

            error_log("Category updated - ID: $categoryId, New name: $name");

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

            // Check if category has documents
            $checkDocsSql = "SELECT COUNT(*) as doc_count
                             FROM categories_to_documents
                             WHERE category_id = ?";
            $docCheck = sqlQuery($checkDocsSql, [$categoryId]);

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
            sqlStatement($deleteSql, [$categoryId]);

            error_log("Category deleted - ID: $categoryId");

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
    error_log("Error in document categories API: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}
