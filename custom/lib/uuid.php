<?php
/**
 * Mindline EMHR - UUID Generator
 * Simple UUID v4 generator (replacement for OpenEMR's ccr/uuid.php)
 */

use Ramsey\Uuid\Uuid;

/**
 * Generate a UUID v4
 *
 * @return string A UUID, made up of 32 hex digits and 4 hyphens
 */
function getUuid()
{
    $uuid = Uuid::uuid4();
    return $uuid->toString();
}
