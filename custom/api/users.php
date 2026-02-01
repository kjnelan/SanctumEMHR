<?php
/**
 * SanctumEMHR EMHR - Users API (MIGRATED TO SanctumEMHR)
 * Handles user management operations
 *
 * @package   SanctumEMHR
 * @author    Kenneth J. Nelan / Sacred Wandering
 * @copyright Copyright (c) 2026 Sacred Wandering
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;
use Custom\Lib\Auth\CustomAuth;

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
            if (!$action || $action === 'list') {
                // List all users with filters
                $search = $_GET['search'] ?? '';
                $status = $_GET['status'] ?? '';

                $sql = "SELECT
                    u.id,
                    u.username,
                    u.first_name AS fname,
                    u.middle_name AS mname,
                    u.last_name AS lname,
                    u.email,
                    u.npi,
                    u.license_number,
                    u.license_state,
                    u.title,
                    u.is_supervisor,
                    CAST(u.is_provider AS CHAR) AS authorized,
                    CAST(u.is_active AS CHAR) AS active,
                    CAST(CASE WHEN u.user_type = 'admin' THEN 1 ELSE 0 END AS CHAR) AS calendar,
                    u.phone,
                    u.mobile AS phonecell,
                    u.user_type,
                    u.color,
                    u.failed_login_attempts,
                    u.locked_until,
                    CAST(CASE WHEN u.locked_until IS NOT NULL AND u.locked_until > NOW() THEN 1 ELSE 0 END AS CHAR) AS is_locked
                FROM users u
                WHERE 1=1";

                $params = [];

                if ($search) {
                    $sql .= " AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.username LIKE ? OR u.email LIKE ?)";
                    $searchParam = "%$search%";
                    $params[] = $searchParam;
                    $params[] = $searchParam;
                    $params[] = $searchParam;
                    $params[] = $searchParam;
                }

                if ($status === 'active') {
                    $sql .= " AND u.is_active = 1";
                } elseif ($status === 'inactive') {
                    $sql .= " AND u.is_active = 0";
                }

                $sql .= " ORDER BY u.last_name, u.first_name";

                $users = $db->queryAll($sql, $params);

                http_response_code(200);
                echo json_encode(['users' => $users]);

            } elseif ($action === 'get') {
                // Get single user
                $userId = $_GET['id'] ?? null;

                if (!$userId) {
                    http_response_code(400);
                    echo json_encode(['error' => 'User ID required']);
                    exit;
                }

                $sql = "SELECT
                    id,
                    username,
                    first_name AS fname,
                    middle_name AS mname,
                    last_name AS lname,
                    title,
                    suffix,
                    email,
                    phone,
                    mobile AS phonecell,
                    fax,
                    npi,
                    license_number AS state_license_number,
                    license_state,
                    federal_tax_id AS federaltaxid,
                    taxonomy,
                    CAST(is_provider AS CHAR) AS authorized,
                    CAST(is_active AS CHAR) AS active,
                    CAST(is_supervisor AS CHAR) AS is_supervisor,
                    CAST(portal_user AS CHAR) AS portal_user,
                    CAST(CASE WHEN user_type = 'admin' THEN 1 ELSE 0 END AS CHAR) AS calendar,
                    user_type,
                    color,
                    supervisor_id,
                    facility_id,
                    notes
                FROM users
                WHERE id = ?";

                $user = $db->query($sql, [$userId]);

                if (!$user) {
                    http_response_code(404);
                    echo json_encode(['error' => 'User not found']);
                    exit;
                }

                http_response_code(200);
                echo json_encode(['user' => $user]);

            } elseif ($action === 'supervisors') {
                // Get list of potential supervisors (providers and admins)
                $sql = "SELECT
                    id,
                    username,
                    CONCAT(first_name, ' ', last_name) AS full_name,
                    first_name AS fname,
                    last_name AS lname,
                    user_type,
                    is_provider
                FROM users
                WHERE is_active = 1
                AND (is_provider = 1 OR user_type = 'admin')
                ORDER BY last_name, first_name";

                $supervisors = $db->queryAll($sql);

                http_response_code(200);
                echo json_encode(['supervisors' => $supervisors]);

            } elseif ($action === 'facilities') {
                // Get list of facilities for dropdown
                $sql = "SELECT
                    id,
                    name,
                    facility_type,
                    is_primary
                FROM facilities
                WHERE is_active = 1
                ORDER BY is_primary DESC, name";

                $facilities = $db->queryAll($sql);

                http_response_code(200);
                echo json_encode(['facilities' => $facilities]);

            } elseif ($action === 'user_supervisors') {
                // Get supervisors assigned to a specific user from user_supervisors table
                $userId = $_GET['id'] ?? null;

                if (!$userId) {
                    http_response_code(400);
                    echo json_encode(['error' => 'User ID required']);
                    exit;
                }

                $sql = "SELECT supervisor_id, relationship_type, started_at, ended_at
                        FROM user_supervisors
                        WHERE user_id = ?
                        AND (ended_at IS NULL OR ended_at > CURDATE())
                        ORDER BY started_at DESC";

                $supervisors = $db->queryAll($sql, [$userId]);
                $supervisorIds = array_map(fn($s) => $s['supervisor_id'], $supervisors);

                http_response_code(200);
                echo json_encode([
                    'supervisor_ids' => $supervisorIds,
                    'relationships' => $supervisors
                ]);

            } elseif ($action === 'unlock') {
                // Unlock a locked user account
                $userId = $_GET['id'] ?? null;

                if (!$userId) {
                    http_response_code(400);
                    echo json_encode(['error' => 'User ID required']);
                    exit;
                }

                // Check if requesting user is admin
                $currentUser = $session->get('user');
                if (!$currentUser || $currentUser['user_type'] !== 'admin') {
                    http_response_code(403);
                    echo json_encode(['error' => 'Only administrators can unlock accounts']);
                    exit;
                }

                $unlockSql = "UPDATE users
                              SET locked_until = NULL,
                                  failed_login_attempts = 0
                              WHERE id = ?";

                $db->execute($unlockSql, [$userId]);

                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Account unlocked successfully'
                ]);
            }
            break;

        case 'POST':
            // Create new user
            $username = $input['username'] ?? null;
            $password = $input['password'] ?? null;
            $fname = $input['fname'] ?? null;
            $lname = $input['lname'] ?? null;
            $email = $input['email'] ?? null;

            if (!$username || !$password || !$fname || !$lname || !$email) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing required fields']);
                exit;
            }

            // Check if username exists
            $checkSql = "SELECT id FROM users WHERE username = ?";
            $existing = $db->query($checkSql, [$username]);

            if ($existing) {
                http_response_code(409);
                echo json_encode(['error' => 'Username already exists']);
                exit;
            }

            // Create user using CustomAuth
            $auth = new CustomAuth($db);
            $result = $auth->createUser([
                'username' => $username,
                'password' => $password,
                'email' => $email,
                'first_name' => $fname,
                'last_name' => $lname,
                'middle_name' => $input['mname'] ?? null,
                'title' => $input['title'] ?? null,
                'suffix' => $input['suffix'] ?? null,
                'user_type' => $input['user_type'] ?? 'staff',
                'is_provider' => ($input['authorized'] ?? 0) ? 1 : 0,
                'is_active' => ($input['active'] ?? 1) ? 1 : 0,
                'is_supervisor' => ($input['is_supervisor'] ?? 0) ? 1 : 0,
                'portal_user' => ($input['portal_user'] ?? 0) ? 1 : 0,
                'npi' => $input['npi'] ?? null,
                'license_number' => $input['state_license_number'] ?? null,
                'license_state' => $input['license_state'] ?? null,
                'federal_tax_id' => $input['federaltaxid'] ?? null,
                'taxonomy' => $input['taxonomy'] ?? null,
                'phone' => $input['phone'] ?? null,
                'mobile' => $input['phonecell'] ?? null,
                'fax' => $input['fax'] ?? null,
                'supervisor_id' => $input['supervisor_id'] ?? null,
                'facility_id' => $input['facility_id'] ?? null,
                'notes' => $input['notes'] ?? null
            ]);

            if (!$result['success']) {
                http_response_code(500);
                echo json_encode(['error' => $result['message']]);
                exit;
            }

            $newUserId = $result['user_id'];

            // Handle supervisor relationships
            if (!empty($input['supervisor_ids']) && is_array($input['supervisor_ids'])) {
                $relationshipType = $input['relationship_type'] ?? 'direct';
                $startedAt = date('Y-m-d');

                foreach ($input['supervisor_ids'] as $supervisorId) {
                    if (empty($supervisorId)) continue;

                    $insertSql = "INSERT INTO user_supervisors
                                  (user_id, supervisor_id, relationship_type, started_at)
                                  VALUES (?, ?, ?, ?)";

                    try {
                        $db->execute($insertSql, [$newUserId, $supervisorId, $relationshipType, $startedAt]);
                    } catch (\Exception $e) {
                        error_log("Error creating supervisor relationship: " . $e->getMessage());
                    }
                }
            }

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'id' => $newUserId,
                'message' => 'User created successfully'
            ]);
            break;

        case 'PUT':
            // Update user
            $userId = $input['id'] ?? null;

            if (!$userId) {
                http_response_code(400);
                echo json_encode(['error' => 'User ID required']);
                exit;
            }

            // Check if user exists
            $checkSql = "SELECT id FROM users WHERE id = ?";
            $existing = $db->query($checkSql, [$userId]);

            if (!$existing) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found']);
                exit;
            }

            // Build update query
            $updateFields = [];
            $params = [];

            $fieldMap = [
                'fname' => 'first_name',
                'mname' => 'middle_name',
                'lname' => 'last_name',
                'title' => 'title',
                'suffix' => 'suffix',
                'email' => 'email',
                'phone' => 'phone',
                'phonecell' => 'mobile',
                'fax' => 'fax',
                'npi' => 'npi',
                'state_license_number' => 'license_number',
                'license_state' => 'license_state',
                'federaltaxid' => 'federal_tax_id',
                'taxonomy' => 'taxonomy',
                'color' => 'color',
                'supervisor_id' => 'supervisor_id',
                'facility_id' => 'facility_id',
                'notes' => 'notes'
            ];

            foreach ($fieldMap as $inputKey => $dbField) {
                if (isset($input[$inputKey])) {
                    $updateFields[] = "$dbField = ?";
                    $params[] = $input[$inputKey] ?: null; // Empty strings become NULL
                }
            }

            if (isset($input['authorized'])) {
                $updateFields[] = "is_provider = ?";
                $params[] = $input['authorized'] ? 1 : 0;
            }

            if (isset($input['active'])) {
                $updateFields[] = "is_active = ?";
                $params[] = $input['active'] ? 1 : 0;
            }

            if (isset($input['is_supervisor'])) {
                $updateFields[] = "is_supervisor = ?";
                $params[] = $input['is_supervisor'] ? 1 : 0;
            }

            if (isset($input['portal_user'])) {
                $updateFields[] = "portal_user = ?";
                $params[] = $input['portal_user'] ? 1 : 0;
            }

            if (isset($input['user_type'])) {
                $updateFields[] = "user_type = ?";
                $params[] = $input['user_type'];
            }

            // Handle password change if provided
            if (isset($input['password']) && !empty($input['password'])) {
                $auth = new CustomAuth($db);
                $passwordResult = $auth->changePassword($userId, $input['password']);

                if (!$passwordResult['success']) {
                    http_response_code(400);
                    echo json_encode(['error' => $passwordResult['message']]);
                    exit;
                }
            }

            if (empty($updateFields)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                exit;
            }

            $params[] = $userId;
            $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $db->execute($sql, $params);

            // Handle supervisor relationships if provided
            if (isset($input['supervisor_ids']) && is_array($input['supervisor_ids'])) {
                // End all existing supervisor relationships
                $endSql = "UPDATE user_supervisors SET ended_at = CURDATE() WHERE user_id = ? AND ended_at IS NULL";
                $db->execute($endSql, [$userId]);

                // Add new supervisor relationships
                $relationshipType = $input['relationship_type'] ?? 'direct';
                $startedAt = date('Y-m-d');

                foreach ($input['supervisor_ids'] as $supervisorId) {
                    if (empty($supervisorId)) continue;

                    // Check if this relationship already exists and is active
                    $checkSql = "SELECT id FROM user_supervisors
                                 WHERE user_id = ? AND supervisor_id = ?
                                 AND started_at = ?";
                    $existing = $db->query($checkSql, [$userId, $supervisorId, $startedAt]);

                    if (!$existing) {
                        $insertSql = "INSERT INTO user_supervisors
                                      (user_id, supervisor_id, relationship_type, started_at)
                                      VALUES (?, ?, ?, ?)";

                        try {
                            $db->execute($insertSql, [$userId, $supervisorId, $relationshipType, $startedAt]);
                        } catch (\Exception $e) {
                            error_log("Error creating supervisor relationship: " . $e->getMessage());
                        }
                    }
                }
            }

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'User updated successfully']);
            break;

        case 'DELETE':
            // Soft delete user
            $userId = $_GET['id'] ?? $input['id'] ?? null;

            if (!$userId) {
                http_response_code(400);
                echo json_encode(['error' => 'User ID required']);
                exit;
            }

            $sql = "UPDATE users SET deleted_at = NOW(), is_active = 0 WHERE id = ?";
            $db->execute($sql, [$userId]);

            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }

} catch (\Exception $e) {
    error_log("Users API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error', 'message' => $e->getMessage()]);
}
