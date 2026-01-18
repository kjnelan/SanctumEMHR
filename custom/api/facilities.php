<?php
/**
 * Mindline EMHR - Facilities API (MIGRATED TO MINDLINE)
 * Handles CRUD operations for facilities
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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

    $db = Database::getInstance();
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $_GET['action'] ?? null;

    switch ($method) {
        case 'GET':
            if ($action === 'get' && isset($_GET['id'])) {
                // Get single facility with all fields
                $facilityId = filter_var($_GET['id'], FILTER_VALIDATE_INT);
                if (!$facilityId) {
                    throw new Exception('Invalid facility ID');
                }

                $sql = "SELECT
                    f.id,
                    f.name,
                    f.facility_type_id,
                    ft.name as facility_type_name,
                    f.phone,
                    f.fax,
                    f.email,
                    f.website,
                    f.address_line1 AS street,
                    f.address_line2,
                    f.city,
                    f.state,
                    f.zip AS postal_code,
                    f.mailing_address_line1 AS mail_street,
                    f.mailing_address_line2,
                    f.mailing_city AS mail_city,
                    f.mailing_state AS mail_state,
                    f.mailing_zip AS mail_zip,
                    CAST(f.mailing_same_as_physical AS CHAR) AS mailing_same_as_physical,
                    f.billing_address_line1 AS billing_street,
                    f.billing_address_line2,
                    f.billing_city,
                    f.billing_state,
                    f.billing_zip,
                    CAST(f.billing_same_as_physical AS CHAR) AS billing_same_as_physical,
                    f.tax_id AS federal_ein,
                    f.facility_npi,
                    f.pos_code,
                    CAST(f.billing_location AS CHAR) AS billing_location,
                    CAST(f.service_location AS CHAR) AS service_location,
                    CAST(f.accepts_assignment AS CHAR) AS accepts_assignment,
                    CAST(f.primary_business_entity AS CHAR) AS primary_business_entity,
                    CAST((1 - f.is_active) AS CHAR) AS inactive,
                    CAST(f.is_active AS CHAR) AS is_active,
                    CAST(f.is_primary AS CHAR) AS is_primary,
                    f.color,
                    f.notes AS info,
                    f.attn,
                    f.business_hours,
                    'United States' AS country_code
                FROM facilities f
                LEFT JOIN facility_types ft ON f.facility_type_id = ft.id
                WHERE f.id = ?";

                $result = $db->query($sql, [$facilityId]);

                if (!$result) {
                    throw new Exception('Facility not found');
                }

                http_response_code(200);
                echo json_encode($result);

            } else {
                // Get all facilities (with optional filtering)
                $status = $_GET['status'] ?? 'active';

                $sql = "SELECT
                    f.id,
                    f.name,
                    f.facility_type_id,
                    ft.name as facility_type_name,
                    f.phone,
                    f.fax,
                    f.email,
                    f.address_line1 AS street,
                    f.city,
                    f.state,
                    f.zip AS postal_code,
                    CAST(f.billing_location AS CHAR) AS billing_location,
                    CAST(f.service_location AS CHAR) AS service_location,
                    CAST(f.primary_business_entity AS CHAR) AS primary_business_entity,
                    CAST((1 - f.is_active) AS CHAR) AS inactive,
                    CAST(f.is_active AS CHAR) AS is_active,
                    CAST(f.is_primary AS CHAR) AS is_primary
                FROM facilities f
                LEFT JOIN facility_types ft ON f.facility_type_id = ft.id";

                $whereConditions = [];
                $params = [];

                if ($status === 'active') {
                    $whereConditions[] = 'f.is_active = 1';
                } elseif ($status === 'inactive') {
                    $whereConditions[] = 'f.is_active = 0';
                }
                // 'all' status has no condition

                if (!empty($whereConditions)) {
                    $sql .= ' WHERE ' . implode(' AND ', $whereConditions);
                }

                $sql .= " ORDER BY f.is_primary DESC, f.name";

                $facilities = $db->queryAll($sql, $params);

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

            // Map frontend field names to database field names
            $inactive = $input['inactive'] ?? 0;
            $isActive = $inactive ? 0 : 1; // Invert: inactive=1 means is_active=0

            // Handle mailing address - copy from physical if flag set
            $mailingStreet = $input['mail_street'] ?? null;
            $mailingLine2 = $input['mailing_address_line2'] ?? null;
            $mailingCity = $input['mail_city'] ?? null;
            $mailingState = $input['mail_state'] ?? null;
            $mailingZip = $input['mail_zip'] ?? null;
            $mailingSameAsPhysical = isset($input['mailing_same_as_physical']) &&
                                     ($input['mailing_same_as_physical'] === '1' || $input['mailing_same_as_physical'] === 1);

            if ($mailingSameAsPhysical) {
                $mailingStreet = $input['street'] ?? null;
                $mailingLine2 = $input['address_line2'] ?? null;
                $mailingCity = $input['city'] ?? null;
                $mailingState = $input['state'] ?? null;
                $mailingZip = $input['postal_code'] ?? null;
            }

            // Handle billing address - copy from physical if flag set
            $billingStreet = $input['billing_street'] ?? null;
            $billingLine2 = $input['billing_address_line2'] ?? null;
            $billingCity = $input['billing_city'] ?? null;
            $billingState = $input['billing_state'] ?? null;
            $billingZip = $input['billing_zip'] ?? null;
            $billingSameAsPhysical = isset($input['billing_same_as_physical']) &&
                                     ($input['billing_same_as_physical'] === '1' || $input['billing_same_as_physical'] === 1);

            if ($billingSameAsPhysical) {
                $billingStreet = $input['street'] ?? null;
                $billingLine2 = $input['address_line2'] ?? null;
                $billingCity = $input['city'] ?? null;
                $billingState = $input['state'] ?? null;
                $billingZip = $input['postal_code'] ?? null;
            }

            $sql = "INSERT INTO facilities (
                name, facility_type_id,
                phone, fax, email, website,
                address_line1, address_line2, city, state, zip,
                mailing_address_line1, mailing_address_line2, mailing_city, mailing_state, mailing_zip, mailing_same_as_physical,
                billing_address_line1, billing_address_line2, billing_city, billing_state, billing_zip, billing_same_as_physical,
                tax_id, facility_npi, pos_code,
                billing_location, service_location, accepts_assignment, primary_business_entity,
                color, notes, attn,
                is_active, is_primary, business_hours
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            $params = [
                $name,
                $input['facility_type_id'] ?? null,
                $input['phone'] ?? null,
                $input['fax'] ?? null,
                $input['email'] ?? null,
                $input['website'] ?? null,
                $input['street'] ?? null,
                $input['address_line2'] ?? null,
                $input['city'] ?? null,
                $input['state'] ?? null,
                $input['postal_code'] ?? null,
                $mailingStreet,
                $mailingLine2,
                $mailingCity,
                $mailingState,
                $mailingZip,
                $mailingSameAsPhysical ? 1 : 0,
                $billingStreet,
                $billingLine2,
                $billingCity,
                $billingState,
                $billingZip,
                $billingSameAsPhysical ? 1 : 0,
                $input['federal_ein'] ?? null,
                $input['facility_npi'] ?? null,
                $input['pos_code'] ?? '11',
                ($input['billing_location'] ?? 0) ? 1 : 0,
                ($input['service_location'] ?? 1) ? 1 : 0,
                ($input['accepts_assignment'] ?? 1) ? 1 : 0,
                ($input['primary_business_entity'] ?? 0) ? 1 : 0,
                $input['color'] ?? '#99FFFF',
                $input['info'] ?? null,
                $input['attn'] ?? null,
                $isActive,
                ($input['is_primary'] ?? 0) ? 1 : 0,
                $input['business_hours'] ?? null
            ];

            $newId = $db->insert($sql, $params);

            http_response_code(201);
            echo json_encode(['success' => true, 'id' => $newId]);
            break;

        case 'PUT':
            // Update facility
            $facilityId = $input['id'] ?? null;

            if (!$facilityId) {
                throw new Exception('Facility ID is required');
            }

            // Build field mappings
            $updateFields = [];
            $params = [];

            // Map frontend fields to database fields
            $fieldMap = [
                'name' => 'name',
                'facility_type_id' => 'facility_type_id',
                'phone' => 'phone',
                'fax' => 'fax',
                'email' => 'email',
                'website' => 'website',
                'street' => 'address_line1',
                'address_line2' => 'address_line2',
                'city' => 'city',
                'state' => 'state',
                'postal_code' => 'zip',
                'mail_street' => 'mailing_address_line1',
                'mailing_address_line2' => 'mailing_address_line2',
                'mail_city' => 'mailing_city',
                'mail_state' => 'mailing_state',
                'mail_zip' => 'mailing_zip',
                'billing_street' => 'billing_address_line1',
                'billing_address_line2' => 'billing_address_line2',
                'billing_city' => 'billing_city',
                'billing_state' => 'billing_state',
                'billing_zip' => 'billing_zip',
                'federal_ein' => 'tax_id',
                'facility_npi' => 'facility_npi',
                'pos_code' => 'pos_code',
                'color' => 'color',
                'info' => 'notes',
                'attn' => 'attn',
                'business_hours' => 'business_hours'
            ];

            // Track which fields to skip in regular processing
            $skipFields = [];

            // Handle mailing_same_as_physical flag
            $mailingSameAsPhysical = isset($input['mailing_same_as_physical']) &&
                                     ($input['mailing_same_as_physical'] === '1' || $input['mailing_same_as_physical'] === 1);

            if (isset($input['mailing_same_as_physical'])) {
                $updateFields[] = "mailing_same_as_physical = ?";
                $params[] = $mailingSameAsPhysical ? 1 : 0;
            }

            // If flag is true, copy physical address to mailing and skip mailing fields in regular processing
            if ($mailingSameAsPhysical) {
                if (isset($input['street'])) {
                    $updateFields[] = "mailing_address_line1 = ?";
                    $params[] = $input['street'];
                }
                if (isset($input['address_line2'])) {
                    $updateFields[] = "mailing_address_line2 = ?";
                    $params[] = $input['address_line2'];
                }
                if (isset($input['city'])) {
                    $updateFields[] = "mailing_city = ?";
                    $params[] = $input['city'];
                }
                if (isset($input['state'])) {
                    $updateFields[] = "mailing_state = ?";
                    $params[] = $input['state'];
                }
                if (isset($input['postal_code'])) {
                    $updateFields[] = "mailing_zip = ?";
                    $params[] = $input['postal_code'];
                }

                // Skip these fields in regular processing
                $skipFields = array_merge($skipFields, ['mail_street', 'mailing_address_line2', 'mail_city', 'mail_state', 'mail_zip']);
            }

            // Handle billing_same_as_physical flag
            $billingSameAsPhysical = isset($input['billing_same_as_physical']) &&
                                     ($input['billing_same_as_physical'] === '1' || $input['billing_same_as_physical'] === 1);

            if (isset($input['billing_same_as_physical'])) {
                $updateFields[] = "billing_same_as_physical = ?";
                $params[] = $billingSameAsPhysical ? 1 : 0;
            }

            // If flag is true, copy physical address to billing and skip billing fields in regular processing
            if ($billingSameAsPhysical) {
                if (isset($input['street'])) {
                    $updateFields[] = "billing_address_line1 = ?";
                    $params[] = $input['street'];
                }
                if (isset($input['address_line2'])) {
                    $updateFields[] = "billing_address_line2 = ?";
                    $params[] = $input['address_line2'];
                }
                if (isset($input['city'])) {
                    $updateFields[] = "billing_city = ?";
                    $params[] = $input['city'];
                }
                if (isset($input['state'])) {
                    $updateFields[] = "billing_state = ?";
                    $params[] = $input['state'];
                }
                if (isset($input['postal_code'])) {
                    $updateFields[] = "billing_zip = ?";
                    $params[] = $input['postal_code'];
                }

                // Skip these fields in regular processing
                $skipFields = array_merge($skipFields, ['billing_street', 'billing_address_line2', 'billing_city', 'billing_state', 'billing_zip']);
            }

            // Process regular fields (skip mailing/billing if "same as physical" is checked)
            foreach ($fieldMap as $inputKey => $dbField) {
                // Skip fields that were already handled by "same as physical" logic
                if (in_array($inputKey, $skipFields)) {
                    continue;
                }

                if (array_key_exists($inputKey, $input)) {
                    $updateFields[] = "$dbField = ?";
                    $params[] = $input[$inputKey] ?: null;
                }
            }

            // Handle boolean flags
            if (isset($input['billing_location'])) {
                $updateFields[] = "billing_location = ?";
                $params[] = $input['billing_location'] ? 1 : 0;
            }

            if (isset($input['service_location'])) {
                $updateFields[] = "service_location = ?";
                $params[] = $input['service_location'] ? 1 : 0;
            }

            if (isset($input['accepts_assignment'])) {
                $updateFields[] = "accepts_assignment = ?";
                $params[] = $input['accepts_assignment'] ? 1 : 0;
            }

            if (isset($input['primary_business_entity'])) {
                $updateFields[] = "primary_business_entity = ?";
                $params[] = $input['primary_business_entity'] ? 1 : 0;
            }

            if (isset($input['is_primary'])) {
                $updateFields[] = "is_primary = ?";
                $params[] = $input['is_primary'] ? 1 : 0;
            }

            // Handle inactive flag (inverted to is_active)
            if (isset($input['inactive'])) {
                $updateFields[] = "is_active = ?";
                $params[] = $input['inactive'] ? 0 : 1; // Invert
            }

            if (empty($updateFields)) {
                throw new Exception('No fields to update');
            }

            $params[] = $facilityId;
            $sql = "UPDATE facilities SET " . implode(', ', $updateFields) . " WHERE id = ?";

            $db->execute($sql, $params);

            http_response_code(200);
            echo json_encode(['success' => true]);
            break;

        case 'DELETE':
            // Soft delete (set inactive)
            $facilityId = $_GET['id'] ?? $input['id'] ?? null;

            if (!$facilityId) {
                throw new Exception('Facility ID is required');
            }

            $sql = "UPDATE facilities SET is_active = 0 WHERE id = ?";
            $db->execute($sql, [$facilityId]);

            http_response_code(200);
            echo json_encode(['success' => true]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }

} catch (\Exception $e) {
    error_log("Facilities API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error', 'message' => $e->getMessage()]);
}
