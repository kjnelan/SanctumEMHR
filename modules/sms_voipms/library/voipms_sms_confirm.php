<?php
/**
 * voipms_sms_confirm.php
 *
 * VOIP.ms SMS Confirmation Script for OpenEMR
 * Sends confirmation texts for newly created appointments.
 * Should be scheduled separately from reminder cron.
 */

// ----------------------[ BOOTSTRAP ENVIRONMENT ]----------------------
parse_str(implode('&', array_slice($argv, 1)), $_GET);

define('NO_SESSION_VALIDATION', true);
define('NO_AUTHenticate', true);
define('skip_timeout_reset', true);
define('skip_session_start', true);
$GLOBALS['ignoreAuth'] = true;
$ignoreAuth = true;

ini_set('error_log', '/Operations/www/www-logs/med.sacwan/error.log');

if (!isset($_GET['site'])) {
    fwrite(STDERR, "❌ Missing required argument: site=default\n");
    exit(1);
}

$site_id = $_GET['site'];
$_GET['site'] = $site_id;
$basePath = realpath(__DIR__ . '/../../../../../');
require_once("$basePath/interface/globals.php");

// ----------------------[ MODULE DEPENDENCIES ]----------------------
require_once(__DIR__ . '/../src/SmsVoipms/Service/SmsSender.php');
require_once(__DIR__ . '/../src/SmsVoipms/Service/MessageBuilder.php');

use OpenEMR\Modules\SmsVoipms\Service\SmsSender;
use OpenEMR\Modules\SmsVoipms\Service\MessageBuilder;

// ----------------------[ USER & SETTINGS ]---------------------------
$user = $_GET['user'] ?? 'cronjob';
$testrun = (bool) ($_GET['testrun'] ?? false);
$sender = new SmsSender();
$fromEmail = $GLOBALS['sms_voipms_email_from'] ?? '';

if (($GLOBALS['sms_voipms_use_email'] ?? '0') === '1' && empty($fromEmail)) {
    echo "❌ Email-to-SMS is enabled but no 'From Email Address' is configured.\n";
    exit(1);
}

// ✅ Honor Admin Config: only run if confirmation is enabled
if (empty($GLOBALS['sms_voipms_notify_new']) || $GLOBALS['sms_voipms_notify_new'] !== '1') {
    echo "🔕 Confirmation texts are disabled in the module settings.\n";
    exit;
}

$template = $GLOBALS['sms_voipms_template_new'] ?? 'Your appointment with ***PROVIDER*** is on ***DATE*** at ***STARTTIME***.';

// ----------------------[ APPOINTMENT QUERY ]-------------------------
$sql = "
    SELECT
        e.pc_time,
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
        e.pc_apptstatus
    FROM openemr_postcalendar_events AS e
    JOIN patient_data AS p ON e.pc_pid = p.pid
    LEFT JOIN users AS u ON e.pc_aid = u.id
    WHERE
        e.pc_apptstatus IN ('-')
        AND p.phone_cell IS NOT NULL
        AND TRIM(p.phone_cell) != ''
	AND e.pc_eventDate >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        AND NOT EXISTS (
            SELECT 1 FROM sms_voipms_appt_reminders r
            WHERE r.event_id = e.pc_eid AND r.type = 'confirmation'
        )
";

$result = sqlStatement($sql);
$count = 0;

// ----------------------[ MESSAGE GENERATION & SENDING ]--------------
while ($row = sqlFetchArray($result)) {
    if (empty($row['pc_eid']) || empty($row['phone_cell'])) {
        error_log("⚠️ Skipping appointment: missing eid or phone");
        continue;
    }

    $message = MessageBuilder::buildAppointmentMessage($row, $template);
    $phone = $row['phone_cell'];

    if ($testrun) {
        echo "[TEST] Would send to {$phone}: $message\n";
    } else {
        $response = $sender->send($phone, $message, $fromEmail, $user);

        if ($response['status'] === 'success') {
            error_log("📌 Logging confirmation for event_id: " . $row['pc_eid']);

            sqlStatement(
                "INSERT INTO sms_voipms_appt_reminders (event_id, sent_at, user, type) VALUES (?, NOW(), ?, 'confirmation')",
                [$row['pc_eid'], $user]
            );

            $updated = sqlStatement(
                "UPDATE openemr_postcalendar_events SET pc_apptstatus = ? WHERE pc_eid = ?",
                ['Sched', $row['pc_eid']]
            );

            if ($updated) {
                error_log("✅ Appointment status updated to 'Sched' for event_id: " . $row['pc_eid']);
            } else {
                error_log("🛑 FAILED to update status for event_id: " . $row['pc_eid']);
            }
        } else {
            error_log("❌ SMS send failed for event_id {$row['pc_eid']} – Response: " . print_r($response, true));
        }

        echo "📨 Sent to {$phone} – Status: {$response['status']}\n";
    }

    $count++;
}

// ----------------------[ DONE ]--------------------------------------
echo "\n✅ Done. {$count} confirmation(s) processed.\n";
