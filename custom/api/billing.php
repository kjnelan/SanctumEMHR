<?php
/**
 * Billing API - Session-based (MIGRATED TO MINDLINE)
 * Returns all billing/charges and payments for a patient
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    error_log("Billing: Invalid method - " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Billing: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    // Get patient ID from query parameter
    $patientId = $_GET['patient_id'] ?? null;

    if (!$patientId) {
        error_log("Billing: No patient ID provided");
        http_response_code(400);
        echo json_encode(['error' => 'Patient ID is required']);
        exit;
    }

    error_log("Billing: User authenticated - " . $session->getUserId() . ", fetching billing for patient ID: " . $patientId);

    // Initialize database
    $db = Database::getInstance();

    // Fetch all billing charges for this patient
    $chargesSql = "SELECT
        bc.id,
        bc.encounter_id,
        bc.code_type,
        bc.code,
        bc.description AS code_text,
        bc.modifier,
        bc.units,
        bc.unit_price AS fee,
        bc.justification AS justify,
        bc.is_authorized AS authorized,
        bc.is_billed AS billed,
        bc.is_active AS activity,
        bc.payer_id,
        bc.billed_date AS bill_date,
        bc.created_at AS process_date,
        CONCAT(u.first_name, ' ', u.last_name) AS provider_name,
        bc.provider_id
    FROM billing_charges bc
    LEFT JOIN users u ON u.id = bc.provider_id
    WHERE bc.client_id = ? AND bc.is_active = 1
    ORDER BY bc.created_at DESC, bc.code_type, bc.code";

    error_log("Charges SQL: " . $chargesSql);
    $rows = $db->queryAll($chargesSql, [$patientId]);

    $charges = [];
    $totalCharges = 0;
    foreach ($rows as $row) {
        // Map Mindline fields to old OpenEMR field names for compatibility
        $charges[] = [
            'id' => $row['id'],
            'encounter' => $row['encounter_id'],
            'code_type' => $row['code_type'],
            'code' => $row['code'],
            'code_text' => $row['code_text'],
            'modifier' => $row['modifier'],
            'units' => $row['units'],
            'fee' => $row['fee'],
            'justify' => $row['justify'],
            'authorized' => $row['authorized'],
            'billed' => $row['billed'],
            'activity' => $row['activity'],
            'payer_id' => $row['payer_id'],
            'bill_date' => $row['bill_date'],
            'bill_process' => null, // Not in Mindline schema
            'process_date' => $row['process_date'],
            'provider_name' => $row['provider_name'],
            'provider_id' => $row['provider_id'],
            'encounter_date' => null, // Would need join to encounters table
            'encounter_reason' => null,
            'facility_name' => null
        ];
        $totalCharges += floatval($row['fee']) * floatval($row['units']);
    }
    error_log("Found " . count($charges) . " billing charges for patient");

    // Fetch all payments for this patient
    $payments = [];
    $totalPayments = 0;

    try {
        $paymentsSql = "SELECT
            p.id,
            p.payment_date AS dtime,
            p.encounter_id AS encounter,
            p.amount,
            0 AS amount1,
            0 AS amount2,
            p.payment_method AS method,
            p.payment_source AS source,
            p.created_by AS user,
            CONCAT(u.first_name, ' ', u.last_name) AS user_name
        FROM payments p
        LEFT JOIN users u ON u.id = p.created_by
        WHERE p.client_id = ?
        ORDER BY p.payment_date DESC";

        error_log("Payments SQL: " . $paymentsSql);
        $paymentRows = $db->queryAll($paymentsSql, [$patientId]);

        foreach ($paymentRows as $row) {
            // Map to old format
            $row['pay_amount'] = floatval($row['amount']);
            $row['amount1'] = $row['amount']; // For backward compatibility
            $row['amount2'] = 0;
            $row['encounter_date'] = null; // Would need join
            $row['encounter_reason'] = null;
            $payments[] = $row;
            $totalPayments += $row['pay_amount'];
        }
        error_log("Found " . count($payments) . " payments for patient");
    } catch (Exception $e) {
        error_log("Payments query failed: " . $e->getMessage());
        // Continue without payment data
    }

    // Calculate balance
    $balance = $totalCharges - $totalPayments;

    // Build response
    $response = [
        'patient_id' => $patientId,
        'charges' => $charges,
        'payments' => $payments,
        'summary' => [
            'total_charges' => $totalCharges,
            'total_payments' => $totalPayments,
            'balance' => $balance,
            'charge_count' => count($charges),
            'payment_count' => count($payments)
        ]
    ];

    error_log("Billing: Successfully built response for patient " . $patientId);
    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error fetching billing: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch billing',
        'message' => $e->getMessage()
    ]);
}
