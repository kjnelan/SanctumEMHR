<?php
/**
 * voipms_sms_notify.php
 *
 * VOIP.ms SMS Reminder Script for OpenEMR
 * Sends reminder texts for upcoming appointments.
 * Intended for cron-based use.
 */

// ----------------------[ BOOTSTRAP ENVIRONMENT ]----------------------
parse_str(implode('&', array_slice($argv, 1)), $_GET);

define('NO_SESSION_VALIDATION', true);
define('NO_AUTHenticate', true);
define('skip_timeout_reset', true);
define('skip_session_start', true);
$GLOBALS['ignoreAuth'] = true;
$ignoreAuth = true;

// Ensure site parameter is set
if (!isset($_GET['site'])) {
    fwrite(STDERR, "❌ Missing required argument: site=default\n");
    exit(1);
}

// Setup site context
$site_id = $_GET['site'];
$_GET['site'] = $site_id;
$basePath = realpath(__DIR__ . '/../../../../../');
require_once("$basePath/interface/globals.php");

// ----------------------[ LOAD MODULE CLASSES ]------------------------
require_once(__DIR__ . '/../src/SmsVoipms/Service/SmsSender.php');
require_once(__DIR__ . '/../src/SmsVoipms/Service/MessageBuilder.php');

use OpenEMR\Modules\SmsVoipms\Service\SmsSender;
use OpenEMR\Modules\SmsVoipms\Service\MessageBuilder;

// ----------------------[ INPUTS AND SETTINGS ]------------------------
$type = $_GET['type'] ?? 'reminder';
$user = $_GET['user'] ?? 'cronjob';
$testrun = (bool) ($_GET['testrun'] ?? false);
$fromEmail = $GLOBALS['sms_voipms_email_from'] ?? '';

// Only handle 'reminder' type
if ($type !== 'reminder') {
    echo "⚠ Unknown type: $type\n";
    exit(1);
}

// If using Email-to-SMS, make sure a from-email is configured
if (($GLOBALS['sms_voipms_use_email'] ?? '0') === '1' && empty($fromEmail)) {
    echo "❌ Email-to-SMS is enabled but no 'From Email Address' is configured.\n";
    exit(1);
}

// Get the reminder window in hours (default to 24)
$hoursAhead = (int) ($GLOBALS['sms_voipms_reminder_hours'] ?? 24);
if ($hoursAhead <= 0) {
    $hoursAhead = 24;
}

// Load the reminder message template
$msgTemplate = $GLOBALS['sms_voipms_template'] ?? "Reminder: Your appointment with ***PROVIDER*** is on ***DATE*** at ***STARTTIME***.";

// Calculate the time window for reminders
$now = new DateTimeImmutable();
$cutoff = $now->modify("+{$hoursAhead} hours");

// Log the scan window
echo "⏰ Scanning for reminders between now and {$cutoff->format('Y-m-d H:i:s')}...\n";

// ----------------------[ APPOINTMENT QUERY ]--------------------------
$sql = "
    SELECT
        e.pc_eventDate,
        e.pc_startTime,
        e.pc_duration,
        e.pc_eid,
        e.pc_aid,
        e.pc_location,
        e.pc_pid,
        p.fname,
        p.lname,
        p.phone_cell,
        u.lname AS provider_lname,
        u.fname AS provider_fname,
        r.event_id AS reminder_sent
    FROM openemr_postcalendar_events AS e
    JOIN patient_data AS p ON e.pc_pid = p.pid
    LEFT JOIN users AS u ON e.pc_aid = u.id
    LEFT JOIN sms_voipms_appt_reminders AS r ON r.event_id = e.pc_eid AND r.type = 'reminder'
    WHERE
        CONCAT(e.pc_eventDate, ' ', e.pc_startTime) BETWEEN ? AND ?
        AND p.phone_cell IS NOT NULL
        AND TRIM(p.phone_cell) != ''
        AND r.event_id IS NULL
	AND e.pc_apptstatus = 'Sched'
";

$params = [$now->format('Y-m-d H:i:s'), $cutoff->format('Y-m-d H:i:s')];
$result = sqlStatement($sql, $params);

// ----------------------[ MESSAGE GENERATION & SENDING ]--------------
$sender = new SmsSender();
$count = 0;

while ($row = sqlFetchArray($result)) {
    // Skip if key data is missing
    if (empty($row['pc_eid']) || empty($row['phone_cell'])) {
        error_log("⚠️ Skipping event_id {$row['pc_eid']} – missing phone number or ID");
        continue;
    }

    // Build the message
    $message = MessageBuilder::buildAppointmentMessage($row, $msgTemplate);
    $phone = $row['phone_cell'];
    $eventId = $row['pc_eid'];

    // Log planned message
    echo "📋 EVENT ID: {$eventId}, Phone: {$phone}, Date: {$row['pc_eventDate']}, Time: {$row['pc_startTime']}\n";

    if ($testrun) {
        // Test mode: just show what would be sent
        echo "[TEST] Would send to {$phone}: $message\n";
    } else {
        // Send the message using SmsSender
        $response = $sender->send($phone, $message, $fromEmail, $user);

        if ($response['status'] === 'success') {
            // Log the reminder in the tracking table
            sqlStatement(
                "INSERT INTO sms_voipms_appt_reminders (event_id, sent_at, user, type) VALUES (?, NOW(), ?, 'reminder')",
                [$eventId, $user]
            );

            // Update appointment status to 'SMS'
            $updated = sqlStatement(
                "UPDATE openemr_postcalendar_events SET pc_apptstatus = ? WHERE pc_eid = ?",
                ['SMS', $eventId]
            );

            if ($updated) {
                error_log("✅ Reminder status updated to 'SMS' for event_id {$eventId}");
            } else {
                error_log("🛑 Failed to update status for event_id {$eventId}");
            }
        } else {
            // Log failure
            error_log("❌ SMS failed to send to {$phone} (event_id {$eventId})");
        }

        // Log to screen
        echo "📨 Sent to {$phone} – Status: {$response['status']}\n";
    }

    $count++;
}

// ----------------------[ WRAP-UP ]------------------------------------
echo "\n✅ Done. {$count} reminder(s) processed.\n";
