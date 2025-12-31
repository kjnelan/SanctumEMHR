<?php
/**
 * tab_post.php
 *
 * ERA Manager — Post Payments (Preview)
 *
 * Purpose:
 *  - Let user select an ERA (.835), parse claims, and preview what would post.
 *  - Insert parsed claims into era_claim_map for tracking.
 *  - Attempt to match each claim to an OpenEMR encounter/claim (safe lookup).
 *  - NO writes to ar_session/ar_activity yet — this is a dry-run safety step.
 *
 * Location:
 *  /interface/modules/custom_modules/oe-module-oa-era-manager/public/tabs/tab_post.php
 *
 * Sections:
 *  1) Bootstrap
 *  2) Utilities (lookup + encounter link)
 *  3) UI: ERA selector
 *  4) Parse, Insert, Preview
 *
 * @package   OpenEMR Module: ERA Manager
 * @author    Kenneth J.
 * @license   GNU GPL v3
 */

////////////////////////////////////////////////////////////////////////
// 1) Bootstrap
////////////////////////////////////////////////////////////////////////

require_once(__DIR__ . '/../../../../../globals.php');
require_once($GLOBALS['fileroot'] . '/interface/modules/custom_modules/oe-module-oa-era-manager/src/ERAParser.php');

use OpenEMR\Core\Header;
use OpenEMR\Modules\OaEraManager\ERAParser;

Header::setupHeader(['bootstrap']);

$era_dir = $GLOBALS['OE_SITE_DIR'] . "/documents/edi/era_inbox";
$selected_file = isset($_POST['era_file']) ? basename($_POST['era_file']) : '';

////////////////////////////////////////////////////////////////////////
// 2) Utilities
////////////////////////////////////////////////////////////////////////

/**
 * Try to find a billing encounter that matches the ERA claim number.
 * Safe against missing columns — tries several possibilities.
 */
function findEncounterForEraClaim(string $claimNumber): array
{
    $result = [
        'found' => false,
        'patient_id' => null,
        'encounter_id' => null,
        'claim_id' => null,
        'debug' => []
    ];

    if ($claimNumber === '' || $claimNumber === 'N/A') {
        $result['debug'][] = 'Empty claim number from ERA.';
        return $result;
    }

// Candidate billing columns to test
$candidateCols = ['x12_claim_id', 'x12_claim_number', 'external_id', 'claim_number'];

foreach ($candidateCols as $col) {
    try {
        // Check if the column exists in billing
        $check = sqlStatement("SHOW COLUMNS FROM billing LIKE '$col'");
        if (!sqlFetchArray($check)) {
            $result['debug'][] = "Column $col not present in billing table.";
            continue;
        }

        // Column exists, now attempt to match
        $row = sqlQuery(
            "SELECT pid AS patient_id, encounter AS encounter_id
             FROM billing
             WHERE $col = ?
             LIMIT 1",
            [$claimNumber]
        );

        if (!empty($row)) {
            $result['found'] = true;
            $result['patient_id'] = $row['patient_id'] ?? null;
            $result['encounter_id'] = $row['encounter_id'] ?? null;
            $result['debug'][] = "Matched in billing.$col";
            return $result;
        }
    } catch (\Throwable $e) {
        $result['debug'][] = "Error checking $col: " . $e->getMessage();
        continue;
    }
}

$result['debug'][] = 'No match found in billing (tried multiple columns).';
return $result;
}

/**
 * Build a link to open the matched encounter in OpenEMR main frame.
 */
function encounterLink(?int $pid, ?int $enc): string
{
    if (!$pid || !$enc) return '';
    $url = $GLOBALS['webroot'] . "/interface/patient_file/encounter/encounter_top.php"
         . "?set_encounter=" . urlencode($enc)
         . "&pid=" . urlencode($pid);
    return "<a href='" . attr($url) . "' target='main'>Open Encounter</a>";
}

