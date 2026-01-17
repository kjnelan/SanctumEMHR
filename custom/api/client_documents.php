<?php
/**
 * Client Documents API (MIGRATED TO MINDLINE)
 * Fetches documents for a specific client organized by category
 */

require_once(__DIR__ . '/../init.php');

use Custom\Lib\Database\Database;
use Custom\Lib\Session\SessionManager;

// Set JSON header (unless uploading file, which needs multipart)
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_FILES['file'])) {
    header('Content-Type: application/json');
}
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Initialize session and check authentication
    $session = SessionManager::getInstance();
    $session->start();

    if (!$session->isAuthenticated()) {
        error_log("Client documents: Not authenticated");
        http_response_code(401);
        echo json_encode(['error' => 'Not authenticated']);
        exit;
    }

    // Initialize database
    $db = Database::getInstance();

    // Handle POST (file upload)
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $clientId = $_POST['patient_id'] ?? null;
        $categoryId = $_POST['category_id'] ?? null;
        $documentName = $_POST['name'] ?? null;
        $documentDescription = $_POST['description'] ?? '';

        if (!$clientId) {
            http_response_code(400);
            echo json_encode(['error' => 'Patient ID is required']);
            exit;
        }

        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['error' => 'No file uploaded or upload error']);
            exit;
        }

        $file = $_FILES['file'];
        $uploadedFileName = $file['name'];
        $fileSize = $file['size'];
        $fileTmpPath = $file['tmp_name'];
        $fileMimeType = $file['type'];

        // Use provided name or fall back to uploaded filename
        $documentName = $documentName ?: $uploadedFileName;

        // Determine storage path - Mindline stores documents in storage/documents
        $documentsPath = dirname(__DIR__, 2) . '/storage/documents';

        // Create patient-specific directory if it doesn't exist
        $patientDir = $documentsPath . '/client_' . $clientId;
        if (!is_dir($patientDir)) {
            mkdir($patientDir, 0755, true);
        }

        // Generate unique filename to prevent overwrites
        $fileExtension = pathinfo($uploadedFileName, PATHINFO_EXTENSION);
        $baseFileName = pathinfo($uploadedFileName, PATHINFO_FILENAME);
        $uniqueFileName = $baseFileName . '_' . time() . '.' . $fileExtension;
        $destinationPath = $patientDir . '/' . $uniqueFileName;

        // Move uploaded file
        if (!move_uploaded_file($fileTmpPath, $destinationPath)) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to move uploaded file']);
            exit;
        }

        // Store relative path for database
        $relativeUrl = 'documents/client_' . $clientId . '/' . $uniqueFileName;

        // Insert into documents table
        $insertSql = "INSERT INTO documents (
            type,
            size,
            date,
            url,
            name,
            mimetype,
            foreign_id,
            owner,
            storagemethod,
            imported,
            deleted
        ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, 0, 0, 0)";

        $params = [
            'file_url',  // type
            $fileSize,
            $relativeUrl,
            $documentName,
            $fileMimeType,
            $clientId,  // foreign_id (patient_id)
            $session->getUserId()  // owner
        ];

        $documentId = $db->insert($insertSql, $params);

        // Link to category if provided
        if ($categoryId && $documentId) {
            $categorySql = "INSERT INTO categories_to_documents (category_id, document_id) VALUES (?, ?)";
            $db->execute($categorySql, [$categoryId, $documentId]);
        }

        error_log("Document uploaded successfully - ID: $documentId");

        header('Content-Type: application/json');
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'document_id' => $documentId,
            'message' => 'Document uploaded successfully'
        ]);
        exit;
    }

    // Handle GET (fetch documents or categories)
    $action = $_GET['action'] ?? 'documents';

    // Fetch all available categories (for upload dropdown)
    if ($action === 'categories') {
        $categoriesSql = "SELECT id, name, parent, lft, rght
                          FROM categories
                          WHERE name != 'Categories'
                          ORDER BY name";
        $categories = $db->queryAll($categoriesSql);

        http_response_code(200);
        echo json_encode(['categories' => $categories]);
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
    $documents = $db->queryAll($documentsSql, [$clientId]);

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

    $categories = $db->queryAll($categoriesSql, [$clientId]);

    error_log("Found " . count($categories) . " categories");

    $response = [
        'documents' => $documents,
        'categories' => $categories
    ];

    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    error_log("Error in client documents: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to process request',
        'message' => $e->getMessage()
    ]);
}
