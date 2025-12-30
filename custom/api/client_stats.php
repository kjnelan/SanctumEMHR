<?php
/**
 * Client Statistics API - Session-based
 * Returns statistics about clients/patients
 */

// IMPORTANT: Set these BEFORE loading globals.php to prevent redirects
$ignoreAuth = true;
$ignoreAuth_onsite_portal = true;
$ignoreAuth_onsite_portal_two = true;

require_once(__DIR__ . '/../../interface/globals.php');

error_log("Client stats called - Session ID: " . session_id());

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Client stats: Not authenticated");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

error_log("Client stats: User authenticated - " . $_SESSION['authUserID']);

try {
    $stats = [
        'activeClients' => 0,
        'inactiveClients' => 0,
        'dischargedClients' => 0,
        'totalClients' => 0,
        'todayClients' => 0,
        'newClients' => 0
    ];

    // Count total clients in database - simplest query first
    try {
        $totalClientsSql = "SELECT COUNT(*) as count FROM patient_data";
        error_log("Total clients SQL: " . $totalClientsSql);
        $totalClientsStmt = sqlStatement($totalClientsSql);
        $totalClientsRow = sqlFetchArray($totalClientsStmt);
        $stats['totalClients'] = intval($totalClientsRow['count'] ?? 0);
        error_log("Total clients: " . $stats['totalClients']);
    } catch (Exception $e) {
        error_log('Total clients error: ' . $e->getMessage());
    }

    // Count active clients (based on care_team_status field)
    try {
        $activeClientsSql = "SELECT COUNT(*) as count
                             FROM patient_data
                             WHERE care_team_status = 'active'
                             OR care_team_status = 'Active'";
        error_log("Active clients SQL: " . $activeClientsSql);
        $activeClientsStmt = sqlStatement($activeClientsSql);
        $activeClientsRow = sqlFetchArray($activeClientsStmt);
        $stats['activeClients'] = intval($activeClientsRow['count'] ?? 0);
        error_log("Active clients: " . $stats['activeClients']);
    } catch (Exception $e) {
        error_log('Active clients error: ' . $e->getMessage());
    }

    // Count inactive clients (for additional reporting)
    try {
        $inactiveClientsSql = "SELECT COUNT(*) as count
                               FROM patient_data
                               WHERE care_team_status = 'inactive'
                               OR care_team_status = 'Inactive'";
        $inactiveClientsStmt = sqlStatement($inactiveClientsSql);
        $inactiveClientsRow = sqlFetchArray($inactiveClientsStmt);
        $stats['inactiveClients'] = intval($inactiveClientsRow['count'] ?? 0);
        error_log("Inactive clients: " . $stats['inactiveClients']);
    } catch (Exception $e) {
        error_log('Inactive clients error: ' . $e->getMessage());
    }

    // Count discharged clients
    try {
        $dischargedClientsSql = "SELECT COUNT(*) as count
                                 FROM patient_data
                                 WHERE care_team_status LIKE '%discharged%'
                                 OR care_team_status LIKE '%Discharged%'";
        $dischargedClientsStmt = sqlStatement($dischargedClientsSql);
        $dischargedClientsRow = sqlFetchArray($dischargedClientsStmt);
        $stats['dischargedClients'] = intval($dischargedClientsRow['count'] ?? 0);
        error_log("Discharged clients: " . $stats['dischargedClients']);
    } catch (Exception $e) {
        error_log('Discharged clients error: ' . $e->getMessage());
    }

    // Count clients with appointments today
    try {
        $today = date('Y-m-d');
        $todayClientsSql = "SELECT COUNT(DISTINCT pc_pid) as count
                            FROM openemr_postcalendar_events
                            WHERE pc_eventDate = ?
                            AND pc_pid IS NOT NULL
                            AND pc_pid != ''
                            AND pc_pid != '0'";
        error_log("Today clients SQL: " . $todayClientsSql . " | Date: " . $today);
        $todayClientsStmt = sqlStatement($todayClientsSql, [$today]);
        $todayClientsRow = sqlFetchArray($todayClientsStmt);
        $stats['todayClients'] = intval($todayClientsRow['count'] ?? 0);
        error_log("Today clients: " . $stats['todayClients']);
    } catch (Exception $e) {
        error_log('Today clients error: ' . $e->getMessage());
    }

    // Count new clients in last 30 days
    try {
        $thirtyDaysAgo = date('Y-m-d', strtotime('-30 days'));
        $newClientsSql = "SELECT COUNT(*) as count
                          FROM patient_data
                          WHERE DATE(date) >= ?";
        error_log("New clients SQL: " . $newClientsSql . " | Date: " . $thirtyDaysAgo);
        $newClientsStmt = sqlStatement($newClientsSql, [$thirtyDaysAgo]);
        $newClientsRow = sqlFetchArray($newClientsStmt);
        $stats['newClients'] = intval($newClientsRow['count'] ?? 0);
        error_log("New clients: " . $stats['newClients']);
    } catch (Exception $e) {
        error_log('New clients error: ' . $e->getMessage());
    }

    error_log("Final client stats: " . print_r($stats, true));
    echo json_encode($stats);

} catch (Exception $e) {
    error_log('Client stats overall error: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch statistics', 'message' => $e->getMessage()]);
}
