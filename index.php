<?php
/**
 * Mindline EMHR - Application Entry Point
 * Serves the React frontend application
 */

// Serve the React application from /app folder
$appPath = __DIR__ . '/app/index.html';

if (file_exists($appPath)) {
    // Set appropriate content type
    header('Content-Type: text/html; charset=UTF-8');

    // Disable caching for the main HTML file (assets are cache-busted via hashing)
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');

    // Serve the application
    readfile($appPath);
} else {
    // App not built yet
    http_response_code(503);
    echo "<!DOCTYPE html>
<html>
<head>
    <title>Mindline EMHR - Build Required</title>
    <style>
        body { font-family: system-ui; max-width: 600px; margin: 100px auto; padding: 20px; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>Mindline EMHR</h1>
    <p>The React frontend has not been built yet.</p>
    <p>Please build the application:</p>
    <pre><code>cd react-frontend && npm run build</code></pre>
    <p>This will create the production build in the <code>/app</code> directory.</p>
</body>
</html>";
}
