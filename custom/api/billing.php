<?php
/**
 * Billing API - Session-based
 * Returns all billing/charges and payments for a patient across all encounters
 */

// Start output buffering to prevent any PHP warnings/notices from breaking JSON
ob_start();

// IMPORTANT: Set these BEFORE loading globals.php to prevent redirects
$ignoreAuth = true;
$ignoreAuth_onsite_portal = true;
$ignoreAuth_onsite_portal_two = true;

require_once(__DIR__ . '/../../interface/globals.php');

// Clear any output that globals.php might have generated
ob_end_clean();

// Enable error logging
error_log("Billing API called - Session ID: " . session_id());

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

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Billing: Not authenticated - authUserID not set");
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

error_log("Billing: User authenticated - " . $_SESSION['authUserID'] . ", fetching billing for patient ID: " . $patientId);

try {
    // Fetch all billing charges for this patient with encounter information
    $chargesSql = "SELECT
        b.id,
        b.encounter,
        b.code_type,
        b.code,
        b.code_text,
        b.modifier,
        b.units,
        b.fee,
        b.justify,
        b.authorized,
        b.billed,
        b.activity,
        b.payer_id,
        b.bill_date,
        b.bill_process,
        b.process_date,
        CONCAT(u.fname, ' ', u.lname) AS provider_name,
        fe.date AS encounter_date,
        fe.reason AS encounter_reason,
        fac.name AS facility_name
    FROM billing b
    LEFT JOIN users u ON u.id = b.provider_id
    LEFT JOIN form_encounter fe ON fe.encounter = b.encounter
    LEFT JOIN facility fac ON fac.id = fe.facility_id
    WHERE b.pid = ? AND b.activity = 1
    ORDER BY fe.date DESC, b.code_type, b.code";

    error_log("Charges SQL: " . $chargesSql);
    $chargesResult = sqlStatement($chargesSql, [$patientId]);
    $charges = [];
    $totalCharges = 0;
    while ($row = sqlFetchArray($chargesResult)) {
        $charges[] = $row;
        $totalCharges += floatval($row['fee']) * floatval($row['units']);
    }
    error_log("Found " . count($charges) . " billing charges for patient");

    // Fetch all payments for this patient
    $payments = [];
    $totalPayments = 0;

    try {
        $paymentsSql = "SELECT
            p.dtime,
            p.encounter,
            p.amount1,
            p.amount2,
            p.method,
            p.source,
            p.user,
            CONCAT(u.fname, ' ', u.lname) AS user_name,
            fe.date AS encounter_date,
            fe.reason AS encounter_reason
        FROM payments p
        LEFT JOIN users u ON u.id = p.user
        LEFT JOIN form_encounter fe ON fe.encounter = p.encounter
        WHERE p.pid = ?
        ORDER BY p.dtime DESC";

        error_log("Payments SQL: " . $paymentsSql);
        $paymentsResult = sqlStatement($paymentsSql, [$patientId]);

        while ($row = sqlFetchArray($paymentsResult)) {
            // Calculate total payment amount from amount1 and amount2
            $row['pay_amount'] = floatval($row['amount1']) + floatval($row['amount2']);
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
