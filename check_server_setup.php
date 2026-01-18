<?php
echo "=== CHECKING SERVER SETUP ===\n\n";

// Check 1: vendor/autoload.php
echo "1. Checking vendor/autoload.php...\n";
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    echo "   ✓ vendor/autoload.php exists\n";
} else {
    echo "   ✗ vendor/autoload.php MISSING!\n";
    echo "   Run: composer install\n";
}

// Check 2: custom/Lib directory
echo "\n2. Checking custom/Lib directory (case sensitive)...\n";
if (is_dir(__DIR__ . '/custom/Lib')) {
    echo "   ✓ custom/Lib exists (correct case)\n";
} else {
    echo "   ✗ custom/Lib NOT FOUND\n";
}

if (is_dir(__DIR__ . '/custom/lib')) {
    echo "   ! custom/lib exists (WRONG CASE - should be capital L)\n";
    echo "   Run: mv custom/lib custom/Lib\n";
}

// Check 3: Database class file
echo "\n3. Checking Database class file...\n";
$dbFile = __DIR__ . '/custom/Lib/Database/Database.php';
if (file_exists($dbFile)) {
    echo "   ✓ $dbFile exists\n";
} else {
    echo "   ✗ $dbFile NOT FOUND\n";
    
    $oldPath = __DIR__ . '/custom/lib/Database/Database.php';
    if (file_exists($oldPath)) {
        echo "   ! File exists at old path: $oldPath\n";
        echo "   Directory needs to be renamed: custom/lib → custom/Lib\n";
    }
}

// Check 4: composer.json
echo "\n4. Checking composer.json autoload config...\n";
if (file_exists(__DIR__ . '/composer.json')) {
    $composer = json_decode(file_get_contents(__DIR__ . '/composer.json'), true);
    if (isset($composer['autoload']['psr-4']['Custom\\'])) {
        echo "   ✓ Custom\\ namespace configured: " . $composer['autoload']['psr-4']['Custom\\'] . "\n";
    } else {
        echo "   ✗ Custom\\ namespace NOT configured in composer.json\n";
        echo "   Add to composer.json autoload.psr-4: \"Custom\\\\\": \"custom\"\n";
    }
}

// Check 5: config/database.php
echo "\n5. Checking config/database.php...\n";
if (file_exists(__DIR__ . '/config/database.php')) {
    echo "   ✓ config/database.php exists\n";
} else {
    echo "   ✗ config/database.php MISSING!\n";
}

echo "\n=== DIAGNOSIS COMPLETE ===\n";
