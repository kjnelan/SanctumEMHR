<?php
/**
 * tab_rejections.php
 *
 * ERA Manager — Rejections Dashboard
 * Scans the ERA inbox for any rejections/denials so you can fix and rebill.
 *
 * Source data:
 *  - Office Ally STATUS .txt (parsed via ERAStatusParser)
 *  - 277CA .txt notices (quick pattern scan for REJECT/A7/A3)
 *
 * Location: /interface/modules/custom_modules/oe-module-oa-era-manager/public/tabs/tab_rejections.php
 *
 * @package   OpenEMR Module: ERA Manager
 * @author    Kenneth J. Nelan
 * @license   GNU GPL v3
 *
 * Sections:
 *  1) Bootstrap
 *  2) Helpers (scan + parse)
 *  3) Collect rejections
 *  4) Render table
 */

////////////////////////////////////////////////////////////////////////
// 1) Bootstrap
////////////////////////////////////////////////////////////////////////
require_once(__DIR__ . '/../../../../../globals.php');
require_once($GLOBALS['fileroot'] . '/interface/modules/custom_modules/oe-module-oa-era-manager/src/ERAStatusParser.php');

use OpenEMR\Core\Header;
use OpenEMR\Modules\OaEraManager\ERAStatusParser;

Header::setupHeader(['bootstrap']);

$inbox = $GLOBALS['OE_SITE_DIR'] . "/documents/edi/era_inbox";

////////////////////////////////////////////////////////////////////////
// 2) Helpers
////////////////////////////////////////////////////////////////////////

/**
 * Detect a rejected/denied/non-processed line from OA STATUS parser row.
 * Very conservative: anything not "PROCESSED" is flagged.
 */
function is_status_rejected(array $row): bool {
    $status = strtoupper(trim($row['status'] ?? ''));
    if ($status === '') return false;
    if ($status === 'PROCESSED') return false;
    // Common alternates to catch: DENIED, REJECTED, PENDED, RETURNED, etc
    return true;
}

/**
 * parse_277ca_file
 * Minimal 277CA segment parser (X214-ish) to extract per-claim rejects.
 *
 * Pulls:
 *  - Patient Name from NM1*QC
 *  - Claim Number from REF*1K (primary) or REF*D9 (fallback)
 *  - Status from STC (e.g., A7:500) + message snippet
 *  - Service Date from DTP*472 (if present)
 *
 * Flags as "reject" when STC category is A7 or A3.
 */
function parse_277ca_file(string $path): array
{
    $out = [];
    $raw = @file_get_contents($path);
    if ($raw === false || $raw === '') return $out;

    // Split into segments on tilde (~), trim empties
    $segs = array_values(array_filter(array_map('trim', explode('~', $raw))));

    // State we carry across segments
    $ctx = [
        'patient_last'  => '',
        'patient_first' => '',
        'claim_number'  => '',
        'svc_date'      => '',
    ];

    // Helper to flush one “reject” row
    $flush = function(array $ctx, string $stcCat, string $stcCode, string $message) use (&$out, $path) {
        // Only capture clear rejects
        $rejectCats = ['A7','A3'];
        if (!in_array($stcCat, $rejectCats, true)) return;

        $name = trim($ctx['patient_last'] . ', ' . $ctx['patient_first']);
        if ($name === ',') $name = '(unknown)';
        $claim = $ctx['claim_number'] ?: '(unknown)';

        $pretty = $message !== '' ? $message : ($stcCat . ':' . $stcCode);
        // Tidy typical ALLCAPS messages a bit
        $pretty = trim(preg_replace('/\s+/', ' ', ucwords(strtolower($pretty))));

        $out[] = [
            'source'       => '277CA',
            'file'         => basename($path),
            'patient_name' => $name,
            'claim_number' => $claim,
            'status'       => $stcCat . ':' . $stcCode,
            'paid'         => '0.00',
            'reason'       => ($ctx['svc_date'] ? ('DOS ' . $ctx['svc_date'] . ' — ') : '') . $pretty,
        ];
    };

    foreach ($segs as $seg) {
        if ($seg === '') continue;
        $parts = explode('*', $seg);
        $tag = strtoupper($parts[0] ?? '');

        switch ($tag) {
            case 'NM1':
                // NM1*QC*1*LAST*FIRST*...
                if (strtoupper($parts[1] ?? '') === 'QC') {
                    $ctx['patient_last']  = trim($parts[3] ?? '');
                    $ctx['patient_first'] = trim($parts[4] ?? '');
                }
                break;

            case 'REF':
                // REF*1K*<claim> or REF*D9*<claim>
                $qual = strtoupper($parts[1] ?? '');
                if ($qual === '1K' || $qual === 'D9') {
                    $val = trim($parts[2] ?? '');
                    if ($val !== '') $ctx['claim_number'] = $val;
                }
                break;

            case 'DTP':
                // DTP*472*D8*YYYYMMDD (service date)
                if (($parts[1] ?? '') === '472' && ($parts[2] ?? '') === 'D8') {
                    $rawDate = trim($parts[3] ?? '');
                    if (preg_match('/^\d{8}$/', $rawDate)) {
                        $ctx['svc_date'] = substr($rawDate,0,4) . '-' . substr($rawDate,4,2) . '-' . substr($rawDate,6,2);
                    }
                }
                break;

            case 'STC':
                // STC*A7:500*YYYYMMDD*<action>*...*[free text]
                // First element may be composite <Cat>:<Code>
                $comp = strtoupper($parts[1] ?? '');
                $msg  = '';
                // The free-text message is often the last non-empty field; try to grab trailing text-ish part
                // Scan from end toward start for something with letters/spaces
                for ($i = count($parts) - 1; $i >= 2; $i--) {
                    if (preg_match('/[A-Z]/i', $parts[$i])) { $msg = trim($parts[$i]); break; }
                }
                $cat = ''; $code = '';
                if (strpos($comp, ':') !== false) {
                    [$cat, $code] = explode(':', $comp, 2);
                } else {
                    $cat = $comp;
                }
                $cat  = strtoupper(trim($cat));
                $code = strtoupper(trim($code));

                // Flush a row if this is a reject category
                $flush($ctx, $cat, $code, $msg);
                break;

            case 'HL':
                // New loop; clear claim-specific context (keep patient unless changed by next NM1*QC)
                $ctx['claim_number'] = '';
                $ctx['svc_date'] = '';
                break;
        }
    }

    return $out;
}

