<?php
/**
 * Mindline EMHR - Facilities API (MIGRATED TO MINDLINE)
 * Handles CRUD operations for facilities
 *
 * @package   Mindline
 * @author    Kenneth J. Nelan
 * @copyright Copyright (c) 2026 Sacred Wandering
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    // Initialize database
    $db = Database::getInstance();

    // TODO: Check if user has admin privileges for write operations
    // For now, allowing all authenticated users

    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $_GET['action'] ?? null;

    switch ($method) {
        case 'GET':
            if ($action === 'get' && isset($_GET['id'])) {
                // Get single facility by ID
                $facilityId = filter_var($_GET['id'], FILTER_VALIDATE_INT);
                if (!$facilityId) {
                    throw new Exception('Invalid facility ID');
                }

                $sql = "SELECT
                    id, name, phone, fax, street, city, state, postal_code, country_code,
                    federal_ein, facility_npi, facility_taxonomy,
                    tax_id_type, color, primary_business_entity, billing_location,
                    accepts_assignment, service_location, pos_code,
                    attn, mail_street, mail_city, mail_state, mail_zip,
                    info, inactive, website, email
                FROM facilities
                WHERE id = ?";

                $result = $db->query($sql, [$facilityId]);

                if (!$result) {
                    throw new Exception('Facility not found');
                }

                http_response_code(200);
                echo json_encode($result);
            } else {
                // Get all facilities
                $sql = "SELECT
                    id, name, phone, fax, street, city, state, postal_code,
                    billing_location, service_location, inactive
                FROM facilities
                ORDER BY name";

                $facilities = $db->queryAll($sql);

                http_response_code(200);
                echo json_encode(['facilities' => $facilities]);
            }
            break;

        case 'POST':
            // Create new facility
            $name = $input['name'] ?? null;

            if (!$name) {
                throw new Exception('Facility name is required');
            }

            $sql = "INSERT INTO facilities (
                name, phone, fax, street, city, state, postal_code, country_code,
                federal_ein, facility_npi, facility_taxonomy,
                tax_id_type, color, primary_business_entity, billing_location,
                accepts_assignment, service_location, pos_code,
                attn, mail_street, mail_city, mail_state, mail_zip,
                info, inactive, website, email
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            $params = [
                $name,
                $input['phone'] ?? '',
                $input['fax'] ?? '',
                $input['street'] ?? '',
                $input['city'] ?? '',
                $input['state'] ?? '',
                $input['postal_code'] ?? '',
                $input['country_code'] ?? 'US',
                $input['federal_ein'] ?? '',
                $input['facility_npi'] ?? '',
                $input['facility_taxonomy'] ?? '',
                $input['tax_id_type'] ?? 'EIN',
                $input['color'] ?? '#99FFFF',
                $input['primary_business_entity'] ?? 0,
                $input['billing_location'] ?? 0,
                $input['accepts_assignment'] ?? 0,
                $input['service_location'] ?? 1,
                $input['pos_code'] ?? '11',
                $input['attn'] ?? '',
                $input['mail_street'] ?? '',
                $input['mail_city'] ?? '',
                $input['mail_state'] ?? '',
                $input['mail_zip'] ?? '',
                $input['info'] ?? '',
                $input['inactive'] ?? 0,
                $input['website'] ?? '',
                $input['email'] ?? ''
            ];

            $newId = $db->insert($sql, $params);

            http_response_code(201);
            echo json_encode(['success' => true, 'id' => $newId]);
            break;

        case 'PUT':
            // Update facility
            if (!isset($input['id'])) {
                throw new Exception('Facility ID is required');
            }

            $facilityId = filter_var($input['id'], FILTER_VALIDATE_INT);
            if (!$facilityId) {
                throw new Exception('Invalid facility ID');
            }

            $sql = "UPDATE facilities SET
                name = ?, phone = ?, fax = ?, street = ?, city = ?, state = ?,
                postal_code = ?, country_code = ?, federal_ein = ?, facility_npi = ?,
                facility_taxonomy = ?, tax_id_type = ?, color = ?,
                primary_business_entity = ?, billing_location = ?, accepts_assignment = ?,
                service_location = ?, pos_code = ?, attn = ?, mail_street = ?,
                mail_city = ?, mail_state = ?, mail_zip = ?, info = ?,
                inactive = ?, website = ?, email = ?
            WHERE id = ?";

            $params = [
                $input['name'] ?? '',
                $input['phone'] ?? '',
                $input['fax'] ?? '',
                $input['street'] ?? '',
                $input['city'] ?? '',
                $input['state'] ?? '',
                $input['postal_code'] ?? '',
                $input['country_code'] ?? 'US',
                $input['federal_ein'] ?? '',
                $input['facility_npi'] ?? '',
                $input['facility_taxonomy'] ?? '',
                $input['tax_id_type'] ?? 'EIN',
                $input['color'] ?? '#99FFFF',
                $input['primary_business_entity'] ?? 0,
                $input['billing_location'] ?? 0,
                $input['accepts_assignment'] ?? 0,
                $input['service_location'] ?? 1,
                $input['pos_code'] ?? '11',
                $input['attn'] ?? '',
                $input['mail_street'] ?? '',
                $input['mail_city'] ?? '',
                $input['mail_state'] ?? '',
                $input['mail_zip'] ?? '',
                $input['info'] ?? '',
                $input['inactive'] ?? 0,
                $input['website'] ?? '',
                $input['email'] ?? '',
                $facilityId
            ];

            $db->execute($sql, $params);

            http_response_code(200);
            echo json_encode(['success' => true]);
            break;

        case 'DELETE':
            // Note: Generally we don't delete facilities, we mark them inactive
            if (!isset($_GET['id'])) {
                throw new Exception('Facility ID is required');
            }

            $facilityId = filter_var($_GET['id'], FILTER_VALIDATE_INT);
            if (!$facilityId) {
                throw new Exception('Invalid facility ID');
            }

            // Mark as inactive instead of deleting
            $sql = "UPDATE facilities SET inactive = 1 WHERE id = ?";
            $db->execute($sql, [$facilityId]);

            http_response_code(200);
            echo json_encode(['success' => true]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("Facilities API error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
