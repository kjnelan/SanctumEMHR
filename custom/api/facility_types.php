<?php
/**
 * Mindline EMHR - Facility Types API
 * Manages facility type reference data
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
    $action = $_GET['action'] ?? null;

    switch ($method) {
        case 'GET':
            if ($action === 'get' && isset($_GET['id'])) {
                // Get single facility type
                $id = filter_var($_GET['id'], FILTER_VALIDATE_INT);
                if (!$id) {
                    throw new Exception('Invalid facility type ID');
                }

                $sql = "SELECT
                    id,
                    name,
                    description,
                    is_active,
                    sort_order
                FROM facility_types
                WHERE id = ?";

                $result = $db->query($sql, [$id]);

                if (!$result) {
                    throw new Exception('Facility type not found');
                }

                http_response_code(200);
                echo json_encode($result);

            } else {
                // Get all facility types (optionally filter by active)
                $activeOnly = isset($_GET['active_only']) && $_GET['active_only'] === '1';

                $sql = "SELECT
                    id,
                    name,
                    description,
                    is_active,
                    sort_order
                FROM facility_types";

                if ($activeOnly) {
                    $sql .= " WHERE is_active = 1";
                }

                $sql .= " ORDER BY sort_order, name";

                $facilityTypes = $db->queryAll($sql);

                http_response_code(200);
                echo json_encode(['facility_types' => $facilityTypes]);
            }
            break;

        case 'POST':
            // Create new facility type
            $name = $input['name'] ?? null;

            if (!$name) {
                throw new Exception('Facility type name is required');
            }

            // Check if name already exists
            $checkSql = "SELECT id FROM facility_types WHERE name = ?";
            $existing = $db->query($checkSql, [$name]);

            if ($existing) {
                throw new Exception('A facility type with this name already exists');
            }

            $sql = "INSERT INTO facility_types (
                name,
                description,
                is_active,
                sort_order
            ) VALUES (?, ?, ?, ?)";

            $params = [
                $name,
                $input['description'] ?? null,
                ($input['is_active'] ?? 1) ? 1 : 0,
                $input['sort_order'] ?? 0
            ];

            $newId = $db->insert($sql, $params);

            http_response_code(201);
            echo json_encode(['success' => true, 'id' => $newId]);
            break;

        case 'PUT':
            // Update facility type
            $id = $input['id'] ?? null;

            if (!$id) {
                throw new Exception('Facility type ID is required');
            }

            $updateFields = [];
            $params = [];

            $fieldMap = [
                'name' => 'name',
                'description' => 'description',
                'sort_order' => 'sort_order'
            ];

            foreach ($fieldMap as $inputKey => $dbField) {
                if (array_key_exists($inputKey, $input)) {
                    $updateFields[] = "$dbField = ?";
                    $params[] = $input[$inputKey];
                }
            }

            if (isset($input['is_active'])) {
                $updateFields[] = "is_active = ?";
                $params[] = $input['is_active'] ? 1 : 0;
            }

            if (empty($updateFields)) {
                throw new Exception('No fields to update');
            }

            $params[] = $id;
            $sql = "UPDATE facility_types SET " . implode(', ', $updateFields) . " WHERE id = ?";

            $db->execute($sql, $params);

            http_response_code(200);
            echo json_encode(['success' => true]);
            break;

        case 'DELETE':
            // Soft delete (set inactive) - don't actually delete to preserve foreign key integrity
            $id = $_GET['id'] ?? $input['id'] ?? null;

            if (!$id) {
                throw new Exception('Facility type ID is required');
            }

            // Check if any facilities are using this type
            $checkSql = "SELECT COUNT(*) as count FROM facilities WHERE facility_type_id = ? AND is_active = 1";
            $result = $db->query($checkSql, [$id]);

            if ($result && $result['count'] > 0) {
                throw new Exception('Cannot delete facility type that is in use by active facilities');
            }

            $sql = "UPDATE facility_types SET is_active = 0 WHERE id = ?";
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
    error_log("Facility Types API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error', 'message' => $e->getMessage()]);
}
