<?php
/**
 * SanctumEMHR - Client Portal Profile API
 *
 * GET  - Returns client's own demographic/profile data
 * PUT  - Updates allowed profile fields (address, phone, email, emergency contact)
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright (c) 2026 Sacred Wandering
 * Proprietary and Confidential
 */

require_once dirname(__FILE__, 3) . "/init.php";

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    $session = SessionManager::getInstance();
    $session->start();

    $clientId = $_SESSION['portal_client_id'] ?? null;
    if (!$clientId || ($_SESSION['session_type'] ?? '') !== 'portal') {
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    $db = Database::getInstance();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $sql = "SELECT c.id, c.first_name, c.last_name, c.preferred_name, c.middle_name,
                       c.date_of_birth, c.sex, c.email, c.phone_mobile, c.phone_home,
                       c.address_line1, c.address_line2, c.city, c.state, c.zip,
                       c.emergency_contact_name, c.emergency_contact_relation,
                       c.emergency_contact_phone,
                       c.primary_provider_id, c.facility_id,
                       CONCAT(u.first_name, ' ', u.last_name) AS provider_name,
                       f.name AS facility_name
                FROM clients c
                LEFT JOIN users u ON u.id = c.primary_provider_id
                LEFT JOIN facilities f ON f.id = c.facility_id
                WHERE c.id = ?
                LIMIT 1";
        $client = $db->query($sql, [$clientId]);

        if (!$client) {
            http_response_code(404);
            echo json_encode(['error' => 'Profile not found']);
            exit;
        }

        echo json_encode([
            'success' => true,
            'profile' => [
                'firstName' => $client['first_name'],
                'lastName' => $client['last_name'],
                'preferredName' => $client['preferred_name'],
                'middleName' => $client['middle_name'],
                'dateOfBirth' => $client['date_of_birth'],
                'sex' => $client['sex'],
                'email' => $client['email'],
                'phoneMobile' => $client['phone_mobile'],
                'phoneHome' => $client['phone_home'],
                'addressLine1' => $client['address_line1'],
                'addressLine2' => $client['address_line2'],
                'city' => $client['city'],
                'state' => $client['state'],
                'zip' => $client['zip'],
                'emergencyContactName' => $client['emergency_contact_name'],
                'emergencyContactRelation' => $client['emergency_contact_relation'],
                'emergencyContactPhone' => $client['emergency_contact_phone'],
                'providerName' => $client['provider_name'],
                'facilityName' => $client['facility_name']
            ]
        ]);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);

        // Only allow clients to update these specific fields
        $allowedFields = [
            'email' => 'email',
            'phoneMobile' => 'phone_mobile',
            'phoneHome' => 'phone_home',
            'addressLine1' => 'address_line1',
            'addressLine2' => 'address_line2',
            'city' => 'city',
            'state' => 'state',
            'zip' => 'zip',
            'emergencyContactName' => 'emergency_contact_name',
            'emergencyContactRelation' => 'emergency_contact_relation',
            'emergencyContactPhone' => 'emergency_contact_phone',
            'preferredName' => 'preferred_name'
        ];

        $updates = [];
        $params = [];

        foreach ($allowedFields as $inputKey => $dbColumn) {
            if (array_key_exists($inputKey, $input)) {
                $updates[] = "$dbColumn = ?";
                $params[] = $input[$inputKey] ?: null;
            }
        }

        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['error' => 'No valid fields to update']);
            exit;
        }

        $params[] = $clientId;
        $sql = "UPDATE clients SET " . implode(', ', $updates) . " WHERE id = ?";
        $db->execute($sql, $params);

        // Audit log
        $changedFields = array_keys(array_intersect_key($allowedFields, $input));
        $db->execute(
            "INSERT INTO audit_log (user_id, event_type, table_name, record_id, details, created_at)
             VALUES (?, 'portal_profile_update', 'clients', ?, ?, NOW())",
            [0, $clientId, 'Portal profile updated: ' . implode(', ', $changedFields)]
        );

        echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);

} catch (\Exception $e) {
    error_log("Portal profile error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
