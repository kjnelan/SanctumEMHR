<?php
/**
 * SanctumEMHR - Calendar Categories API
 * Handles CRUD operations for appointment categories with CPT code linking
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    $db = Database::getInstance();
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? $_GET['action'] ?? null;

    switch ($method) {
        case 'GET':
            if ($action === 'get' && isset($_GET['id'])) {
                // Get single category with linked CPT codes
                $categoryId = filter_var($_GET['id'], FILTER_VALIDATE_INT);
                if (!$categoryId) {
                    throw new Exception('Invalid category ID');
                }

                $sql = "SELECT * FROM appointment_categories WHERE id = ?";
                $category = $db->query($sql, [$categoryId]);

                if (!$category) {
                    throw new Exception('Category not found');
                }

                // Get linked CPT codes
                $linkSql = "SELECT cpt_code_id FROM category_cpt_codes WHERE category_id = ?";
                $links = $db->queryAll($linkSql, [$categoryId]);
                $category['linked_cpt_codes'] = array_column($links, 'cpt_code_id');

                http_response_code(200);
                echo json_encode(['success' => true, 'category' => $category]);
            } else {
                // Get all categories
                $sql = "SELECT
                            id,
                            name,
                            description,
                            default_duration,
                            is_billable,
                            is_active,
                            category_type,
                            requires_cpt_selection,
                            blocks_availability,
                            sort_order,
                            created_at,
                            updated_at
                        FROM appointment_categories
                        ORDER BY sort_order ASC, name ASC";

                $results = $db->queryAll($sql);

                http_response_code(200);
                echo json_encode(['success' => true, 'categories' => $results]);
            }
            break;

        case 'POST':
            if (!$action) {
                throw new Exception('Action is required');
            }

            switch ($action) {
                case 'create':
                    // Validate required fields
                    if (empty($input['name'])) {
                        throw new Exception('Category name is required');
                    }

                    // Insert category
                    $sql = "INSERT INTO appointment_categories (
                                name,
                                description,
                                default_duration,
                                is_billable,
                                is_active,
                                category_type,
                                requires_cpt_selection,
                                blocks_availability,
                                sort_order
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

                    $params = [
                        $input['name'],
                        $input['description'] ?? null,
                        $input['default_duration'] ?? 50,
                        $input['is_billable'] ?? 1,
                        $input['is_active'] ?? 1,
                        $input['category_type'] ?? 'client',
                        $input['requires_cpt_selection'] ?? 0,
                        $input['blocks_availability'] ?? 0,
                        $input['sort_order'] ?? 0
                    ];

                    $db->execute($sql, $params);
                    $categoryId = $db->getConnection()->lastInsertId();

                    // Link CPT codes if provided
                    if (!empty($input['linked_cpt_codes']) && is_array($input['linked_cpt_codes'])) {
                        foreach ($input['linked_cpt_codes'] as $cptCodeId) {
                            $linkSql = "INSERT INTO category_cpt_codes (category_id, cpt_code_id) VALUES (?, ?)";
                            $db->execute($linkSql, [$categoryId, $cptCodeId]);
                        }
                    }

                    http_response_code(201);
                    echo json_encode(['success' => true, 'message' => 'Category created successfully', 'id' => $categoryId]);
                    break;

                case 'update':
                    if (empty($input['id'])) {
                        throw new Exception('ID is required');
                    }

                    // Build update SQL dynamically based on provided fields
                    $updateFields = [];
                    $params = [];

                    if (isset($input['name'])) {
                        $updateFields[] = "name = ?";
                        $params[] = $input['name'];
                    }
                    if (isset($input['description'])) {
                        $updateFields[] = "description = ?";
                        $params[] = $input['description'];
                    }
                    if (isset($input['default_duration'])) {
                        $updateFields[] = "default_duration = ?";
                        $params[] = $input['default_duration'];
                    }
                    if (isset($input['is_billable'])) {
                        $updateFields[] = "is_billable = ?";
                        $params[] = $input['is_billable'];
                    }
                    if (isset($input['is_active'])) {
                        $updateFields[] = "is_active = ?";
                        $params[] = $input['is_active'];
                    }
                    if (isset($input['category_type'])) {
                        $updateFields[] = "category_type = ?";
                        $params[] = $input['category_type'];
                    }
                    if (isset($input['requires_cpt_selection'])) {
                        $updateFields[] = "requires_cpt_selection = ?";
                        $params[] = $input['requires_cpt_selection'];
                    }
                    if (isset($input['blocks_availability'])) {
                        $updateFields[] = "blocks_availability = ?";
                        $params[] = $input['blocks_availability'];
                    }
                    if (isset($input['sort_order'])) {
                        $updateFields[] = "sort_order = ?";
                        $params[] = $input['sort_order'];
                    }

                    if (!empty($updateFields)) {
                        $params[] = $input['id'];
                        $sql = "UPDATE appointment_categories SET " . implode(', ', $updateFields) . " WHERE id = ?";
                        $db->execute($sql, $params);
                    }

                    // Update CPT code links if provided
                    if (isset($input['linked_cpt_codes']) && is_array($input['linked_cpt_codes'])) {
                        // Delete existing links
                        $deleteLinkSql = "DELETE FROM category_cpt_codes WHERE category_id = ?";
                        $db->execute($deleteLinkSql, [$input['id']]);

                        // Insert new links
                        foreach ($input['linked_cpt_codes'] as $cptCodeId) {
                            $linkSql = "INSERT INTO category_cpt_codes (category_id, cpt_code_id) VALUES (?, ?)";
                            $db->execute($linkSql, [$input['id'], $cptCodeId]);
                        }
                    }

                    http_response_code(200);
                    echo json_encode(['success' => true, 'message' => 'Category updated successfully']);
                    break;

                case 'delete':
                    if (empty($input['id'])) {
                        throw new Exception('ID is required');
                    }

                    // Check if category is in use
                    $inUse = $db->query("SELECT COUNT(*) as count FROM appointments WHERE category_id = ?", [$input['id']]);
                    if ($inUse && $inUse['count'] > 0) {
                        throw new Exception('Cannot delete category that is in use by appointments. Consider marking it as inactive instead.');
                    }

                    // Delete CPT code links first
                    $deleteLinkSql = "DELETE FROM category_cpt_codes WHERE category_id = ?";
                    $db->execute($deleteLinkSql, [$input['id']]);

                    // Delete category
                    $sql = "DELETE FROM appointment_categories WHERE id = ?";
                    $db->execute($sql, [$input['id']]);

                    http_response_code(200);
                    echo json_encode(['success' => true, 'message' => 'Category deleted successfully']);
                    break;

                default:
                    throw new Exception('Invalid action');
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
