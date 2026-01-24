<?php
/**
 * SanctumEMHR - CPT Codes API
 * Handles CRUD operations for CPT billing codes
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
            // Get all CPT codes
            $sql = "SELECT
                        id,
                        code,
                        category,
                        type,
                        description,
                        standard_duration_minutes,
                        standard_fee,
                        is_active,
                        is_addon,
                        requires_primary_code,
                        sort_order,
                        created_at,
                        updated_at
                    FROM cpt_codes
                    ORDER BY sort_order ASC, code ASC";

            $results = $db->queryAll($sql);

            http_response_code(200);
            echo json_encode(['success' => true, 'cpt_codes' => $results]);
            break;

        case 'POST':
            if (!$action) {
                throw new Exception('Action is required');
            }

            switch ($action) {
                case 'create':
                    // Validate required fields
                    if (empty($input['code'])) {
                        throw new Exception('CPT code is required');
                    }
                    if (empty($input['description'])) {
                        throw new Exception('Description is required');
                    }

                    // Check for duplicate code
                    $existing = $db->queryOne("SELECT id FROM cpt_codes WHERE code = ?", [$input['code']]);
                    if ($existing) {
                        throw new Exception('CPT code already exists');
                    }

                    $sql = "INSERT INTO cpt_codes (
                                code,
                                category,
                                type,
                                description,
                                standard_duration_minutes,
                                standard_fee,
                                is_active,
                                is_addon,
                                requires_primary_code,
                                sort_order
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                    $params = [
                        $input['code'],
                        $input['category'] ?? 'Individual Therapy',
                        $input['type'] ?? 'CPT4',
                        $input['description'],
                        $input['standard_duration_minutes'] ?? 50,
                        !empty($input['standard_fee']) ? $input['standard_fee'] : null,
                        $input['is_active'] ?? 1,
                        $input['is_addon'] ?? 0,
                        !empty($input['requires_primary_code']) ? $input['requires_primary_code'] : null,
                        $input['sort_order'] ?? 0
                    ];

                    $db->execute($sql, $params);

                    http_response_code(201);
                    echo json_encode(['success' => true, 'message' => 'CPT code created successfully']);
                    break;

                case 'update':
                    if (empty($input['id'])) {
                        throw new Exception('ID is required');
                    }

                    // Build update SQL dynamically based on provided fields
                    $updateFields = [];
                    $params = [];

                    if (isset($input['code'])) {
                        $updateFields[] = "code = ?";
                        $params[] = $input['code'];
                    }
                    if (isset($input['category'])) {
                        $updateFields[] = "category = ?";
                        $params[] = $input['category'];
                    }
                    if (isset($input['type'])) {
                        $updateFields[] = "type = ?";
                        $params[] = $input['type'];
                    }
                    if (isset($input['description'])) {
                        $updateFields[] = "description = ?";
                        $params[] = $input['description'];
                    }
                    if (isset($input['standard_duration_minutes'])) {
                        $updateFields[] = "standard_duration_minutes = ?";
                        $params[] = $input['standard_duration_minutes'];
                    }
                    if (isset($input['standard_fee'])) {
                        $updateFields[] = "standard_fee = ?";
                        $params[] = !empty($input['standard_fee']) ? $input['standard_fee'] : null;
                    }
                    if (isset($input['is_active'])) {
                        $updateFields[] = "is_active = ?";
                        $params[] = $input['is_active'];
                    }
                    if (isset($input['is_addon'])) {
                        $updateFields[] = "is_addon = ?";
                        $params[] = $input['is_addon'];
                    }
                    if (isset($input['requires_primary_code'])) {
                        $updateFields[] = "requires_primary_code = ?";
                        $params[] = !empty($input['requires_primary_code']) ? $input['requires_primary_code'] : null;
                    }
                    if (isset($input['sort_order'])) {
                        $updateFields[] = "sort_order = ?";
                        $params[] = $input['sort_order'];
                    }

                    if (empty($updateFields)) {
                        throw new Exception('No fields to update');
                    }

                    $params[] = $input['id'];
                    $sql = "UPDATE cpt_codes SET " . implode(', ', $updateFields) . " WHERE id = ?";

                    $db->execute($sql, $params);

                    http_response_code(200);
                    echo json_encode(['success' => true, 'message' => 'CPT code updated successfully']);
                    break;

                case 'delete':
                    if (empty($input['id'])) {
                        throw new Exception('ID is required');
                    }

                    // Check if CPT code is in use
                    $inUse = $db->queryOne("SELECT COUNT(*) as count FROM appointments WHERE cpt_code_id = ?", [$input['id']]);
                    if ($inUse && $inUse['count'] > 0) {
                        throw new Exception('Cannot delete CPT code that is in use by appointments. Consider marking it as inactive instead.');
                    }

                    $sql = "DELETE FROM cpt_codes WHERE id = ?";
                    $db->execute($sql, [$input['id']]);

                    http_response_code(200);
                    echo json_encode(['success' => true, 'message' => 'CPT code deleted successfully']);
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
