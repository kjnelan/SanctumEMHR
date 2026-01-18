<?php
/**
 * Verify what code is actually loaded vs what's on disk
 */

echo "=== CODE VERIFICATION ===\n\n";

// Check facilities.php on disk
$facilitiesFile = __DIR__ . '/custom/api/facilities.php';
$facilitiesContent = file_get_contents($facilitiesFile);

echo "1. Facilities.php on disk:\n";
if (strpos($facilitiesContent, 'address_line1') !== false) {
    echo "   ✓ Contains 'address_line1' (NEW Mindline code)\n";
} else {
    echo "   ✗ Missing 'address_line1'\n";
}

if (strpos($facilitiesContent, 'street') !== false) {
    echo "   ✗ Contains 'street' (OLD OpenEMR code) - SHOULD NOT BE HERE\n";
} else {
    echo "   ✓ Does not contain 'street' (good)\n";
}

// Check init.php
$initFile = __DIR__ . '/custom/init.php';
$initContent = file_get_contents($initFile);

echo "\n2. Init.php on disk:\n";
if (strpos($initContent, 'session_start()') !== false) {
    echo "   ✗ Contains session_start() - THIS IS THE BUG\n";
} else {
    echo "   ✓ Does not contain session_start() (good)\n";
}

// Check PHP opcode cache status
echo "\n3. PHP OpCache Status:\n";
if (function_exists('opcache_get_status')) {
    $status = opcache_get_status();
    if ($status === false) {
        echo "   OpCache is DISABLED\n";
    } else {
        echo "   OpCache is ENABLED\n";
        echo "   - Memory used: " . round($status['memory_usage']['used_memory'] / 1024 / 1024, 2) . " MB\n";
        echo "   - Cached scripts: " . $status['opcache_statistics']['num_cached_scripts'] . "\n";
        echo "   - Hits: " . $status['opcache_statistics']['hits'] . "\n";
        echo "   - Misses: " . $status['opcache_statistics']['misses'] . "\n";

        // Check if our specific files are cached
        if (isset($status['scripts'])) {
            $facilitiesCached = isset($status['scripts'][$facilitiesFile]);
            $initCached = isset($status['scripts'][$initFile]);

            echo "\n   Cached files:\n";
            echo "   - facilities.php: " . ($facilitiesCached ? "CACHED" : "not cached") . "\n";
            echo "   - init.php: " . ($initCached ? "CACHED" : "not cached") . "\n";

            if ($facilitiesCached) {
                $cacheTime = $status['scripts'][$facilitiesFile]['timestamp'];
                $fileTime = filemtime($facilitiesFile);
                echo "     Cache time: " . date('Y-m-d H:i:s', $cacheTime) . "\n";
                echo "     File time:  " . date('Y-m-d H:i:s', $fileTime) . "\n";
                if ($fileTime > $cacheTime) {
                    echo "     ⚠️  FILE IS NEWER THAN CACHE - STALE CACHE!\n";
                }
            }
        }
    }
} else {
    echo "   OpCache extension not available\n";
}

// Check file timestamps
echo "\n4. File Timestamps:\n";
echo "   facilities.php: " . date('Y-m-d H:i:s', filemtime($facilitiesFile)) . "\n";
echo "   init.php: " . date('Y-m-d H:i:s', filemtime($initFile)) . "\n";
echo "   users.php: " . date('Y-m-d H:i:s', filemtime(__DIR__ . '/custom/api/users.php')) . "\n";

// Try to clear opcode cache
echo "\n5. Attempting to clear OpCache:\n";
if (function_exists('opcache_reset')) {
    if (opcache_reset()) {
        echo "   ✓ OpCache cleared successfully!\n";
    } else {
        echo "   ✗ OpCache clear failed (may need CLI/restart)\n";
    }
} else {
    echo "   OpCache reset function not available\n";
}

echo "\n=== INSTRUCTIONS ===\n";
echo "If you see 'STALE CACHE' above, run these commands:\n";
echo "   sudo systemctl restart php8.4-fpm\n";
echo "   sudo systemctl restart apache2\n";
echo "   (or whatever web server you're using)\n";
