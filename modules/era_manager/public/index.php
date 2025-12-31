<?php
/**
 * ERA Manager UI - Index
 *
 * Tabbed interface for Inbox, Logs, Parser, Posting, etc.
 * Styled to match moduleConfig.php for visual consistency.
 *
 * @package   OpenEMR Module: ERA Manager
 * @author    Kenneth J. Nelan
 * @license   GNU GPL v3
 */

use OpenEMR\Core\Header;

require_once(dirname(__FILE__) . '/../../../../../interface/globals.php');

$tab = $_GET['tab'] ?? 'inbox';
$tabFileMap = [
    'inbox' => 'tab_inbox.php',
    'parser' => 'tab_parser.php',
    'post'   => 'tab_post.php',
    'logs'   => 'tab_logs.php',
    'rejections'  => 'tab_rejections.php',
];

$activeFile = $tabFileMap[$tab] ?? $tabFileMap['inbox'];

Header::setupHeader(['bootstrap']);
?>

<!DOCTYPE html>
<html>
<head>
    <title>ERA Manager</title>
    <style>
        body {
            background-color: #f0f2f5;
            font-family: "Segoe UI", Tahoma, sans-serif;
        }

        .container-box {
            max-width: 1100px;
            background: #fff;
            margin: 40px auto;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        h2 {
            text-align: center;
            color: #343a40;
            font-weight: 600;
        }

        .tab-bar {
            display: flex;
            gap: 12px;
            margin-top: 20px;
            border-bottom: 2px solid #ccc;
        }

        .tab-link {
            padding: 10px 16px;
            border-radius: 8px 8px 0 0;
            background-color: #e9ecef;
            text-decoration: none;
            color: #333;
            font-weight: 500;
        }

        .tab-link.active {
            background-color: #ffffff;
            border-bottom: 2px solid #ffffff;
            color: #007bff;
        }

        .tab-content {
            border: 1px solid #dee2e6;
            border-top: none;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 0 0 12px 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
            margin-top: -1px;
        }
    </style>
</head>
<body>
<div class="container-box">
    <h2>📁 ERA Manager</h2>
    <p class="text-muted text-center">Manage incoming 835 (ERA) files from Office Ally. Use the tabs to fetch, parse, post, and track.</p>

    <div class="tab-bar">
        <a href="?tab=inbox" class="tab-link <?= $tab === 'inbox' ? 'active' : '' ?>">📥 Inbox</a>
        <a href="?tab=parser" class="tab-link <?= $tab === 'parser' ? 'active' : '' ?>">🧮 Parser</a>
        <a href="?tab=post" class="tab-link <?= $tab === 'post' ? 'active' : '' ?>">💸 Post Payments</a>
        <a href="?tab=logs" class="tab-link <?= $tab === 'logs' ? 'active' : '' ?>">📜 Logs</a>
        <a href="?tab=rejections" class="tab-link <?= $tab === 'rejections' ? 'active' : '' ?>">❌ Rejections</a>
    </div>

    <div class="tab-content">
        <?php require_once(__DIR__ . '/tabs/' . $activeFile); ?>
    </div>
</div>

<script>
top.restoreSession && top.restoreSession();
if (top.setTabTitle) {
    top.setTabTitle("ERA Manager");
}
</script>
</body>
</html>
