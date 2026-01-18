<!DOCTYPE html>
<html>
<head>
    <title>PHP Cache Status</title>
    <style>
        body { font-family: monospace; padding: 20px; }
        .good { color: green; }
        .bad { color: red; }
        .warning { color: orange; }
        pre { background: #f5f5f5; padding: 10px; }
    </style>
</head>
<body>
<h1>PHP OpCache Status (Web Server)</h1>

<?php
// Check if OpCache is available
if (!function_exists('opcache_get_status')) {
    echo '<p class="warning">OpCache extension is not available</p>';
    exit;
}

$status = opcache_get_status(true); // true = get scripts info too

if ($status === false) {
    echo '<p class="good">OpCache is DISABLED for web requests</p>';
    exit;
}

echo '<p class="bad">OpCache is <strong>ENABLED</strong> for web requests</p>';

echo '<h2>Memory Usage</h2>';
echo '<pre>';
echo "Used: " . round($status['memory_usage']['used_memory'] / 1024 / 1024, 2) . " MB\n";
echo "Free: " . round($status['memory_usage']['free_memory'] / 1024 / 1024, 2) . " MB\n";
echo "Wasted: " . round($status['memory_usage']['wasted_memory'] / 1024 / 1024, 2) . " MB\n";
echo '</pre>';

echo '<h2>Statistics</h2>';
echo '<pre>';
echo "Cached scripts: " . $status['opcache_statistics']['num_cached_scripts'] . "\n";
echo "Hits: " . $status['opcache_statistics']['hits'] . "\n";
echo "Misses: " . $status['opcache_statistics']['misses'] . "\n";
echo "Hit rate: " . round($status['opcache_statistics']['opcache_hit_rate'], 2) . "%\n";
echo '</pre>';

// Check our specific files
$basePath = realpath(__DIR__);
$checkFiles = [
    'custom/init.php',
    'custom/api/facilities.php',
    'custom/api/users.php',
    'custom/api/document_categories.php',
    'custom/api/session_user.php'
];

echo '<h2>Critical Files Cache Status</h2>';
echo '<table border="1" cellpadding="5">';
echo '<tr><th>File</th><th>Cached?</th><th>Cache Time</th><th>File Time</th><th>Status</th></tr>';

foreach ($checkFiles as $file) {
    $fullPath = $basePath . '/' . $file;
    $realPath = realpath($fullPath);

    echo '<tr>';
    echo '<td>' . htmlspecialchars($file) . '</td>';

    if (!file_exists($fullPath)) {
        echo '<td colspan="4" class="bad">File not found!</td>';
    } else {
        $fileTime = filemtime($realPath);
        $isCached = isset($status['scripts'][$realPath]);

        if ($isCached) {
            $cacheInfo = $status['scripts'][$realPath];
            $cacheTime = $cacheInfo['timestamp'];

            echo '<td class="bad">YES</td>';
            echo '<td>' . date('Y-m-d H:i:s', $cacheTime) . '</td>';
            echo '<td>' . date('Y-m-d H:i:s', $fileTime) . '</td>';

            if ($fileTime > $cacheTime) {
                echo '<td class="bad"><strong>⚠️ STALE! File newer than cache</strong></td>';
            } else {
                echo '<td class="good">OK</td>';
            }
        } else {
            echo '<td class="good">NO</td>';
            echo '<td>-</td>';
            echo '<td>' . date('Y-m-d H:i:s', $fileTime) . '</td>';
            echo '<td class="good">Not cached (will load fresh)</td>';
        }
    }

    echo '</tr>';
}

echo '</table>';

// Try to clear cache
echo '<h2>Clear Cache</h2>';
if (opcache_reset()) {
    echo '<p class="good">✓ OpCache cleared successfully!</p>';
    echo '<p>Refresh this page to verify cache was cleared.</p>';
} else {
    echo '<p class="bad">✗ OpCache clear failed. You may need to:</p>';
    echo '<ul>';
    echo '<li>Set <code>opcache.restrict_api</code> to empty in php.ini, or</li>';
    echo '<li>Restart PHP-FPM: <code>sudo systemctl restart php8.2-fpm</code></li>';
    echo '<li>Restart Apache: <code>sudo systemctl restart apache2</code></li>';
    echo '</ul>';
}

// Show PHP config
echo '<h2>PHP OpCache Configuration</h2>';
echo '<pre>';
echo "opcache.enable: " . ini_get('opcache.enable') . "\n";
echo "opcache.enable_cli: " . ini_get('opcache.enable_cli') . "\n";
echo "opcache.revalidate_freq: " . ini_get('opcache.revalidate_freq') . " seconds\n";
echo "opcache.validate_timestamps: " . ini_get('opcache.validate_timestamps') . "\n";
echo "opcache.restrict_api: " . (ini_get('opcache.restrict_api') ?: '(empty)') . "\n";
echo '</pre>';

echo '<p><em>Last checked: ' . date('Y-m-d H:i:s') . '</em></p>';
?>

<hr>
<p><a href="check_web_cache.php">Refresh this page</a></p>

</body>
</html>
