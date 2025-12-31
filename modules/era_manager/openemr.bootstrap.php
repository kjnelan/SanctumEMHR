<?php
/**
 * ERA Manager Module Bootstrap
 *
 * Injects ERA Manager UI and Settings into the OpenEMR menu structure.
 * Uses the same manual injection pattern as oe-module-smsvoipms.
 *
 * Author: Kenneth J. Nelan
 * License: GPL-3.0
 * Version: 1.0.0
 */

use OpenEMR\Menu\MenuEvent;

if (isset($GLOBALS['kernel'])) {
    $dispatcher = $GLOBALS['kernel']->getEventDispatcher();

    // Inject ERA Manager menu entries
    $dispatcher->addListener(MenuEvent::MENU_UPDATE, function (MenuEvent $event) {
        error_log("ERA Manager: Injecting menu items into OpenEMR");

        $menu = $event->getMenu();

        // 🔍 Attempt to locate the "Fees" top-level group
        foreach ($menu as &$item) {
            if ((is_object($item) && $item->label === 'Fees') ||
                (is_array($item) && ($item['label'] ?? '') === 'Fees')) {
                $children = $item->children ?? $item['children'] ?? [];

                $children[] = (object)[
                    'label' => 'ERA Manager',
                    'menu_id' => 'era_manager',
                    'url' => $GLOBALS['webroot'] . '/interface/modules/custom_modules/oe-module-oa-era-manager/public/index.php',
                    'target' => 'main',
                    'requirement' => 0,
                    'acl_req' => ['acct'],
                    'global_req_strict' => [],
                    'children' => []
                ];

                if (is_object($item)) {
                    $item->children = $children;
                } else {
                    $item['children'] = $children;
                }

                break;
            }
        }

        // Also optionally inject settings page under Admin
        foreach ($menu as &$item) {
            if ((is_object($item) && $item->label === 'Admin') ||
                (is_array($item) && ($item['label'] ?? '') === 'Admin')) {
                $children = $item->children ?? $item['children'] ?? [];

                $children[] = (object)[
                    'label' => 'ERA Settings',
                    'menu_id' => 'era_manager_config',
                    'url' => $GLOBALS['webroot'] . '/interface/modules/custom_modules/oe-module-oa-era-manager/public/moduleConfig.php',
                    'target' => 'main',
                    'requirement' => 0,
                    'acl_req' => ['admin'],
                    'global_req_strict' => [],
                    'children' => []
                ];

                if (is_object($item)) {
                    $item->children = $children;
                } else {
                    $item['children'] = $children;
                }

                break;
            }
        }

        // 🔁 Push modified menu back
        $event->setMenu($menu);
    });
}
