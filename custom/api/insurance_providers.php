<?php
/**
 * SanctumEMHR - Insurance Providers API
 * Handles CRUD operations for insurance companies/payers
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
            // Get all insurance providers
            $includeInactive = isset($_GET['include_inactive']) && $_GET['include_inactive'] === 'true';

            $sql = "SELECT
                        id,
                        name,
                        payer_id,
                        phone,
                        fax,
                        email,
                        website,
                        address_line1,
                        address_line2,
                        city,
                        state,
                        zip,
                        claims_address,
                        claims_phone,
                        claims_email,
                        insurance_type,
                        is_active,
                        created_at,
                        updated_at
                    FROM insurance_providers";

            if (!$includeInactive) {
                $sql .= " WHERE is_active = 1";
            }

            $sql .= " ORDER BY name ASC";

            $results = $db->queryAll($sql);

            http_response_code(200);
            echo json_encode(['success' => true, 'providers' => $results]);
            break;

        case 'POST':
            if (!$action) {
                throw new Exception('Action is required');
            }

            // Check if user is admin for write operations
            $userId = $session->getUserId();
            $userResult = $db->query("SELECT user_type FROM users WHERE id = ?", [$userId]);
            if (!$userResult || $userResult['user_type'] !== 'admin') {
                http_response_code(403);
                echo json_encode(['error' => 'Admin access required']);
                exit;
            }

            switch ($action) {
                case 'create':
                    // Validate required fields
                    if (empty($input['name'])) {
                        throw new Exception('Insurance company name is required');
                    }

                    // Check for duplicate name
                    $existing = $db->query("SELECT id FROM insurance_providers WHERE name = ?", [$input['name']]);
                    if ($existing) {
                        throw new Exception('An insurance provider with this name already exists');
                    }

                    $sql = "INSERT INTO insurance_providers (
                                name,
                                payer_id,
                                phone,
                                fax,
                                email,
                                website,
                                address_line1,
                                address_line2,
                                city,
                                state,
                                zip,
                                claims_address,
                                claims_phone,
                                claims_email,
                                insurance_type,
                                is_active
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                    $params = [
                        $input['name'],
                        $input['payer_id'] ?? null,
                        $input['phone'] ?? null,
                        $input['fax'] ?? null,
                        $input['email'] ?? null,
                        $input['website'] ?? null,
                        $input['address_line1'] ?? null,
                        $input['address_line2'] ?? null,
                        $input['city'] ?? null,
                        $input['state'] ?? null,
                        $input['zip'] ?? null,
                        $input['claims_address'] ?? null,
                        $input['claims_phone'] ?? null,
                        $input['claims_email'] ?? null,
                        $input['insurance_type'] ?? 'commercial',
                        $input['is_active'] ?? 1
                    ];

                    $newId = $db->insert($sql, $params);

                    http_response_code(201);
                    echo json_encode(['success' => true, 'message' => 'Insurance provider created successfully', 'id' => $newId]);
                    break;

                case 'update':
                    if (empty($input['id'])) {
                        throw new Exception('ID is required');
                    }

                    // Build update SQL dynamically based on provided fields
                    $updateFields = [];
                    $params = [];

                    $allowedFields = [
                        'name', 'payer_id', 'phone', 'fax', 'email', 'website',
                        'address_line1', 'address_line2', 'city', 'state', 'zip',
                        'claims_address', 'claims_phone', 'claims_email',
                        'insurance_type', 'is_active'
                    ];

                    foreach ($allowedFields as $field) {
                        if (isset($input[$field])) {
                            $updateFields[] = "$field = ?";
                            $params[] = $input[$field] !== '' ? $input[$field] : null;
                        }
                    }

                    if (empty($updateFields)) {
                        throw new Exception('No fields to update');
                    }

                    $params[] = $input['id'];
                    $sql = "UPDATE insurance_providers SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?";

                    $db->execute($sql, $params);

                    http_response_code(200);
                    echo json_encode(['success' => true, 'message' => 'Insurance provider updated successfully']);
                    break;

                case 'delete':
                    if (empty($input['id'])) {
                        throw new Exception('ID is required');
                    }

                    // Check if provider is in use by client insurance
                    $inUseClients = $db->query(
                        "SELECT COUNT(*) as count FROM client_insurance WHERE insurance_provider_id = ?",
                        [$input['id']]
                    );
                    if ($inUseClients && $inUseClients['count'] > 0) {
                        throw new Exception('Cannot delete insurance provider that is assigned to clients. Consider marking it as inactive instead.');
                    }

                    // Check if provider is in use by claims
                    $inUseClaims = $db->query(
                        "SELECT COUNT(*) as count FROM claims WHERE insurance_provider_id = ?",
                        [$input['id']]
                    );
                    if ($inUseClaims && $inUseClaims['count'] > 0) {
                        throw new Exception('Cannot delete insurance provider that has associated claims. Consider marking it as inactive instead.');
                    }

                    $sql = "DELETE FROM insurance_providers WHERE id = ?";
                    $db->execute($sql, [$input['id']]);

                    http_response_code(200);
                    echo json_encode(['success' => true, 'message' => 'Insurance provider deleted successfully']);
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
    error_log("Insurance providers API error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
