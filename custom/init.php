<?php
/**
 * SanctumEMHR API Initialization
 *
 * This file replaces OpenEMR's globals.php for all custom API endpoints.
 * It provides a lightweight initialization without loading the entire OpenEMR infrastructure.
 *
 * Usage in API files:
 *   require_once dirname(__FILE__, 2) . '/init.php';
 *
 * What this provides:
 * - Composer autoloader (for Database class)
 * - PHP session management
 * - Database connection via Database::getInstance()
 * - Error reporting for development
 *
 * @package   SanctumEMHR
 * @author    Kenneth J. Nelan / Sacred Wandering
 * @license   Proprietary and Confidential
 * @version   1.0.0
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', '1');

// DO NOT start session here - let SessionManager handle it completely

// Directly load class files (bypasses autoloader case sensitivity issues)
$baseDir = dirname(__FILE__);

// Try capital L first (correct), then lowercase l (fallback)
$libDir = is_dir($baseDir . '/Lib') ? $baseDir . '/Lib' : $baseDir . '/lib';

require_once $libDir . '/Database/Database.php';
require_once $libDir . '/Auth/CustomAuth.php';
require_once $libDir . '/Auth/PermissionChecker.php';
require_once $libDir . '/Session/SessionManager.php';
require_once $libDir . '/Services/SettingsService.php';
require_once $libDir . '/Services/UserService.php';
require_once $libDir . '/Services/EmailService.php';
require_once $libDir . '/Audit/AuditLogger.php';

// Helper function to get current logged-in user ID from session
function getCurrentUserId() {
    return $_SESSION['user_id'] ?? null;
}

// Helper function to check if user is authenticated
function isAuthenticated() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

// Helper function to require authentication (call at top of protected endpoints)
function requireAuth() {
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Authentication required',
            'message' => 'You must be logged in to access this resource.'
        ]);
        exit;
    }
}

// All set! API files can now use:
// - $db for database queries
// - getCurrentUserId() to get logged-in user
// - isAuthenticated() to check auth status
// - requireAuth() to enforce authentication