////////////////////////////////////////////////////////////////////////
// 3) UI — ERA selector
////////////////////////////////////////////////////////////////////////
?>
<div class="container">
    <h2>💸 Post Payments (Preview)</h2>
    <p class="text-muted">
        Select an ERA (.835) to preview which claims can be matched and posted.
        This step <strong>does not</strong> write to A/R yet.
    </p>

    <form method="post" class="mb-3">
        <label for="era_file"><strong>ERA file:</strong></label>
        <select name="era_file" id="era_file" class="form-control" style="max-width: 520px;">
            <option value="">-- Select ERA file --</option>
            <?php
            $files = array_filter(scandir($era_dir), fn($f) => preg_match('/\.835$/', $f));
            foreach ($files as $f) {
                $sel = ($selected_file === $f) ? "selected" : "";
                echo "<option value='" . attr($f) . "' $sel>" . text($f) . "</option>";
            }
            ?>
        </select>
        <div class="mt-2">
            <button type="submit" class="btn btn-primary">Parse & Preview</button>
        </div>
    </form>

<?php
////////////////////////////////////////////////////////////////////////
// 4) Parse, Insert, Preview
////////////////////////////////////////////////////////////////////////
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $selected_file) {
    $fullpath = $era_dir . '/' . $selected_file;

    if (!file_exists($fullpath)) {
        echo "<div class='alert alert-danger'>File not found: " . text($selected_file) . "</div></div>";
        return;
    }

    $parser = new ERAParser($fullpath);
    $claims = $parser->parse();

    // Insert parsed claims into era_claim_map
    foreach ($claims as $cl) {
        sqlStatement(
            "INSERT INTO era_claim_map 
                (era_file, claim_number, patient_name, paid_amount, payer_name, check_number, claim_status)
             VALUES (?,?,?,?,?,?,?)",
            [
                $selected_file,
                $cl['claim_number'] ?? '',
                $cl['patient_name'] ?? '',
                $cl['paid_amount'] ?? '0.00',
                $cl['payer_name'] ?? '',
                $cl['check_number'] ?? '',
                $cl['claim_status'] ?? ''
            ]
        );
    }
    ?>

    <div class="card">
        <div class="card-body">
            <h5 class="card-title mb-3">Preview for: <code><?= text($selected_file) ?></code></h5>
            <p class="text-muted mb-2"><?= count($claims) ?> claim(s) found.</p>

            <table class="table table-sm table-striped">
                <thead>
                <tr>
                    <th>Patient</th>
                    <th>Claim #</th>
                    <th>Status</th>
                    <th>Paid</th>
                    <th>Payer</th>
                    <th>Check #</th>
                    <th>Match</th>
                    <th>Action</th>
                </tr>
                </thead>
                <tbody>
                <?php foreach ($claims as $cl): ?>
                    <?php
                    $lookup = findEncounterForEraClaim((string)($cl['claim_number'] ?? ''));
                    $matched = $lookup['found'];
                    $badge = $matched
                        ? "<span class='badge bg-success'>Matched</span> " . encounterLink($lookup['patient_id'], $lookup['encounter_id'])
                        : "<span class='badge bg-warning text-dark'>Unmatched</span>";
                    ?>
                    <tr>
                        <td><?= text($cl['patient_name'] ?? '') ?></td>
                        <td><?= text($cl['claim_number'] ?? '') ?></td>
                        <td><?= text($cl['claim_status'] ?? '') ?></td>
                        <td>$<?= text($cl['paid_amount'] ?? '0.00') ?></td>
                        <td><?= text($cl['payer_name'] ?? '') ?></td>
                        <td><?= text($cl['check_number'] ?? '') ?></td>
                        <td><?= $badge ?></td>
                        <td>
                            <button class="btn btn-outline-secondary btn-sm" disabled
                                title="Posting is disabled in preview. Step 5 will enable this.">
                                Post (disabled)
                            </button>
                        </td>
                    </tr>
                    <?php if (!empty($lookup['debug'])): ?>
                        <tr>
                            <td colspan="8">
                                <small class="text-muted">
                                    <?= text(implode(' | ', $lookup['debug'])) ?>
                                </small>
                            </td>
                        </tr>
                    <?php endif; ?>
                <?php endforeach; ?>
                </tbody>
            </table>

            <div class="alert alert-info">
                <strong>Next:</strong> When you’re satisfied with matches, we’ll enable posting (Step 5) to create
                <code>ar_session</code> and <code>ar_activity</code> rows, and then auto-archive this ERA to
                <code>processed/</code>.
            </div>
        </div>
    </div>
<?php } // end POST ?>
</div>
