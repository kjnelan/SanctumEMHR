<?php
/**
 * MINDLINE Database Configuration
 *
 * Update these credentials to match your Mindline database setup.
 */

return [
    'host' => 'localhost',
    'port' => '3306',
    'database' => 'mindline',
    'username' => 'sacwansherpa',
    'password' => '621616SacWan2010!',
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',

    // PDO options
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]
];