////////////////////////////////////////////////////////////////////////
// 3) Collect rejections from OA STATUS + 277CA
////////////////////////////////////////////////////////////////////////
$rows = [];

// A) OA STATUS .txt files
$statusFiles = glob($inbox . '/*_ERA_STATUS_*.txt');
foreach ($statusFiles as $sf) {
    $parser = new ERAStatusParser($sf); // existing class
    $claims = $parser->parse();         // returns array of claim rows
    foreach ($claims as $c) {
        if (is_status_rejected($c) || (isset($c['paid']) && (float)$c['paid'] == 0.0)) {
            $rows[] = [
                'source'       => 'OA STATUS',
                'file'         => basename($sf),
                'patient_name' => $c['patient_name'] ?? '(unknown)',
                'claim_number' => $c['claim_number'] ?? '(unknown)',
                'status'       => $c['status'] ?? '(unknown)',
                'paid'         => $c['paid'] ?? '0.00',
                'reason'       => '', // could add more when we enrich parser
            ];
        }
    }
}

// B) 277CA .txt files (structured parsing)
$caFiles = glob($inbox . '/*277ca*.txt');
foreach ($caFiles as $cf) {
    $rows = array_merge($rows, parse_277ca_file($cf));
}

////////////////////////////////////////////////////////////////////////
// 4) Render table
////////////////////////////////////////////////////////////////////////
?>
<div class="container">
    <h2>❌ ERA Rejections</h2>
    <p class="text-muted">Shows claims not cleanly processed according to Office Ally STATUS or 277CA notices found in the ERA inbox.</p>

    <?php if (empty($rows)): ?>
        <div class="alert alert-success">No rejections found 🎉</div>
    <?php else: ?>
        <table class="table table-sm table-striped">
            <thead>
                <tr>
                    <th>Patient</th>
                    <th>Claim #</th>
                    <th>Status</th>
                    <th>Paid</th>
                    <th>Source</th>
                    <th>File</th>
                    <th>Reason / Snippet</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($rows as $r): ?>
                    <tr>
                        <td><?= text($r['patient_name']) ?></td>
                        <td><?= text($r['claim_number']) ?></td>
                        <td><strong><?= text($r['status']) ?></strong></td>
                        <td>$<?= text($r['paid']) ?></td>
                        <td><?= text($r['source']) ?></td>
                        <td><code><?= text($r['file']) ?></code></td>
                        <td style="max-width:520px"><?= nl2br(text($r['reason'])) ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</div>
