<?php
/**
 * Mindline EMHR
 * Sign Note API - Session-based authentication
 * Signs and locks a clinical note
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

// Start output buffering to prevent any PHP warnings/notices from breaking JSON
ob_start();

// IMPORTANT: Set these BEFORE loading globals.php to prevent redirects
$ignoreAuth = true;
$ignoreAuth_onsite_portal = true;
$ignoreAuth_onsite_portal_two = true;

require_once(__DIR__ . '/../../../interface/globals.php');

// Clear any output that globals.php might have generated
ob_end_clean();

// Enable error logging
error_log("Sign note API called - Session ID: " . session_id());

/**
 * Sync diagnosis codes from a diagnosis note to the patient's problem list
 *
 * @param int $noteId - Clinical note ID
 * @param int $userId - User ID performing the sync
 * @return array - ['synced' => bool, 'count' => int]
 */
function syncDiagnosesToProblemList($noteId, $userId) {
    try {
        // Get the note details
        $noteSql = "SELECT patient_id, note_type, diagnosis_codes, service_date
                    FROM clinical_notes
                    WHERE id = ?";
        $noteResult = sqlStatement($noteSql, [$noteId]);
        $note = sqlFetchArray($noteResult);

        // Only sync diagnosis notes
        if (!$note || $note['note_type'] !== 'diagnosis') {
            return ['synced' => false, 'count' => 0];
        }

        // Parse diagnosis codes
        $diagnosisCodes = json_decode($note['diagnosis_codes'], true);
        if (empty($diagnosisCodes)) {
            return ['synced' => false, 'count' => 0];
        }

        // Get username for the user field
        $userSql = "SELECT username FROM users WHERE id = ?";
        $userResult = sqlStatement($userSql, [$userId]);
        $userRow = sqlFetchArray($userResult);
        $username = $userRow['username'] ?? 'unknown';

        $patientId = intval($note['patient_id']);
        $serviceDate = $note['service_date'];
        $syncCount = 0;

        foreach ($diagnosisCodes as $diagItem) {
            $code = $diagItem['code'] ?? '';
            $description = $diagItem['description'] ?? '';
            $isPrimary = $diagItem['isPrimary'] ?? false;

            if (empty($code)) continue;

            // Format code with period for display (F411 → F41.1)
            $formattedCode = strlen($code) >= 4 ? substr($code, 0, 3) . '.' . substr($code, 3) : $code;

            // Check if this diagnosis already exists for this patient
            $checkSql = "SELECT id, activity, enddate FROM lists
                        WHERE pid = ? AND type = 'medical_problem' AND diagnosis = ?
                        ORDER BY date DESC LIMIT 1";
            $checkResult = sqlStatement($checkSql, [$patientId, $formattedCode]);
            $existing = sqlFetchArray($checkResult);

            if ($existing) {
                // Update existing diagnosis - reactivate if inactive
                $updateSql = "UPDATE lists SET
                    activity = 1,
                    enddate = NULL,
                    modifydate = NOW(),
                    comments = CONCAT(COALESCE(comments, ''), '\nUpdated from diagnosis note #', ?)
                    WHERE id = ?";
                sqlStatement($updateSql, [$noteId, $existing['id']]);
                error_log("Reactivated existing diagnosis: {$formattedCode} for patient {$patientId}");
            } else {
                // Create new diagnosis entry
                $insertSql = "INSERT INTO lists (
                    date, type, title, diagnosis, begdate,
                    activity, pid, user, comments
                ) VALUES (NOW(), 'medical_problem', ?, ?, ?, 1, ?, ?, ?)";

                $title = $description ?: "Diagnosis: {$formattedCode}";
                $comments = "Created from diagnosis note #{$noteId}" . ($isPrimary ? " (Primary Diagnosis)" : "");

                sqlStatement($insertSql, [
                    $title,
                    $formattedCode,
                    $serviceDate,
                    $patientId,
                    $username,
                    $comments
                ]);

                error_log("Created new diagnosis: {$formattedCode} for patient {$patientId}");
            }

            $syncCount++;
        }

        return ['synced' => true, 'count' => $syncCount];

    } catch (Exception $e) {
        error_log("Error syncing diagnoses to problem list: " . $e->getMessage());
        return ['synced' => false, 'count' => 0];
    }
}

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("Sign note: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Sign note: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

$userId = intval($_SESSION['authUserID']);
error_log("Sign note: User authenticated - " . $userId);

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    error_log("Sign note input: " . print_r($input, true));

    // Validate required fields
    if (!isset($input['noteId']) || $input['noteId'] === '') {
        throw new Exception("Missing required field: noteId");
    }

    $noteId = intval($input['noteId']);
    $signatureData = $input['signatureData'] ?? null; // Optional electronic signature details

    // Check if note exists and is not already locked
    $checkSql = "SELECT id, is_locked, status, provider_id, supervisor_review_required, supervisor_review_status
                 FROM clinical_notes
                 WHERE id = ?";
    $checkResult = sqlStatement($checkSql, [$noteId]);
    $note = sqlFetchArray($checkResult);

    // Write to custom debug log for user visibility
    $debugLog = __DIR__ . '/../../../logs/diagnosis_note_debug.log';
    @file_put_contents($debugLog, "[" . date('Y-m-d H:i:s') . "] Attempting to sign note ID: $noteId - Found: " . ($note ? "YES" : "NO") . "\n", FILE_APPEND);

    if (!$note) {
        @file_put_contents($debugLog, "[" . date('Y-m-d H:i:s') . "] ERROR: Note $noteId not found in database during sign operation\n", FILE_APPEND);
        throw new Exception("Note not found");
    }

    if ($note['is_locked']) {
        throw new Exception("Note is already signed and locked");
    }

    // Check if note requires supervisor review
    if ($note['supervisor_review_required'] && $note['supervisor_review_status'] !== 'approved') {
        throw new Exception("Note requires supervisor approval before signing");
    }

    // Optional: Check if user is the note author
    // if (intval($note['provider_id']) !== $userId) {
    //     throw new Exception("You can only sign your own notes");
    // }

    // Sign and lock the note
    $signSql = "UPDATE clinical_notes SET
        status = 'signed',
        is_locked = 1,
        signed_at = NOW(),
        signed_by = ?,
        signature_data = ?,
        locked_at = NOW()
        WHERE id = ?";

    $signParams = [
        $userId,
        $signatureData,
        $noteId
    ];

    error_log("Signing note SQL: " . $signSql);
    error_log("Params: " . print_r($signParams, true));

    sqlStatement($signSql, $signParams);

    error_log("Note signed and locked successfully: ID " . $noteId);

    // If this is a diagnosis note, sync diagnoses to problem list
    $syncResult = syncDiagnosesToProblemList($noteId, $userId);
    if ($syncResult['synced']) {
        error_log("Synced {$syncResult['count']} diagnosis codes to problem list");
    }

    $response = [
        'success' => true,
        'noteId' => $noteId,
        'message' => 'Note signed and locked successfully',
        'signedAt' => date('Y-m-d H:i:s'),
        'diagnosisSynced' => $syncResult['synced'],
        'diagnosisCount' => $syncResult['count']
    ];

    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error signing note: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to sign note',
        'message' => $e->getMessage()
    ]);
}
