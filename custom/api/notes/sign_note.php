<?php
/**
 * Mindline EMHR
 * Sign Note API - Session-based authentication (MIGRATED TO MINDLINE)
 * Signs and locks a clinical note
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

require_once(__DIR__ . '/../../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

/**
 * Sync diagnosis codes from a diagnosis note to the patient's problem list
 *
 * @param int $noteId - Clinical note ID
 * @param int $userId - User ID performing the sync
 * @param Database $db - Database instance
 * @return array - ['synced' => bool, 'count' => int]
 */
function syncDiagnosesToProblemList($noteId, $userId, $db) {
    try {
        // Get the note details
        $noteSql = "SELECT patient_id, note_type, diagnosis_codes, service_date
                    FROM clinical_notes
                    WHERE id = ?";
        $note = $db->query($noteSql, [$noteId]);

        // Only sync diagnosis notes
        if (!$note || $note['note_type'] !== 'diagnosis') {
            return ['synced' => false, 'count' => 0];
        }

        // Parse diagnosis codes from the new note
        $diagnosisCodes = json_decode($note['diagnosis_codes'], true);
        if (empty($diagnosisCodes)) {
            return ['synced' => false, 'count' => 0];
        }

        // Get username for the user field
        $userSql = "SELECT username FROM users WHERE id = ?";
        $user = $db->query($userSql, [$userId]);
        $username = $user['username'] ?? 'unknown';

        $patientId = intval($note['patient_id']);
        $serviceDate = $note['service_date'];
        $syncCount = 0;

        // Build list of codes from the new note (with periods for comparison)
        $newCodes = [];
        foreach ($diagnosisCodes as $diagItem) {
            $code = $diagItem['code'] ?? '';
            if (!empty($code)) {
                // Format code with period (F411 → F41.1)
                $formattedCode = strlen($code) >= 4 ? substr($code, 0, 3) . '.' . substr($code, 3) : $code;
                $newCodes[$formattedCode] = $diagItem;
            }
        }

        // Get all currently ACTIVE diagnoses for this patient
        $activeSql = "SELECT id, code AS diagnosis, description AS title FROM diagnoses
                      WHERE patient_id = ? AND status = 'active'
                      ORDER BY diagnosis_date DESC";
        $activeRows = $db->queryAll($activeSql, [$patientId]);
        $activeDiagnoses = [];
        foreach ($activeRows as $row) {
            $activeDiagnoses[$row['diagnosis']] = $row;
        }

        // STEP 1: Process codes from the new note
        foreach ($newCodes as $formattedCode => $diagItem) {
            $description = $diagItem['description'] ?? '';
            $isPrimary = $diagItem['isPrimary'] ?? false;

            if (isset($activeDiagnoses[$formattedCode])) {
                // Already active - just update notes
                $updateSql = "UPDATE diagnoses SET
                    updated_at = NOW(),
                    notes = CONCAT(COALESCE(notes, ''), '\nConfirmed in diagnosis note #', ?)
                    WHERE id = ?";
                $db->execute($updateSql, [$noteId, $activeDiagnoses[$formattedCode]['id']]);
            } else {
                // Not currently active - check if it existed before (inactive)
                $checkSql = "SELECT id, status, end_date FROM diagnoses
                            WHERE patient_id = ? AND code = ?
                            ORDER BY diagnosis_date DESC LIMIT 1";
                $existing = $db->query($checkSql, [$patientId, $formattedCode]);

                if ($existing) {
                    // Reactivate previously inactive diagnosis
                    $updateSql = "UPDATE diagnoses SET
                        status = 'active',
                        end_date = NULL,
                        updated_at = NOW(),
                        notes = CONCAT(COALESCE(notes, ''), '\nReactivated in diagnosis note #', ?)
                        WHERE id = ?";
                    $db->execute($updateSql, [$noteId, $existing['id']]);
                } else {
                    // Create brand new diagnosis
                    $insertSql = "INSERT INTO diagnoses (
                        patient_id, code, description, diagnosis_date,
                        status, created_by, notes
                    ) VALUES (?, ?, ?, ?, 'active', ?, ?)";

                    $title = $description ?: "Diagnosis: {$formattedCode}";
                    $notes = "Created from diagnosis note #{$noteId}" . ($isPrimary ? " (Primary Diagnosis)" : "");

                    $db->insert($insertSql, [
                        $patientId,
                        $formattedCode,
                        $title,
                        $serviceDate,
                        $userId,
                        $notes
                    ]);
                }
            }

            $syncCount++;
        }

        // STEP 2: Retire diagnoses that are active but NOT in the new note
        foreach ($activeDiagnoses as $diagCode => $diagData) {
            if (!isset($newCodes[$diagCode])) {
                // This diagnosis was active but is no longer in the new note - retire it
                $retireSql = "UPDATE diagnoses SET
                    status = 'resolved',
                    end_date = ?,
                    updated_at = NOW(),
                    notes = CONCAT(COALESCE(notes, ''), '\nRetired by diagnosis note #', ?)
                    WHERE id = ?";
                $db->execute($retireSql, [$serviceDate, $noteId, $diagData['id']]);
            }
        }

        return ['synced' => true, 'count' => $syncCount];

    } catch (Exception $e) {
        error_log("Error syncing diagnoses to problem list: " . $e->getMessage());
        return ['synced' => false, 'count' => 0];
    }
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $userId = $session->getUserId();
    $db = Database::getInstance();

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    // Validate required fields
    if (!isset($input['noteId']) || $input['noteId'] === '') {
        throw new Exception("Missing required field: noteId");
    }

    $noteId = intval($input['noteId']);
    $signatureData = $input['signatureData'] ?? null; // Optional electronic signature details

    // Check if note exists and is not already locked
    $checkSql = "SELECT id, is_locked, status, created_by, supervisor_review_required, supervisor_review_status
                 FROM clinical_notes
                 WHERE id = ?";
    $note = $db->query($checkSql, [$noteId]);

    if (!$note) {
        throw new Exception("Note not found");
    }

    if ($note['is_locked']) {
        throw new Exception("Note is already signed and locked");
    }

    // Check if note requires supervisor review
    if ($note['supervisor_review_required'] && $note['supervisor_review_status'] !== 'approved') {
        throw new Exception("Note requires supervisor approval before signing");
    }

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

    $db->execute($signSql, $signParams);

    // If this is a diagnosis note, sync diagnoses to problem list
    $syncResult = syncDiagnosesToProblemList($noteId, $userId, $db);

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
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to sign note',
        'message' => $e->getMessage()
    ]);
}
