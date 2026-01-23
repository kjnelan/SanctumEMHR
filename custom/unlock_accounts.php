<?php
/**
 * Unlock all locked user accounts
 * Run this script to reset failed login attempts and clear lockout times
 */

require_once(__DIR__ . '/init.php');

use Custom\Lib\Database\Database;

try {
    $db = Database::getInstance();

    // Unlock all accounts
    $sql = "UPDATE users
            SET locked_until = NULL,
                failed_login_attempts = 0
            WHERE locked_until IS NOT NULL
               OR failed_login_attempts > 0";

    $db->execute($sql);

    // Get count of unlocked accounts
    $result = $db->query("SELECT COUNT(*) as count FROM users WHERE locked_until IS NULL AND failed_login_attempts = 0");

    echo "✓ Successfully unlocked all user accounts\n";
    echo "Total active accounts: {$result['count']}\n\n";

    // Show users that were affected
    $affected = $db->queryAll("SELECT id, username, last_login_at FROM users ORDER BY id");

    echo "All users:\n";
    foreach ($affected as $user) {
        echo "  - {$user['username']} (ID: {$user['id']}) - Last login: " . ($user['last_login_at'] ?? 'Never') . "\n";
    }

} catch (\Exception $e) {
    echo "✗ Error unlocking accounts: " . $e->getMessage() . "\n";
    exit(1);
}
