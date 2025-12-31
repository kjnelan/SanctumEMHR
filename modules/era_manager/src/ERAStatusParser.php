<?php
/**
 * ERAStatusParser - Parses Office Ally .txt ERA summaries
 *
 * Author: Kenneth J. Nelan
 * License: GPL-3.0
 */

namespace OpenEMR\Modules\OaEraManager;

class ERAStatusParser
{
    protected $filepath;
    protected $claims = [];

    public function __construct(string $filepath)
    {
        $this->filepath = $filepath;
    }

    public function parse(): array
    {
        if (!file_exists($this->filepath)) {
            return [];
        }

        $lines = file($this->filepath);
        $current = [];
        foreach ($lines as $line) {
            $line = trim($line);

            if (preg_match('/^(\S+)\s+(\d+)\s+([A-Z]+,[A-Z]+)\s+([\d.]+)\s+([\d.]+)\s+(\d+)\s+(.+?)\s+([A-Z].+)/', $line, $match)) {
                $current = [
                    'check_number' => $match[1],
                    'patient_id'   => $match[2],
                    'patient_name' => ucwords(strtolower(str_replace(',', ', ', $match[3]))),
                    'charge'       => $match[4],
                    'paid'         => $match[5],
                    'claim_number' => $match[6],
                    'status'       => $match[7],
                    'payer'        => $match[8],
                ];
                $this->claims[] = $current;
            }
        }

        return $this->claims;
    }
}
