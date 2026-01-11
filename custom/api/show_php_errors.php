<?php
/**
 * Show recent PHP error log entries
 */

header('Content-Type: text/plain');

// Try common PHP error log locations
$logLocations = [
    '/var/log/php_errors.log',
    '/var/log/php-fpm/error.log',
    '/var/log/apache2/error.log',
    '/var/log/httpd/error_log',
    ini_get('error_log'),
    '/tmp/php_errors.log'
];

foreach ($logLocations as $logFile) {
    if (file_exists($logFile) && is_readable($logFile)) {
        echo "=== Found log file: $logFile ===\n\n";
        echo "Last 100 lines:\n";
        echo str_repeat("=", 80) . "\n";
        echo shell_exec("tail -100 " . escapeshellarg($logFile));
        echo "\n\n";
    }
}

// Also check for OpenEMR specific logs
$openemrLogs = __DIR__ . '/../../logs/';
if (is_dir($openemrLogs)) {
    echo "=== OpenEMR logs directory: $openemrLogs ===\n";
    $files = scandir($openemrLogs);
    foreach ($files as $file) {
        if ($file != '.' && $file != '..') {
            $fullPath = $openemrLogs . $file;
            if (is_file($fullPath)) {
                echo "\n--- $file ---\n";
                echo file_get_contents($fullPath);
                echo "\n";
            }
        }
    }
}
