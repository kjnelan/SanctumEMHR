<?php
/**
 * ERA Inbox Viewer Controller
 * 
 * Reads local ERA inbox for .835 files and sends list to the template.
 * 
 * @package   oe-module-oa-era-manager
 * @author    Kenneth Nelan
 * @license   GPL-3.0
 */

namespace OpenEMR\Modules\OaEraManager\Controller;

use OpenEMR\Core\Header;

class ViewerController
{
    public function handle()
    {
        $inboxDir = dirname(__DIR__, 3) . "/sites/default/documents/edi/era_inbox";
        $files = [];

        if (is_dir($inboxDir)) {
            $fileList = scandir($inboxDir);
            foreach ($fileList as $file) {
                if (str_ends_with($file, ".835")) {
                    $files[] = [
                        'name' => $file,
                        'mtime' => date("Y-m-d H:i:s", filemtime("$inboxDir/$file")),
                        'size' => filesize("$inboxDir/$file")
                    ];
                }
            }
        }

        Header::setupHeader(['jquery', 'font-awesome']);

        include_once(dirname(__DIR__, 2) . "/templates/viewer.twig.php");
        echo render_era_inbox_viewer($files);
    }
}
