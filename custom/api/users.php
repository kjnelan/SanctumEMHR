<?php
/**
 * User Management API
 * Full CRUD operations for system users/providers
 * Uses OpenEMR's existing users table schema
 */

// Start output buffering
ob_start();

// TEMPORARY: Enable error display for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// IMPORTANT: Set these BEFORE loading globals.php
$ignoreAuth = true;
$ignoreAuth_onsite_portal = true;
$ignoreAuth_onsite_portal_two = true;

require_once(__DIR__ . '/../../interface/globals.php');

// Clear any output
ob_end_clean();

// Enable error logging only
error_log("Users API called - Session ID: " . session_id());

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

// Check authentication
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Users API: Not authenticated");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            $action = $_GET['action'] ?? 'list';

            if ($action === 'list') {
                // List all users
                $search = $_GET['search'] ?? '';
                $status = $_GET['status'] ?? ''; // active, inactive, all

                $sql = "SELECT
                    u.id,
                    u.username,
                    u.fname,
                    u.mname,
                    u.lname,
                    u.suffix,
                    u.title,
                    u.npi,
                    u.federaltaxid,
                    u.taxonomy,
                    u.state_license_number,
                    u.facility,
                    u.facility_id,
                    u.specialty,
                    u.authorized,
                    u.calendar,
                    u.portal_user,
                    u.active,
                    u.email,
                    u.phone,
                    u.phonecell,
                    u.supervisor_id,
                    u.notes,
                    sup.fname AS supervisor_fname,
                    sup.lname AS supervisor_lname
                FROM users u
                LEFT JOIN users sup ON u.supervisor_id = sup.id
                WHERE 1=1";

                $params = [];

                // Apply search filter
                if ($search) {
                    $sql .= " AND (u.fname LIKE ? OR u.lname LIKE ? OR u.username LIKE ? OR u.email LIKE ?)";
                    $searchParam = "%$search%";
                    $params[] = $searchParam;
                    $params[] = $searchParam;
                    $params[] = $searchParam;
                    $params[] = $searchParam;
                }

                // Apply status filter
                if ($status === 'active') {
                    $sql .= " AND u.active = 1";
                } elseif ($status === 'inactive') {
                    $sql .= " AND u.active = 0";
                }

                $sql .= " ORDER BY u.lname, u.fname";

                $result = sqlStatement($sql, $params);

                $users = [];
                while ($row = sqlFetchArray($result)) {
                    $users[] = $row;
                }

                http_response_code(200);
                echo json_encode(['users' => $users]);

            } elseif ($action === 'get') {
                // Get single user details
                $userId = $_GET['id'] ?? null;

                error_log("Users API: Get user - ID: $userId");

                if (!$userId) {
                    error_log("Users API: No user ID provided");
                    http_response_code(400);
                    echo json_encode(['error' => 'User ID required']);
                    exit;
                }

                // Be explicit about columns instead of SELECT * to avoid binary/problematic data
                $sql = "SELECT
                    u.id,
                    u.username,
                    u.fname,
                    u.mname,
                    u.lname,
                    u.suffix,
                    u.title,
                    u.email,
                    u.phone,
                    u.phonecell,
                    u.npi,
                    u.federaltaxid,
                    u.taxonomy,
                    u.state_license_number,
                    u.supervisor_id,
                    u.facility_id,
                    u.authorized,
                    u.is_supervisor,
                    u.active,
                    u.calendar,
                    u.portal_user,
                    u.see_auth,
                    u.notes,
                    sup.fname AS supervisor_fname,
                    sup.lname AS supervisor_lname
                FROM users u
                LEFT JOIN users sup ON u.supervisor_id = sup.id
                WHERE u.id = ?";

                error_log("Users API: Executing query for user ID: $userId");
                $user = sqlQuery($sql, [$userId]);

                if (!$user) {
                    error_log("Users API: User not found - ID: $userId");
                    http_response_code(404);
                    echo json_encode(['error' => 'User not found']);
                    exit;
                }

                error_log("Users API: User found - ID: $userId, Username: " . ($user['username'] ?? 'unknown'));
                http_response_code(200);
                echo json_encode(['user' => $user]);

            } elseif ($action === 'supervisors') {
                // Get list of potential supervisors (users marked as supervisors)
                $sql = "SELECT id, fname, lname, title
                        FROM users
                        WHERE active = 1 AND is_supervisor = 1
                        ORDER BY lname, fname";

                $result = sqlStatement($sql);
                $supervisors = [];
                while ($row = sqlFetchArray($result)) {
                    $supervisors[] = $row;
                }

                http_response_code(200);
                echo json_encode(['supervisors' => $supervisors]);

            } elseif ($action === 'facilities') {
                // Get list of facilities
                $sql = "SELECT id, name, street, city, state, postal_code
                        FROM facility
                        ORDER BY name";

                $result = sqlStatement($sql);
                $facilities = [];
                while ($row = sqlFetchArray($result)) {
                    $facilities[] = $row;
                }

                http_response_code(200);
                echo json_encode(['facilities' => $facilities]);
            }
            break;

        case 'POST':
            // Create new user
            $username = $input['username'] ?? null;
            $password = $input['password'] ?? null;
            $fname = $input['fname'] ?? null;
            $lname = $input['lname'] ?? null;

            if (!$username || !$password || !$fname || !$lname) {
                http_response_code(400);
                echo json_encode(['error' => 'Username, password, first name, and last name are required']);
                exit;
            }

            // Check if username exists
            $checkSql = "SELECT id FROM users WHERE username = ?";
            $existing = sqlQuery($checkSql, [$username]);

            if ($existing) {
                http_response_code(409);
                echo json_encode(['error' => 'Username already exists']);
                exit;
            }

            // Hash password
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

            // Insert user - matching OpenEMR schema exactly
            $insertSql = "INSERT INTO users (
                username,
                password,
                fname,
                mname,
                lname,
                suffix,
                title,
                email,
                phone,
                phonecell,
                npi,
                federaltaxid,
                taxonomy,
                state_license_number,
                supervisor_id,
                facility_id,
                authorized,
                is_supervisor,
                active,
                calendar,
                portal_user,
                see_auth,
                notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            $params = [
                $username,
                $hashedPassword,
                $fname,
                $input['mname'] ?? '',
                $lname,
                $input['suffix'] ?? '',
                $input['title'] ?? '', // Professional credentials
                $input['email'] ?? '',
                $input['phone'] ?? '',
                $input['phonecell'] ?? '',
                $input['npi'] ?? '',
                $input['federaltaxid'] ?? '',
                $input['taxonomy'] ?? '207Q00000X', // Default taxonomy
                $input['state_license_number'] ?? '',
                $input['supervisor_id'] ?? 0,
                $input['facility_id'] ?? 0,
                $input['authorized'] ?? 0, // Is provider
                $input['is_supervisor'] ?? 0, // Is supervisor
                $input['active'] ?? 1,
                $input['calendar'] ?? 0, // Is admin
                $input['portal_user'] ?? 0,
                $input['see_auth'] ?? 1,
                $input['notes'] ?? ''
            ];

            $userId = sqlInsert($insertSql, $params);

            error_log("User created - ID: $userId, Username: $username");

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'user_id' => $userId,
                'message' => 'User created successfully'
            ]);
            break;

        case 'PUT':
            // Update user
            $userId = $input['id'] ?? null;

            if (!$userId) {
                http_response_code(400);
                echo json_encode(['error' => 'User ID is required']);
                exit;
            }

            // Check if user exists
            $checkSql = "SELECT id FROM users WHERE id = ?";
            $existing = sqlQuery($checkSql, [$userId]);

            if (!$existing) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found']);
                exit;
            }

            // Build update query - matching OpenEMR schema
            $updateSql = "UPDATE users SET
                fname = ?,
                mname = ?,
                lname = ?,
                suffix = ?,
                title = ?,
                email = ?,
                phone = ?,
                phonecell = ?,
                npi = ?,
                federaltaxid = ?,
                taxonomy = ?,
                state_license_number = ?,
                supervisor_id = ?,
                facility_id = ?,
                authorized = ?,
                is_supervisor = ?,
                active = ?,
                calendar = ?,
                portal_user = ?,
                see_auth = ?,
                notes = ?
            WHERE id = ?";

            $params = [
                $input['fname'],
                $input['mname'] ?? '',
                $input['lname'],
                $input['suffix'] ?? '',
                $input['title'] ?? '',
                $input['email'] ?? '',
                $input['phone'] ?? '',
                $input['phonecell'] ?? '',
                $input['npi'] ?? '',
                $input['federaltaxid'] ?? '',
                $input['taxonomy'] ?? '207Q00000X',
                $input['state_license_number'] ?? '',
                $input['supervisor_id'] ?? 0,
                $input['facility_id'] ?? 0,
                $input['authorized'] ?? 0,
                $input['is_supervisor'] ?? 0,
                $input['active'] ?? 1,
                $input['calendar'] ?? 0,
                $input['portal_user'] ?? 0,
                $input['see_auth'] ?? 1,
                $input['notes'] ?? '',
                $userId
            ];

            sqlStatement($updateSql, $params);

            // Update password if provided
            if (!empty($input['password'])) {
                $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
                $pwdSql = "UPDATE users SET password = ? WHERE id = ?";
                sqlStatement($pwdSql, [$hashedPassword, $userId]);
            }

            error_log("User updated - ID: $userId");

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'User updated successfully'
            ]);
            break;

        case 'DELETE':
            // Deactivate user (soft delete)
            $userId = $_GET['id'] ?? null;

            if (!$userId) {
                http_response_code(400);
                echo json_encode(['error' => 'User ID is required']);
                exit;
            }

            // Don't actually delete, just deactivate
            $deactivateSql = "UPDATE users SET active = 0 WHERE id = ?";
            sqlStatement($deactivateSql, [$userId]);

            error_log("User deactivated - ID: $userId");

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'User deactivated successfully'
            ]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    error_log("Error in users API: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => $e->getMessage()
    ]);
}
