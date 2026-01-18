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
        $documentTitle = $_POST['name'] ?? null;
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
        $documentTitle = $documentTitle ?: pathinfo($uploadedFileName, PATHINFO_FILENAME);

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
        $relativePath = 'documents/client_' . $clientId . '/' . $uniqueFileName;

        // Insert into documents table - mapped to Mindline schema
        $insertSql = "INSERT INTO documents (
            client_id,
            category_id,
            title,
            description,
            file_name,
            file_path,
            file_size,
            mime_type,
            uploaded_by,
            is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)";

        $params = [
            $clientId,
            $categoryId ?: null,
            $documentTitle,
            $documentDescription,
            $uniqueFileName,
            $relativePath,
            $fileSize,
            $fileMimeType,
            $session->getUserId()
        ];

        $documentId = $db->insert($insertSql, $params);

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
        $categoriesSql = "SELECT
            id,
            name,
            parent_id AS parent,
            lft,
            rght,
            description
        FROM document_categories
        WHERE is_active = 1
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

    // Fetch documents with category information - mapped to Mindline schema
    $documentsSql = "SELECT
        d.id,
        'file_url' AS type,
        d.file_size AS size,
        d.uploaded_at AS date,
        d.file_path AS url,
        d.title AS name,
        d.mime_type AS mimetype,
        d.client_id AS foreign_id,
        d.document_date AS docdate,
        NULL AS list_id,
        d.category_id,
        c.name AS category_name,
        c.parent_id AS category_parent,
        c.lft AS category_lft,
        c.rght AS category_rght,
        d.description,
        d.file_name,
        CONCAT(u.first_name, ' ', u.last_name) AS uploaded_by_name
    FROM documents d
    LEFT JOIN document_categories c ON d.category_id = c.id
    LEFT JOIN users u ON d.uploaded_by = u.id
    WHERE d.client_id = ?
    AND d.is_active = 1
    ORDER BY c.name, d.uploaded_at DESC";

    error_log("Documents SQL: " . $documentsSql);
    $documents = $db->queryAll($documentsSql, [$clientId]);

    error_log("Found " . count($documents) . " documents");

    // Fetch all categories for this patient
    $categoriesSql = "SELECT DISTINCT
        c.id,
        c.name,
        c.parent_id AS parent,
        c.lft,
        c.rght,
        c.description
    FROM document_categories c
    INNER JOIN documents d ON c.id = d.category_id
    WHERE d.client_id = ?
    AND d.is_active = 1
    AND c.is_active = 1
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
