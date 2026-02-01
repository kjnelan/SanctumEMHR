<?php
/**
 * SanctumEMHR
 * Client Providers API - Manage client-provider assignments
 * Supports multiple providers per client with different roles
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

// Set JSON headers early to catch any errors
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Wrap require in try-catch to handle init errors
try {
    require_once(__DIR__ . '/../init.php');
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Initialization error', 'message' => $e->getMessage()]);
    exit;
}

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

try {
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $db = Database::getInstance();
    $currentUserId = $session->getUserId();
    $currentUserType = $session->get('user_type') ?? 'staff';

    // GET: Retrieve providers for a client
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $clientId = isset($_GET['client_id']) ? intval($_GET['client_id']) : null;

        if (!$clientId) {
            http_response_code(400);
            echo json_encode(['error' => 'client_id is required']);
            exit;
        }

        // Check if client_providers table exists
        try {
            $tableCheck = $db->queryOne("SHOW TABLES LIKE 'client_providers'");
            if (!$tableCheck) {
                // Table doesn't exist - return empty providers list (migration not run)
                echo json_encode([
                    'success' => true,
                    'providers' => [],
                    'warning' => 'client_providers table not found - please run migrations'
                ]);
                exit;
            }
        } catch (Exception $e) {
            // If we can't check, proceed and let the main query fail with a clear error
            error_log("Table check failed: " . $e->getMessage());
        }

        // Get all active assignments for this client
        $sql = "SELECT
            cp.id,
            cp.client_id,
            cp.provider_id,
            cp.role,
            cp.assigned_at,
            cp.notes,
            u.first_name,
            u.last_name,
            u.user_type,
            u.credentials,
            CONCAT(u.first_name, ' ', u.last_name) as provider_name,
            CONCAT(ab.first_name, ' ', ab.last_name) as assigned_by_name
        FROM client_providers cp
        JOIN users u ON cp.provider_id = u.id
        LEFT JOIN users ab ON cp.assigned_by = ab.id
        WHERE cp.client_id = ?
        AND cp.ended_at IS NULL
        ORDER BY
            FIELD(cp.role, 'primary_clinician', 'clinician', 'social_worker', 'supervisor', 'intern'),
            cp.assigned_at";

        $providers = $db->queryAll($sql, [$clientId]);

        echo json_encode([
            'success' => true,
            'providers' => $providers
        ]);
        exit;
    }

    // POST: Add, update, or remove assignment
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? 'add';

        // Only admins can modify assignments
        if ($currentUserType !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Only administrators can modify provider assignments']);
            exit;
        }

        switch ($action) {
            case 'add':
                $clientId = intval($input['client_id'] ?? 0);
                $providerId = intval($input['provider_id'] ?? 0);
                $role = $input['role'] ?? 'clinician';
                $notes = $input['notes'] ?? null;

                if (!$clientId || !$providerId) {
                    http_response_code(400);
                    echo json_encode(['error' => 'client_id and provider_id are required']);
                    exit;
                }

                // Validate role
                $validRoles = ['primary_clinician', 'clinician', 'social_worker', 'supervisor', 'intern'];
                if (!in_array($role, $validRoles)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid role']);
                    exit;
                }

                // Check if assignment already exists
                $existing = $db->queryOne(
                    "SELECT id FROM client_providers WHERE client_id = ? AND provider_id = ? AND role = ? AND ended_at IS NULL",
                    [$clientId, $providerId, $role]
                );

                if ($existing) {
                    http_response_code(400);
                    echo json_encode(['error' => 'This provider is already assigned with this role']);
                    exit;
                }

                // If adding a primary_clinician, end any existing primary_clinician assignment
                if ($role === 'primary_clinician') {
                    $db->execute(
                        "UPDATE client_providers SET ended_at = CURRENT_DATE WHERE client_id = ? AND role = 'primary_clinician' AND ended_at IS NULL",
                        [$clientId]
                    );
                }

                // Add the assignment
                $db->execute(
                    "INSERT INTO client_providers (client_id, provider_id, role, assigned_at, assigned_by, notes) VALUES (?, ?, ?, CURRENT_DATE, ?, ?)",
                    [$clientId, $providerId, $role, $currentUserId, $notes]
                );

                $newId = $db->getLastInsertId();

                echo json_encode([
                    'success' => true,
                    'message' => 'Provider assigned successfully',
                    'assignment_id' => $newId
                ]);
                break;

            case 'remove':
                $assignmentId = intval($input['assignment_id'] ?? 0);

                if (!$assignmentId) {
                    http_response_code(400);
                    echo json_encode(['error' => 'assignment_id is required']);
                    exit;
                }

                // Soft delete by setting ended_at
                $db->execute(
                    "UPDATE client_providers SET ended_at = CURRENT_DATE WHERE id = ?",
                    [$assignmentId]
                );

                echo json_encode([
                    'success' => true,
                    'message' => 'Provider assignment removed'
                ]);
                break;

            case 'update_role':
                $assignmentId = intval($input['assignment_id'] ?? 0);
                $newRole = $input['role'] ?? null;

                if (!$assignmentId || !$newRole) {
                    http_response_code(400);
                    echo json_encode(['error' => 'assignment_id and role are required']);
                    exit;
                }

                // Validate role
                $validRoles = ['primary_clinician', 'clinician', 'social_worker', 'supervisor', 'intern'];
                if (!in_array($newRole, $validRoles)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Invalid role']);
                    exit;
                }

                // Get the current assignment info
                $current = $db->queryOne(
                    "SELECT client_id, provider_id FROM client_providers WHERE id = ?",
                    [$assignmentId]
                );

                if (!$current) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Assignment not found']);
                    exit;
                }

                // If changing to primary_clinician, end any existing primary_clinician
                if ($newRole === 'primary_clinician') {
                    $db->execute(
                        "UPDATE client_providers SET ended_at = CURRENT_DATE WHERE client_id = ? AND role = 'primary_clinician' AND ended_at IS NULL AND id != ?",
                        [$current['client_id'], $assignmentId]
                    );
                }

                $db->execute(
                    "UPDATE client_providers SET role = ? WHERE id = ?",
                    [$newRole, $assignmentId]
                );

                echo json_encode([
                    'success' => true,
                    'message' => 'Role updated successfully'
                ]);
                break;

            default:
                http_response_code(400);
                echo json_encode(['error' => 'Invalid action']);
        }
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);

} catch (Exception $e) {
    error_log("Client providers API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}
