<?php
/**
 * ERAHelper.php
 *
 * Utility class for ERA Manager module.
 * Ensures inbox and processed directories exist.
 *
 * @package   OpenEMR Module: ERA Manager
 * @author    Kenneth J. Nelan
 * @license   GNU GPL v3
 */

namespace OpenEMR\Modules\OaEraManager;

class ERAHelper
{
    /**
     * Ensures the ERA inbox and processed directories exist.
     */
    public static function ensureInboxDirs(): void
    {
        $base = $GLOBALS['fileroot'] . '/sites/default/documents/edi/era_inbox';
        $processed = $base . '/processed';

        foreach ([$base, $processed] as $dir) {
            if (!is_dir($dir)) {
                mkdir($dir, 0775, true);
                chown($dir, 'www-data'); // Assumes Apache uses www-data
                chgrp($dir, 'www-data');
                error_log("📁 ERA Manager: Created missing directory $dir");
            }
        }
    }
}
