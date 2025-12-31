<?php
/**
 * ERAParser Class
 *
 * Parses .835 ERA files using OpenEMR's ParseERA backend logic.
 * Captures structured claim data via custom callback.
 *
 * Author: Kenneth J. Nelan
 * License: GPL-3.0
 */

namespace OpenEMR\Modules\OaEraManager;

use OpenEMR\Billing\ParseERA;

class ERAParser
{
    protected $filePath;
    protected $claims = [];

    public function __construct(string $filePath)
    {
        $this->filePath = $filePath;
    }

    public function parse(): array
    {
        $this->claims = [];

        // Internal callback to capture each claim
$callback = function ($claim) {
    $svc = $claim['svc'][0] ?? [];

    // Prefer top-level 'paid_amount', else fallback to first SVC line
    $total_paid = $claim['paid_amount'] ?? $svc['paid'] ?? 0;

    $patient = trim(($claim['patient_fname'] ?? '') . ' ' . ($claim['patient_lname'] ?? ''));
    $claimId = $claim['our_claim_id'] ?? $claim['claim_number'] ?? 'N/A';
    $payer   = $claim['payer_name'] ?? 'Unknown';
    $check   = $claim['check_number'] ?? 'Unknown';
    $status  = $claim['claim_status_code'] ?? 'N/A';

    $this->claims[] = [
        'patient_name' => $patient ?: 'Missing Name',
        'claim_number' => $claimId,
        'paid_amount'  => number_format((float)$total_paid, 2),
        'payer_name'   => $payer,
        'check_number' => $check,
        'claim_status' => $status,
    ];
};



        // Manually set callback (anonymous function must be global-scope callable)
        $fn = function ($data) use ($callback) {
            $callback($data);
        };

        ParseERA::parseERA($this->filePath, $fn);

        return $this->claims;
    }
}
