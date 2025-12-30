<?php
/**
 * Client Documents API
 * Fetches documents for a specific client organized by category
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
error_log("Client documents API called - Session ID: " . session_id());

// Set JSON header
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Check if user is authenticated via session
if (!isset($_SESSION['authUserID']) || empty($_SESSION['authUserID'])) {
    error_log("Client documents: Not authenticated - authUserID not set");
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

// Get client ID
$clientId = $_GET['id'] ?? null;

if (!$clientId) {
    error_log("Client documents: No client ID provided");
    http_response_code(400);
    echo json_encode(['error' => 'Client ID is required']);
    exit;
}

error_log("Client documents: Fetching documents for client ID: " . $clientId);

try {
    // Fetch documents with category information
    $documentsSql = "SELECT
        d.id,
        d.type,
        d.size,
        d.date,
        d.url,
        d.name,
        d.mimetype,
        d.foreign_id,
        d.docdate,
        d.list_id,
        c.id AS category_id,
        c.name AS category_name,
        c.parent AS category_parent,
        c.lft AS category_lft,
        c.rght AS category_rght
    FROM documents d
    LEFT JOIN categories_to_documents ctd ON d.id = ctd.document_id
    LEFT JOIN categories c ON ctd.category_id = c.id
    WHERE d.foreign_id = ?
    AND d.deleted = 0
    ORDER BY c.name, d.date DESC";

    error_log("Documents SQL: " . $documentsSql);
    $documentsResult = sqlStatement($documentsSql, [$clientId]);

    $documents = [];
    while ($row = sqlFetchArray($documentsResult)) {
        $documents[] = $row;
    }

    error_log("Found " . count($documents) . " documents");

    // Fetch all categories for this patient
    $categoriesSql = "SELECT DISTINCT
        c.id,
        c.name,
        c.parent,
        c.lft,
        c.rght
    FROM categories c
    INNER JOIN categories_to_documents ctd ON c.id = ctd.category_id
    INNER JOIN documents d ON ctd.document_id = d.id
    WHERE d.foreign_id = ?
    AND d.deleted = 0
    ORDER BY c.name";

    $categoriesResult = sqlStatement($categoriesSql, [$clientId]);
    $categories = [];
    while ($row = sqlFetchArray($categoriesResult)) {
        $categories[] = $row;
    }

    error_log("Found " . count($categories) . " categories");

    $response = [
        'documents' => $documents,
        'categories' => $categories
    ];

    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error fetching client documents: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch documents',
        'message' => $e->getMessage()
    ]);
}
