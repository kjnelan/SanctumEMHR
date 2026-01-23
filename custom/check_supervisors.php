<?php
/**
 * Diagnostic script to show supervisor data
 */

require_once(__DIR__ . '/init.php');

use Custom\Lib\Database\Database;

try {
    $db = Database::getInstance();

    echo "=== USERS WHO ARE SUPERVISORS (is_supervisor = 1) ===\n";
    $supervisors = $db->queryAll("
        SELECT id, username, CONCAT(first_name, ' ', last_name) as name, title, is_supervisor
        FROM users
        WHERE is_supervisor = 1
        ORDER BY last_name, first_name
    ");

    foreach ($supervisors as $sup) {
        echo "  [{$sup['id']}] {$sup['name']} ({$sup['username']})";
        if ($sup['title']) echo " - {$sup['title']}";
        echo "\n";
    }
    echo "  Total: " . count($supervisors) . " users can supervise\n\n";

    echo "=== USERS WITH LEGACY supervisor_id ===\n";
    $legacySupervised = $db->queryAll("
        SELECT
            u.id,
            u.username,
            CONCAT(u.first_name, ' ', u.last_name) as name,
            u.supervisor_id,
            CONCAT(s.first_name, ' ', s.last_name) as supervisor_name
        FROM users u
        LEFT JOIN users s ON u.supervisor_id = s.id
        WHERE u.supervisor_id IS NOT NULL
        ORDER BY u.last_name, u.first_name
    ");

    if (empty($legacySupervised)) {
        echo "  No users have supervisor_id set (legacy field is empty)\n\n";
    } else {
        foreach ($legacySupervised as $user) {
            echo "  [{$user['id']}] {$user['name']} -> supervised by [{$user['supervisor_id']}] {$user['supervisor_name']}\n";
        }
        echo "  Total: " . count($legacySupervised) . " users\n\n";
    }

    echo "=== SUPERVISOR RELATIONSHIPS (user_supervisors table) ===\n";
    $relationships = $db->queryAll("
        SELECT
            us.id,
            us.user_id,
            CONCAT(u.first_name, ' ', u.last_name) as user_name,
            us.supervisor_id,
            CONCAT(s.first_name, ' ', s.last_name) as supervisor_name,
            us.relationship_type,
            us.started_at,
            us.ended_at
        FROM user_supervisors us
        JOIN users u ON us.user_id = u.id
        JOIN users s ON us.supervisor_id = s.id
        ORDER BY us.started_at DESC
    ");

    if (empty($relationships)) {
        echo "  No supervisor relationships assigned yet (table is empty)\n\n";
    } else {
        foreach ($relationships as $rel) {
            $status = $rel['ended_at'] ? " [ENDED: {$rel['ended_at']}]" : " [ACTIVE]";
            echo "  [{$rel['user_id']}] {$rel['user_name']} <- supervised by [{$rel['supervisor_id']}] {$rel['supervisor_name']} ({$rel['relationship_type']}){$status}\n";
        }
        echo "  Total: " . count($relationships) . " relationships\n\n";
    }

    echo "\n=== SUMMARY ===\n";
    echo "Users who CAN supervise: " . count($supervisors) . "\n";
    echo "Users with legacy supervisor_id: " . count($legacySupervised) . "\n";
    echo "Active supervisor relationships: " . count($relationships) . "\n\n";

    echo "EXPLANATION:\n";
    echo "- is_supervisor = 1 means the user is QUALIFIED to supervise others\n";
    echo "- supervisor_id (legacy) was the OLD way to assign ONE supervisor\n";
    echo "- user_supervisors table is the NEW way to assign MULTIPLE supervisors\n";
    echo "- Currently, nobody has been assigned supervisors using the new system yet\n";

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
