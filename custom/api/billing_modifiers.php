<?php
/**
 * SanctumEMHR - Billing Modifiers API
 * Handles CRUD operations for CPT code billing modifiers
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
            // Get all billing modifiers
            $sql = "SELECT
                        id,
                        code,
                        description,
                        modifier_type,
                        is_active,
                        sort_order,
                        created_at,
                        updated_at
                    FROM billing_modifiers
                    ORDER BY sort_order ASC, code ASC";

            $results = $db->queryAll($sql);

            http_response_code(200);
            echo json_encode(['success' => true, 'modifiers' => $results]);
            break;

        case 'POST':
            if (!$action) {
                throw new Exception('Action is required');
            }

            switch ($action) {
                case 'create':
                    // Validate required fields
                    if (empty($input['code'])) {
                        throw new Exception('Modifier code is required');
                    }
                    if (empty($input['description'])) {
                        throw new Exception('Description is required');
                    }

                    // Check for duplicate code
                    $existing = $db->queryOne("SELECT id FROM billing_modifiers WHERE code = ?", [$input['code']]);
                    if ($existing) {
                        throw new Exception('Modifier code already exists');
                    }

                    $sql = "INSERT INTO billing_modifiers (
                                code,
                                description,
                                modifier_type,
                                is_active,
                                sort_order
                            ) VALUES (?, ?, ?, ?, ?)";

                    $params = [
                        strtoupper($input['code']),
                        $input['description'],
                        $input['modifier_type'] ?? 'clinician',
                        $input['is_active'] ?? 1,
                        $input['sort_order'] ?? 0
                    ];

                    $db->execute($sql, $params);

                    http_response_code(201);
                    echo json_encode(['success' => true, 'message' => 'Billing modifier created successfully']);
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
                        $params[] = strtoupper($input['code']);
                    }
                    if (isset($input['description'])) {
                        $updateFields[] = "description = ?";
                        $params[] = $input['description'];
                    }
                    if (isset($input['modifier_type'])) {
                        $updateFields[] = "modifier_type = ?";
                        $params[] = $input['modifier_type'];
                    }
                    if (isset($input['is_active'])) {
                        $updateFields[] = "is_active = ?";
                        $params[] = $input['is_active'];
                    }
                    if (isset($input['sort_order'])) {
                        $updateFields[] = "sort_order = ?";
                        $params[] = $input['sort_order'];
                    }

                    if (empty($updateFields)) {
                        throw new Exception('No fields to update');
                    }

                    $params[] = $input['id'];
                    $sql = "UPDATE billing_modifiers SET " . implode(', ', $updateFields) . " WHERE id = ?";

                    $db->execute($sql, $params);

                    http_response_code(200);
                    echo json_encode(['success' => true, 'message' => 'Billing modifier updated successfully']);
                    break;

                case 'delete':
                    if (empty($input['id'])) {
                        throw new Exception('ID is required');
                    }

                    // Check if modifier is in use by users or appointments
                    $inUseByUsers = $db->queryOne("SELECT COUNT(*) as count FROM users WHERE default_modifier_id = ?", [$input['id']]);
                    if ($inUseByUsers && $inUseByUsers['count'] > 0) {
                        throw new Exception('Cannot delete modifier that is assigned as default to users. Consider marking it as inactive instead.');
                    }

                    $inUseByAppointments = $db->queryOne("SELECT COUNT(*) as count FROM appointments WHERE modifier_id = ?", [$input['id']]);
                    if ($inUseByAppointments && $inUseByAppointments['count'] > 0) {
                        throw new Exception('Cannot delete modifier that is in use by appointments. Consider marking it as inactive instead.');
                    }

                    $sql = "DELETE FROM billing_modifiers WHERE id = ?";
                    $db->execute($sql, [$input['id']]);

                    http_response_code(200);
                    echo json_encode(['success' => true, 'message' => 'Billing modifier deleted successfully']);
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
