<?php
/**
 * System Settings API
 * Manage system-wide configuration settings
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;
use Custom\Lib\Services\SettingsService;

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    // Only admins can access settings
    $currentUser = $session->get('user');
    if (!$currentUser || $currentUser['user_type'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden - Admin access required']);
        exit;
    }

    $db = Database::getInstance();
    $settingsService = new SettingsService($db);
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);
    $category = $_GET['category'] ?? null;

    switch ($method) {
        case 'GET':
            if ($category) {
                // Get settings by category
                $settings = $settingsService->getByCategory($category);
                http_response_code(200);
                echo json_encode(['settings' => $settings]);
            } else {
                // Get all categories
                $categories = $settingsService->getCategories();
                http_response_code(200);
                echo json_encode(['categories' => $categories]);
            }
            break;

        case 'PUT':
            // Update settings
            if (!isset($input['settings']) || !is_array($input['settings'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Settings array required']);
                exit;
            }

            $updated = [];
            $errors = [];

            foreach ($input['settings'] as $key => $value) {
                try {
                    $settingsService->set($key, $value);
                    $updated[] = $key;
                } catch (\Exception $e) {
                    $errors[$key] = $e->getMessage();
                }
            }

            if (empty($errors)) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Settings updated successfully',
                    'updated' => $updated
                ]);
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Some settings failed to update',
                    'updated' => $updated,
                    'errors' => $errors
                ]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }

} catch (\Exception $e) {
    error_log("Settings API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error', 'message' => $e->getMessage()]);
}
