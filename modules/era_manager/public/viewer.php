<?php
/**
 * ERA Inbox Viewer Entry Point
 * 
 * This loads the ERA Inbox tab using the ViewerController.
 * 
 * @package   oe-module-oa-era-manager
 * @author    Kenneth Nelan
 * @license   GPL-3.0
 */

require_once("../../../../interface/globals.php");
require_once(dirname(__DIR__) . "/vendor/autoload.php");

use OpenEMR\Modules\OaEraManager\Controller\ViewerController;

$controller = new ViewerController();
$controller->handle();
