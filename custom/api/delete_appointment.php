<?php
/**
 * Mindline EMHR
 * Delete Appointment API - Session-based authentication (MIGRATED TO MINDLINE)
 * Deletes an appointment or availability block from the calendar
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

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST/DELETE requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    error_log("Delete appointment: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Delete appointment: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    error_log("Delete appointment: User authenticated - " . $session->getUserId());

    // Initialize database
    $db = Database::getInstance();

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    error_log("Delete appointment input: " . print_r($input, true));

    // Validate required fields
    if (!isset($input['appointmentId']) || $input['appointmentId'] === '') {
        throw new Exception("Missing required field: appointmentId");
    }

    $appointmentId = intval($input['appointmentId']);

    // Check for series delete data
    $seriesData = isset($input['seriesData']) ? $input['seriesData'] : null;
    $deleteScope = $seriesData ? $seriesData['scope'] : 'single'; // 'single', 'all', 'future'
    $recurrenceId = $seriesData ? $seriesData['recurrenceId'] : null;

    // Verify the appointment exists and belongs to the current user (for provider blocks)
    $existing = $db->query(
        "SELECT id, client_id, provider_id, category_id, start_datetime, recurrence_group_id
         FROM appointments
         WHERE id = ?",
        [$appointmentId]
    );

    if (!$existing) {
        throw new Exception('Appointment not found');
    }

    // For provider availability blocks (client_id = 0), verify it belongs to current user
    if ($existing['client_id'] == 0 && $existing['provider_id'] != $session->getUserId()) {
        error_log("Delete appointment: User " . $session->getUserId() . " tried to delete block belonging to user " . $existing['provider_id']);
        throw new Exception('You can only delete your own availability blocks');
    }

    // Determine what to delete based on scope
    $whereClause = "id = ?";
    $whereParams = [$appointmentId];

    if ($seriesData && $deleteScope !== 'single') {
        if ($deleteScope === 'all') {
            // Delete all occurrences in the series
            $whereClause = "recurrence_group_id = ?";
            $whereParams = [$recurrenceId];
            error_log("Delete appointment: Deleting ALL occurrences with recurrence ID: $recurrenceId");
        } elseif ($deleteScope === 'future') {
            // Delete this and future occurrences
            $splitDate = $existing['start_datetime'];
            $whereClause = "recurrence_group_id = ? AND start_datetime >= ?";
            $whereParams = [$recurrenceId, $splitDate];
            error_log("Delete appointment: Deleting this and future occurrences with recurrence ID: $recurrenceId from date: $splitDate");
        }
    }

    // Delete the appointment(s)
    $sql = "DELETE FROM appointments WHERE $whereClause";

    error_log("Delete appointment SQL: " . $sql);
    error_log("Delete appointment params: " . print_r($whereParams, true));

    $deletedCount = $db->execute($sql, $whereParams);

    error_log("Delete appointment: Successfully deleted $deletedCount appointment(s)");

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Appointment deleted successfully',
        'deletedCount' => $deletedCount
    ]);

} catch (Exception $e) {
    error_log("Delete appointment: Error - " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to delete appointment',
        'message' => $e->getMessage()
    ]);
}
