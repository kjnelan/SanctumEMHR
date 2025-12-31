<?php
/**
 * ERA Parser Tab
 *
 * Parses and displays 835 ERA files and their associated human-readable
 * status summaries (typically provided by Office Ally in .txt format).
 * 
 * This version supports:
 * - Clean dropdown listing of .835 files
 * - Parsing of .835 files via ERAParser
 * - Lookup and parsing of corresponding .txt summary files via ERAStatusParser
 * - Simple, readable visual output for both file types
 *
 * Author: Kenneth J. Nelan
 * License: GPL-3.0
 * Version: 1.1.0
 */

// ------------------------
// Bootstrap OpenEMR Environment
// ------------------------
require_once(__DIR__ . '/../../../../../globals.php');

// ------------------------
// Load Required Parsers
// ------------------------
require_once($GLOBALS['fileroot'] . '/interface/modules/custom_modules/oe-module-oa-era-manager/src/ERAParser.php');
require_once($GLOBALS['fileroot'] . '/interface/modules/custom_modules/oe-module-oa-era-manager/src/ERAStatusParser.php');

use OpenEMR\Core\Header;
use OpenEMR\Modules\OaEraManager\ERAParser;
use OpenEMR\Modules\OaEraManager\ERAStatusParser;
?>

<!DOCTYPE html>
<html>
<head>
    <?php Header::setupHeader(['jquery-ui', 'style']); ?>
    <title>ERA Manager - Parser</title>
    <style>
        .era-file-select { margin-bottom: 1rem; }
        .era-summary {
            margin-top: 1rem;
            padding: 1rem;
            border: 1px solid #ccc;
            background: #f9f9f9;
        }
        .claim-detail {
            padding: 0.5rem;
            margin: 0.25rem 0;
            border-left: 3px solid #2e7d32;
            background: #f1f8e9;
        }
    </style>
</head>
<body>

<div class="container">
    <h2>📄 ERA Parser</h2>

    <!-- ERA File Selection Dropdown -->
    <form method="post">
        <label for="era_file">Select ERA File:</label>
        <select name="era_file" id="era_file" class="era-file-select">
            <option value="">-- Select ERA file --</option>
            <?php
            $era_dir = $GLOBALS['OE_SITE_DIR'] . "/documents/edi/era_inbox";
            $files = array_filter(scandir($era_dir), function ($f) {
                return preg_match('/\.835$/', $f);
            });
            foreach ($files as $f) {
                echo "<option value='" . attr($f) . "'>" . text($f) . "</option>";
            }
            ?>
        </select>
        <input type="submit" value="Parse" class="btn btn-primary" />
    </form>

    <?php
    // -------------------------
    // Handle Form Submission
    // -------------------------
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['era_file'])) {
        $file = basename($_POST['era_file']);
        $fullpath = $era_dir . '/' . $file;

        // -------------------------
        // PART 1: Parse .835 ERA File
        // -------------------------
        if (file_exists($fullpath)) {
            $parser = new ERAParser($fullpath);
            $claims = $parser->parse();

            echo "<div class='era-summary'>";
            echo "<h3>📦 Parsed from .835 File: " . text($file) . "</h3>";
            echo "<p><strong>Total Claims:</strong> " . count($claims) . "</p>";
            echo "<h4>Claim Summary:</h4>";

            foreach ($claims as $claim) {
                echo "<div class='claim-detail'>";
                echo "<strong>Patient:</strong> " . text($claim['patient_name']) . "<br/>";
                echo "<strong>Claim #:</strong> " . text($claim['claim_number']) . "<br/>";
                echo "<strong>Status:</strong> " . text($claim['claim_status']) . "<br/>";
                echo "<strong>Paid:</strong> $" . text($claim['paid_amount']) . "<br/>";
                echo "<strong>Payer:</strong> " . text($claim['payer_name']) . "<br/>";
                echo "<strong>Check #:</strong> " . text($claim['check_number']) . "<br/>";
                echo "</div>";
            }

            echo "</div>";

            // -----------------------------------------------
            // PART 2: Try Parsing Matching Office Ally .txt File
            // -----------------------------------------------

$statusFile = str_replace('_ERA_835_', '_ERA_STATUS_', $file);
$statusFile = preg_replace('/\.835$/', '.txt', $statusFile);


            $statusPath = $era_dir . '/' . $statusFile;

            if (file_exists($statusPath)) {
                $txtParser = new ERAStatusParser($statusPath);
                $statusClaims = $txtParser->parse();

                echo "<div class='era-summary'>";
                echo "<h3>📄 Parsed from .txt Summary: " . text($statusFile) . "</h3>";
                echo "<p><strong>Total Claims:</strong> " . count($statusClaims) . "</p>";
                echo "<h4>Readable Summary:</h4>";

                foreach ($statusClaims as $claim) {
                    echo "<div class='claim-detail'>";
                    echo "<strong>Patient:</strong> " . text($claim['patient_name']) . "<br/>";
                    echo "<strong>Claim #:</strong> " . text($claim['claim_number']) . "<br/>";
                    echo "<strong>Status:</strong> " . text($claim['status']) . "<br/>";
                    echo "<strong>Paid:</strong> $" . text($claim['paid']) . "<br/>";
                    echo "<strong>Payer:</strong> " . text($claim['payer']) . "<br/>";
                    echo "<strong>Check #:</strong> " . text($claim['check_number']) . "<br/>";
                    echo "</div>";
                }

                echo "</div>";
            } else {
                echo "<div class='alert alert-warning'>⚠️ No .txt status summary file found for this ERA.</div>";
            }

        } else {
            echo "<div class='alert alert-danger'>❌ File not found: " . text($file) . "</div>";
        }
    }
    ?>
</div>
</body>
</html>
