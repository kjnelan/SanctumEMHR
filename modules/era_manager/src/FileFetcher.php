<?php
/**
 * FileFetcher.php
 *
 * Fetches and extracts ERA .zip files from a remote SFTP server, such as Office Ally.
 * This file is part of the ERA Manager module for OpenEMR.
 *
 * @package   OpenEMR Module: ERA Manager
 * @author    Kenneth J. Nelan
 * @license   GNU General Public License v3.0
 * @copyright Copyright (c) 2025
 * @link      https://www.open-emr.org
 */

namespace OpenEMR\Modules\OaEraManager;
use OpenEMR\Modules\OaEraManager\ERAHelper;

require_once(__DIR__ . '/../../../../globals.php');

class FileFetcher
{
    /**
     * Fetches .zip ERA files from the configured SFTP server and extracts them.
     *
     * Settings are retrieved from moduleConfig.php using OpenEMR's getGlobalSetting().
     * Extracted .835 files are saved to the local ERA inbox directory.
     *
     * @throws \Exception on connection or authentication failure
     */
public static function fetchFromSFTP()
{
    // Load settings from module config
    ERAHelper::ensureInboxDirs(); // ✅ Ensures inbox/processed folders exist

    // Load settings from module config
    $host       = $GLOBALS['era_sftp_host'];
    $user       = $GLOBALS['era_sftp_user'];
    $pass       = $GLOBALS['era_sftp_pass'];
    $remoteDir  = $GLOBALS['era_remote_path'];
    $localDir   = $GLOBALS['era_local_path'];

    // Defensive check for required fields
    if (empty($host) || empty($user) || empty($pass) || empty($remoteDir) || empty($localDir)) {
        throw new \Exception("❌ One or more required ERA SFTP settings are missing.");
    }

    // Optional: Log values for debugging (remove in production)
    error_log("🎯 ERA Fetch Config: host=$host, user=$user, remote=$remoteDir, local=$localDir");

        // Ensure the local directory exists
        if (!is_dir($localDir)) {
            mkdir($localDir, 0777, true);
        }

        // Connect to SFTP server
        $connection = ssh2_connect($host, 22);
        if (!$connection) {
            throw new \Exception('Unable to connect to SFTP server.');
        }

        // Authenticate with provided credentials
        if (!ssh2_auth_password($connection, $user, $pass)) {
            throw new \Exception('SFTP authentication failed.');
        }

        // Get SFTP subsystem
        $sftp = ssh2_sftp($connection);
        $handle = opendir("ssh2.sftp://$sftp$remoteDir");

        // Iterate through remote files
        while (false !== ($file = readdir($handle))) {
            if (str_ends_with($file, '.zip')) {
                $remoteFile = "ssh2.sftp://$sftp$remoteDir/$file";
                $localFile  = "$localDir/$file";

                // Download file
                file_put_contents($localFile, file_get_contents($remoteFile));

                // Extract contents
                self::unzip($localFile, $localDir);
            }
        }

        closedir($handle);
    }

    /**
     * Extracts a .zip file into the target directory and archives the original.
     *
     * @param string $zipPath    Full path to the .zip file
     * @param string $targetDir  Directory to extract to
     * @throws \Exception if extraction fails
     */
    public static function unzip($zipPath, $targetDir)
    {
        $zip = new \ZipArchive();

        if ($zip->open($zipPath) === true) {
            $zip->extractTo($targetDir);
            $zip->close();

            // Ensure processed directory exists
            $processedDir = "$targetDir/processed";
            if (!is_dir($processedDir)) {
                mkdir($processedDir, 0777, true);
            }

            // Move zip file to processed folder
            rename($zipPath, "$processedDir/" . basename($zipPath));
        } else {
            throw new \Exception("Failed to unzip: $zipPath");
        }
    }
}
