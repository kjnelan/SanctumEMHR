<?php
/**
 * SanctumEMHR Client Portal Redirect
 *
 * Redirects clients from the clean URL /mycare to the React app at /app/#/mycare/login
 * This allows sharing a simple URL: https://yoursite.com/mycare
 */

header('Location: /app/#/mycare/login');
exit;
