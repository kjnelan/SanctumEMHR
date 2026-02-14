<?php
/**
 * SanctumEMHR - Audit Log Viewer API
 *
 * Returns audit log entries for compliance and security review.
 * Admin-only access.
 *
 * Query Parameters:
 * - limit: Number of entries to return (default: 100, max: 1000)
 * - action: Filter by action type (e.g., 'login_success', 'view_client')
 * - user_id: Filter by user ID
 * - resource_type: Filter by resource type (e.g., 'client', 'note')
 * - resource_id: Filter by resource ID
 * - start_date: Filter by start date (YYYY-MM-DD)
 * - end_date: Filter by end date (YYYY-MM-DD)
 *
 * @package SanctumEMHR
 */

require_once dirname(__FILE__, 2) . "/init.php";

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;
use Custom\Lib\Audit\AuditLogger;

// CORS headers
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only GET allowed
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize services
    $db = Database::getInstance();
    $session = SessionManager::getInstance();

    // Start session
    $session->start();

    // Check authentication
    if (!$session->isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    // Check admin permission
    $userId = $session->getUserId();
    $userSql = "SELECT user_type FROM users WHERE id = ?";
    $user = $db->query($userSql, [$userId]);

    if (!$user || $user['user_type'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Admin access required']);
        exit;
    }

    // Get query parameters
    $limit = min((int) ($_GET['limit'] ?? 100), 1000);
    $action = $_GET['action'] ?? null;
    $filterUserId = $_GET['user_id'] ?? null;
    $resourceType = $_GET['resource_type'] ?? null;
    $resourceId = $_GET['resource_id'] ?? null;
    $startDate = $_GET['start_date'] ?? null;
    $endDate = $_GET['end_date'] ?? null;

    // Build query
    $sql = "SELECT
                al.id,
                al.user_id,
                CONCAT(u.fname, ' ', u.lname) AS user_name,
                u.username,
                al.action,
                al.resource_type,
                al.resource_id,
                al.details,
                al.ip_address,
                al.created_at
            FROM audit_logs al
            LEFT JOIN users u ON u.id = al.user_id
            WHERE 1=1";

    $params = [];

    if ($action) {
        $sql .= " AND al.action = ?";
        $params[] = $action;
    }

    if ($filterUserId) {
        $sql .= " AND al.user_id = ?";
        $params[] = $filterUserId;
    }

    if ($resourceType) {
        $sql .= " AND al.resource_type = ?";
        $params[] = $resourceType;
    }

    if ($resourceId) {
        $sql .= " AND al.resource_id = ?";
        $params[] = $resourceId;
    }

    if ($startDate) {
        $sql .= " AND DATE(al.created_at) >= ?";
        $params[] = $startDate;
    }

    if ($endDate) {
        $sql .= " AND DATE(al.created_at) <= ?";
        $params[] = $endDate;
    }

    $sql .= " ORDER BY al.created_at DESC LIMIT ?";
    $params[] = $limit;

    // Execute query
    $logs = $db->queryAll($sql, $params);

    // Parse JSON details
    foreach ($logs as &$log) {
        if ($log['details']) {
            $log['details'] = json_decode($log['details'], true);
        }
    }

    // Get summary statistics
    $statsSql = "SELECT
                    COUNT(*) as total_events,
                    COUNT(DISTINCT user_id) as unique_users,
                    COUNT(DISTINCT DATE(created_at)) as days_with_activity,
                    MIN(created_at) as first_event,
                    MAX(created_at) as last_event
                 FROM audit_logs
                 WHERE 1=1";

    $statsParams = [];

    if ($startDate) {
        $statsSql .= " AND DATE(created_at) >= ?";
        $statsParams[] = $startDate;
    }

    if ($endDate) {
        $statsSql .= " AND DATE(created_at) <= ?";
        $statsParams[] = $endDate;
    }

    $stats = $db->query($statsSql, $statsParams);

    // Get action breakdown
    $actionSql = "SELECT
                    action,
                    COUNT(*) as count
                  FROM audit_logs
                  WHERE 1=1";

    $actionParams = [];

    if ($startDate) {
        $actionSql .= " AND DATE(created_at) >= ?";
        $actionParams[] = $startDate;
    }

    if ($endDate) {
        $actionSql .= " AND DATE(created_at) <= ?";
        $actionParams[] = $endDate;
    }

    $actionSql .= " GROUP BY action ORDER BY count DESC LIMIT 20";

    $actionBreakdown = $db->queryAll($actionSql, $actionParams);

    // Return response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'logs' => $logs,
        'count' => count($logs),
        'limit' => $limit,
        'filters' => [
            'action' => $action,
            'user_id' => $filterUserId,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'start_date' => $startDate,
            'end_date' => $endDate
        ],
        'statistics' => $stats,
        'action_breakdown' => $actionBreakdown
    ]);

} catch (\Exception $e) {
    error_log("Audit log viewer error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to retrieve audit logs']);
}
