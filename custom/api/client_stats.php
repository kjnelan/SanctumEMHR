<?php
/**
 * Client Statistics API - Session-based (MIGRATED TO MINDLINE)
 * Returns statistics about clients/patients
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

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

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Client stats: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    error_log("Client stats: User authenticated - " . $session->getUserId());

    // Initialize database
    $db = Database::getInstance();

    $stats = [
        'activeClients' => 0,
        'inactiveClients' => 0,
        'dischargedClients' => 0,
        'totalClients' => 0,
        'todayClients' => 0,
        'newClients' => 0
    ];

    // Count total clients in database
    try {
        $totalClientsSql = "SELECT COUNT(*) as count FROM clients";
        error_log("Total clients SQL: " . $totalClientsSql);
        $totalClientsRow = $db->query($totalClientsSql);
        $stats['totalClients'] = intval($totalClientsRow['count'] ?? 0);
        error_log("Total clients: " . $stats['totalClients']);
    } catch (Exception $e) {
        error_log('Total clients error: ' . $e->getMessage());
    }

    // Count active clients (based on status field)
    try {
        $activeClientsSql = "SELECT COUNT(*) as count
                             FROM clients
                             WHERE status = 'active'";
        error_log("Active clients SQL: " . $activeClientsSql);
        $activeClientsRow = $db->query($activeClientsSql);
        $stats['activeClients'] = intval($activeClientsRow['count'] ?? 0);
        error_log("Active clients: " . $stats['activeClients']);
    } catch (Exception $e) {
        error_log('Active clients error: ' . $e->getMessage());
    }

    // Count inactive clients
    try {
        $inactiveClientsSql = "SELECT COUNT(*) as count
                               FROM clients
                               WHERE status = 'inactive'";
        $inactiveClientsRow = $db->query($inactiveClientsSql);
        $stats['inactiveClients'] = intval($inactiveClientsRow['count'] ?? 0);
        error_log("Inactive clients: " . $stats['inactiveClients']);
    } catch (Exception $e) {
        error_log('Inactive clients error: ' . $e->getMessage());
    }

    // Count discharged clients
    try {
        $dischargedClientsSql = "SELECT COUNT(*) as count
                                 FROM clients
                                 WHERE status = 'discharged'";
        $dischargedClientsRow = $db->query($dischargedClientsSql);
        $stats['dischargedClients'] = intval($dischargedClientsRow['count'] ?? 0);
        error_log("Discharged clients: " . $stats['dischargedClients']);
    } catch (Exception $e) {
        error_log('Discharged clients error: ' . $e->getMessage());
    }

    // Count clients with appointments today
    try {
        $today = date('Y-m-d');
        $todayClientsSql = "SELECT COUNT(DISTINCT client_id) as count
                            FROM appointments
                            WHERE DATE(start_datetime) = ?
                            AND client_id IS NOT NULL
                            AND client_id != 0";
        error_log("Today clients SQL: " . $todayClientsSql . " | Date: " . $today);
        $todayClientsRow = $db->query($todayClientsSql, [$today]);
        $stats['todayClients'] = intval($todayClientsRow['count'] ?? 0);
        error_log("Today clients: " . $stats['todayClients']);
    } catch (Exception $e) {
        error_log('Today clients error: ' . $e->getMessage());
    }

    // Count new clients in last 30 days
    try {
        $thirtyDaysAgo = date('Y-m-d', strtotime('-30 days'));
        $newClientsSql = "SELECT COUNT(*) as count
                          FROM clients
                          WHERE DATE(created_at) >= ?";
        error_log("New clients SQL: " . $newClientsSql . " | Date: " . $thirtyDaysAgo);
        $newClientsRow = $db->query($newClientsSql, [$thirtyDaysAgo]);
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
