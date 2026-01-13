<?php
/**
 * Mindline EMHR - Facilities API
 * Handles CRUD operations for facilities
 *
 * @package   OpenEMR
 * @link      http://www.open-emr.org
 * @author    Kenneth J. Nelan
 * @copyright Copyright (c) 2026 Sacred Wandering
 * @license   https://github.com/openemr/openemr/blob/master/LICENSE GNU General Public License 3
 */

require_once dirname(__FILE__) . '/../../interface/globals.php';
require_once dirname(__FILE__) . '/../../library/sql.inc.php';

use OpenEMR\Common\Csrf\CsrfUtils;
use OpenEMR\Common\Acl\AclMain;

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

// Check if user is authenticated
if (!isset($_SESSION['authUserID'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Check if user has admin privileges
if (!AclMain::aclCheckCore('admin', 'super')) {
    http_response_code(403);
    echo json_encode(['error' => 'Insufficient privileges']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? null;

try {
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
                    billing_attn, info, inactive, website, email
                FROM facility
                WHERE id = ?";

                $result = sqlQuery($sql, [$facilityId]);

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
                FROM facility
                ORDER BY name";

                $result = sqlStatement($sql);
                $facilities = [];
                while ($row = sqlFetchArray($result)) {
                    $facilities[] = $row;
                }

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

            $sql = "INSERT INTO facility (
                name, phone, fax, street, city, state, postal_code, country_code,
                federal_ein, facility_npi, facility_taxonomy,
                tax_id_type, color, primary_business_entity, billing_location,
                accepts_assignment, service_location, pos_code,
                billing_attn, info, inactive, website, email
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

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
                $input['billing_attn'] ?? '',
                $input['info'] ?? '',
                $input['inactive'] ?? 0,
                $input['website'] ?? '',
                $input['email'] ?? ''
            ];

            sqlInsert($sql, $params);
            $newId = sqlInsert("SELECT LAST_INSERT_ID() as id");

            http_response_code(201);
            echo json_encode(['success' => true, 'id' => $newId['id']]);
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

            $sql = "UPDATE facility SET
                name = ?, phone = ?, fax = ?, street = ?, city = ?, state = ?,
                postal_code = ?, country_code = ?, federal_ein = ?, facility_npi = ?,
                facility_taxonomy = ?, tax_id_type = ?, color = ?,
                primary_business_entity = ?, billing_location = ?, accepts_assignment = ?,
                service_location = ?, pos_code = ?, billing_attn = ?, info = ?,
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
                $input['billing_attn'] ?? '',
                $input['info'] ?? '',
                $input['inactive'] ?? 0,
                $input['website'] ?? '',
                $input['email'] ?? '',
                $facilityId
            ];

            sqlStatement($sql, $params);

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
            $sql = "UPDATE facility SET inactive = 1 WHERE id = ?";
            sqlStatement($sql, [$facilityId]);

            http_response_code(200);
            echo json_encode(['success' => true]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
