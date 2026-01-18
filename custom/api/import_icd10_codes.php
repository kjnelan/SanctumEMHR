<?php
/**
 * Mindline EMHR
 * ICD-10 Code Import API - Session-based authentication (MIGRATED TO MINDLINE)
 * Handles bulk import of ICD-10-CM codes from CMS text file
 *
 * File Format: Tab-delimited text
 * Columns: ORDER | CODE | VALID | SHORT_DESC | LONG_DESC
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4B
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
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("ICD-10 Import: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("ICD-10 Import: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    // Initialize database
    $db = Database::getInstance();

    // Check admin privileges (is_admin flag in users table)
    $userSql = "SELECT is_admin FROM users WHERE id = ?";
    $userResult = $db->query($userSql, [$session->getUserId()]);

    if (!$userResult || $userResult['is_admin'] != 1) {
        error_log("ICD-10 Import: User not admin - " . $session->getUserId());
        http_response_code(403);
        echo json_encode(['error' => 'Admin privileges required']);
        exit;
    }

    error_log("ICD-10 Import: Admin authenticated - " . $session->getUserId());

    // Check if file was uploaded
    if (!isset($_FILES['icd10_file']) || $_FILES['icd10_file']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('No file uploaded or upload error');
    }

    $uploadedFile = $_FILES['icd10_file'];
    $tmpPath = $uploadedFile['tmp_name'];
    $originalName = $uploadedFile['name'];

    error_log("ICD-10 Import: Processing file - " . $originalName);

    // Validate file extension
    $allowedExtensions = ['txt', 'csv', 'tsv'];
    $fileExtension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

    if (!in_array($fileExtension, $allowedExtensions)) {
        throw new Exception('Invalid file type. Only .txt, .csv, or .tsv files allowed.');
    }

    // Check file size (max 50MB)
    if ($uploadedFile['size'] > 50 * 1024 * 1024) {
        throw new Exception('File too large. Maximum size is 50MB.');
    }

    // Read file contents
    $fileContents = file_get_contents($tmpPath);
    if ($fileContents === false) {
        throw new Exception('Failed to read uploaded file');
    }

    // Split into lines
    $lines = explode("\n", $fileContents);
    $totalLines = count($lines);

    error_log("ICD-10 Import: Found " . $totalLines . " lines in file");

    // Get action (replace_all or update_only)
    $action = $_POST['action'] ?? 'replace_all';

    if ($action === 'replace_all') {
        // Delete existing ICD-10 codes
        error_log("ICD-10 Import: Deleting existing codes");
        $deleteSql = "DELETE FROM codes WHERE code_type = 'ICD10'";
        $db->execute($deleteSql);
    }

    // Prepare insert statement
    $insertSql = "INSERT INTO codes (code_type, code, code_text, active)
                  VALUES (?, ?, ?, ?)
                  ON DUPLICATE KEY UPDATE
                  code_text = VALUES(code_text),
                  active = VALUES(active)";

    $imported = 0;
    $skipped = 0;
    $errors = 0;
    $firstLine = true;

    // Process each line
    foreach ($lines as $lineNum => $line) {
        $line = trim($line);

        // Skip empty lines
        if (empty($line)) {
            continue;
        }

        // Skip header line (usually first line or lines starting with "ORDER")
        if ($firstLine || stripos($line, 'ORDER') === 0) {
            $firstLine = false;
            continue;
        }

        // Parse delimited line (tabs or spaces)
        // Format: ORDER \t CODE \t VALID \t SHORT_DESC \t LONG_DESC
        $parts = preg_split('/\s+/', $line, 5);

        if (count($parts) < 3) {
            error_log("ICD-10 Import: Skipping malformed line " . ($lineNum + 1) . " - only " . count($parts) . " parts");
            $skipped++;
            continue;
        }

        // Extract fields
        $order = isset($parts[0]) ? trim($parts[0]) : '';
        $code = isset($parts[1]) ? trim($parts[1]) : '';
        $valid = isset($parts[2]) ? trim($parts[2]) : '1';
        $shortDesc = isset($parts[3]) ? trim($parts[3]) : '';
        $longDesc = isset($parts[4]) ? trim($parts[4]) : '';

        // Use long description if available, otherwise short
        $description = !empty($longDesc) ? $longDesc : $shortDesc;

        // Validate code
        if (empty($code) || empty($description)) {
            error_log("ICD-10 Import: Skipping line " . ($lineNum + 1) . " - missing code or description");
            $skipped++;
            continue;
        }

        // Convert valid flag to boolean (1 or 0)
        $active = ($valid === '1' || $valid === '0') ? intval($valid) : 1;

        // Insert into database
        try {
            $db->execute($insertSql, [
                'ICD10',
                $code,
                $description,
                $active
            ]);
            $imported++;

            // Log progress every 1000 codes
            if ($imported % 1000 === 0) {
                error_log("ICD-10 Import: Processed " . $imported . " codes");
            }

        } catch (Exception $e) {
            error_log("ICD-10 Import: Error inserting code " . $code . " - " . $e->getMessage());
            $errors++;
        }
    }

    error_log("ICD-10 Import: Complete - Imported: " . $imported . ", Skipped: " . $skipped . ", Errors: " . $errors);

    // Get final count
    $countSql = "SELECT COUNT(*) as total FROM codes WHERE code_type = 'ICD10' AND active = 1";
    $countResult = $db->query($countSql);
    $totalActive = $countResult['total'];

    $response = [
        'success' => true,
        'imported' => $imported,
        'skipped' => $skipped,
        'errors' => $errors,
        'total_active' => $totalActive,
        'message' => "Successfully imported " . $imported . " ICD-10 codes"
    ];

    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("ICD-10 Import: Fatal error - " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Import failed',
        'message' => $e->getMessage()
    ]);
}
