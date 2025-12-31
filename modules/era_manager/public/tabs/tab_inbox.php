<?php
/**
 * ERA Inbox Tab
 *
 * Displays fetched ERA zip/835 files from the inbox.
 * Includes fetch button, success/error alerts, and file table.
 *
 * @package   OpenEMR Module: ERA Manager
 * @author    Kenneth J. Nelan
 * @license   GNU GPL v3
 */

use OpenEMR\Modules\OaEraManager\FileFetcher;
use OpenEMR\Modules\OaEraManager\ERAHelper;

require_once(dirname(__DIR__, 2) . '/src/FileFetcher.php');
require_once(dirname(__DIR__, 2) . '/src/ERAHelper.php');

// Ensure inbox + processed directories exist
ERAHelper::ensureInboxDirs();

$inboxPath = $GLOBALS['fileroot'] . '/sites/default/documents/edi/era_inbox/';
$message = '';
$error = '';

// Handle Fetch button POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['fetch_files'])) {
    try {
        FileFetcher::fetchFromSFTP();
        $message = "✅ ERA files successfully fetched and unzipped.";
    } catch (Exception $e) {
        $error = "❌ Error: " . htmlspecialchars($e->getMessage());
    }
}

// Warn if inbox path still doesn't exist
if (!is_dir($inboxPath)) {
    echo "<div class='alert alert-danger mt-3'>⚠️ <strong>ERA Inbox directory not found:</strong> <code>$inboxPath</code><br>Please create this directory manually or check write permissions.</div>";
    return;
}
?>

<?php if (!empty($message)) : ?>
    <div class="alert alert-success"><?= $message ?></div>
<?php endif; ?>

<?php if (!empty($error)) : ?>
    <div class="alert alert-danger"><?= $error ?></div>
<?php endif; ?>

<form method="POST" style="margin-bottom: 20px;">
    <button type="submit" name="fetch_files" class="btn btn-primary">📡 Fetch ERA Files from Office Ally</button>
</form>

<hr>

<h4>📄 ERA Files in Inbox:</h4>

<?php
$files = array_merge(
    glob($inboxPath . '*.835'),
    glob($inboxPath . '*.txt')
);

if (empty($files)) {
    echo "<div class='text-muted'><em>No ERA files found in the inbox directory.</em></div>";
} else {
    echo "<table class='table table-sm table-striped'>";
    echo "<thead><tr><th>Filename</th><th>Size</th><th>Last Modified</th></tr></thead><tbody>";

    foreach ($files as $file) {
        $basename = basename($file);
        $size = filesize($file);
        $modified = date("Y-m-d H:i:s", filemtime($file));

        echo "<tr>";
        echo "<td><code>$basename</code></td>";
        echo "<td>" . number_format($size) . " bytes</td>";
        echo "<td>$modified</td>";
        echo "</tr>";
    }

    echo "</tbody></table>";
}
?>
