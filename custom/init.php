<?php
/**
 * MINDLINE API Initialization
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
 * @package   Mindline
 * @author    Kenneth J. Nelan / Sacred Wandering
 * @license   Proprietary and Confidential
 * @version   1.0.0
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', '1');

// Load Composer autoloader
// This makes our Database class and other namespaced classes available
require_once dirname(__FILE__, 2) . '/vendor/autoload.php';

// Start PHP session (for authentication)
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Make Database class available
use Custom\Lib\Database\Database;

// Initialize database connection (singleton pattern)
// API files can access via: $db = Database::getInstance();
try {
    $db = Database::getInstance();
} catch (Exception $e) {
    error_log("Mindline init.php - Database connection failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed',
        'message' => 'Unable to connect to database. Please check configuration.'
    ]);
    exit;
}

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
