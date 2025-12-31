<?php
/**
 * moduleConfig.php
 *
 * VOIP.ms SMS Module for OpenEMR
 * Settings, Test, Log Viewer, and Documentation UI (Unified Layout)
 *
 * @package    OpenEMR
 * @module     oe-module-smsvoipms
 * @author     Kenneth J Nelan
 * @license    GPL-3.0-or-later
 * @link       https://sacwan.org
 */

$sessionAllowWrite = true;
require_once(__DIR__ . '/../../../../../interface/globals.php');
require_once(__DIR__ . '/../src/SmsVoipms/Service/SmsLogViewer.php');
require_once(__DIR__ . '/../src/SmsVoipms/Service/SmsSender.php');

use OpenEMR\Modules\SmsVoipms\Service\SmsLogViewer;
use OpenEMR\Modules\SmsVoipms\Service\SmsSender;

$tab = $_GET['tab'] ?? 'config';
$base = $GLOBALS['webroot'] . '/interface/modules/custom_modules/oe-module-smsvoipms/public/moduleConfig.php';
?>
<!DOCTYPE html>
<html>
<head>
    <title>VOIP.ms SMS Module</title>
    <style>
        body { font-family: "Segoe UI", Tahoma, sans-serif; background-color: #f0f2f5; margin: 0; padding: 0; }
        nav a { margin-right: 10px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; font-size: 14px; text-align: left; }
        th { background-color: #eee; }
        input[type="text"], input[type="password"], textarea {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 5px;
  font-size: 14px;
}
        tr.cancelled { background-color: #fbe7e7; }
        tr.new { background-color: #e7f7e7; }
        tr.reminder { background-color: #e7f1fb; }
        .status-badge {
            padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: bold;
        }
        .badge-success { background: #28a745; color: #fff; }
        .badge-error { background: #dc3545; color: #fff; }
        .badge-pending { background: #ffc107; color: #000; }
        .config-row {
  display: flex;
  flex-wrap: wrap;
  gap: 40px;
  justify-content: space-between;
  align-items: flex-start;
}
        .setting-section {
  flex: 1 1 30%;
  max-width: 32%;
  min-width: 250px;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 0 6px rgba(0,0,0,0.1);
  background: #fff;
  margin-bottom: 20px;
}
.section-header {
  background: #f0f0f0;
  padding: 8px 12px;
  font-weight: bold;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  border-bottom: 1px solid #ccc;
}
.section-body {
  padding: 20px;
}
        legend { display: none; }
    </style>
</head>
<body>
<div style="display: flex; justify-content: center; padding: 40px;">
    <div style="max-width: 1300px; width: 100%; background: #f9f9f9; padding: 20px 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); font-family: sans-serif; box-sizing: border-box;">
        <h2 style="text-align: center;">VOIP.ms SMS Module</h2>
        <nav style="text-align: center; margin-bottom: 20px;">
            <a href="<?= $base ?>?tab=config" style="margin: 0 10px;">⚙ Settings</a> |
            <a href="<?= $base ?>?tab=test" style="margin: 0 10px;">📤 Send Test</a> |
            <a href="<?= $base ?>?tab=log" style="margin: 0 10px;">📜 Log Viewer</a> |
            <a href="<?= $base ?>?tab=docs" style="margin: 0 10px;">📘 Instructions</a>
        </nav>
        <hr style="margin-bottom: 30px;">
<?php if ($tab === 'config'): ?>
<?php
$fields = [
    'sms_voipms_did' => '',
    'sms_voipms_reminder_hours' => '',
    'sms_voipms_use_email' => '',
    'sms_voipms_email_from' => '',
    'sms_voipms_use_api' => '',
    'sms_voipms_username' => '',
    'sms_voipms_password' => '',
    'sms_voipms_template' => '',
    'sms_voipms_notify_new' => '',
    'sms_voipms_notify_cancel' => '',
    'sms_voipms_template_new' => '',
    'sms_voipms_template_cancel' => ''
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    foreach ($fields as $key => $_) {
        $val = isset($_POST[$key]) ? trim($_POST[$key]) : '';
        if (in_array($key, ['sms_voipms_notify_new', 'sms_voipms_notify_cancel', 'sms_voipms_use_email', 'sms_voipms_use_api'])) {
            $val = isset($_POST[$key]) && $_POST[$key] === '1' ? '1' : '0';
        }
        sqlStatement("REPLACE INTO globals (gl_name, gl_value) VALUES (?, ?)", [$key, $val]);
    }
    header("Location: {$base}?tab=config&saved=1");
    exit;
}

foreach ($fields as $key => &$value) {
    $value = $GLOBALS[$key] ?? '';
}
?>
<h3>VOIP.ms SMS Settings</h3>
<?php if ($_GET['saved'] ?? '' === '1'): ?>
<div style="background: #d4edda; color: #155724; padding: 10px 15px; border: 1px solid #c3e6cb; border-radius: 5px; margin-bottom: 20px;">
    ✅ Settings successfully saved.
</div>
<?php endif; ?>
<form method="POST">
  <div class="config-row">
    <div class="setting-section">
      <div class="section-header">General Settings</div>
<div class="section-body">
  <label><input type="checkbox" name="sms_voipms_use_email" value="1" <?= $fields['sms_voipms_use_email'] === '1' ? 'checked' : '' ?>> Enable Email-to-SMS</label><br>
  <label><input type="checkbox" name="sms_voipms_use_api" value="1" <?= $fields['sms_voipms_use_api'] === '1' ? 'checked' : '' ?>> Enable VOIP.ms API</label><br>
  <label><input type="checkbox" name="sms_voipms_notify_new" value="1" <?= $fields['sms_voipms_notify_new'] === '1' ? 'checked' : '' ?>> Enable new appointment texts</label><br>
  <label><input type="checkbox" name="sms_voipms_notify_cancel" value="1" <?= $fields['sms_voipms_notify_cancel'] === '1' ? 'checked' : '' ?>> Enable cancellation texts</label><br><br>

  <label>Default DID:</label><br>
  <input type="text" name="sms_voipms_did" value="<?= htmlspecialchars($fields['sms_voipms_did']) ?>"><br><br>

  <label>Reminder Window (hours):</label><br>
  <input type="text" name="sms_voipms_reminder_hours" value="<?= htmlspecialchars($fields['sms_voipms_reminder_hours']) ?>">
</div>
  </div>

  <div class="setting-section">
  <div class="section-header">Email-to-SMS Settings</div>
  <div class="section-body">
    <label>From Email Address:</label><br>
    <input type="text" name="sms_voipms_email_from" value="<?= htmlspecialchars($fields['sms_voipms_email_from']) ?>"><br>
    <p style="color: #555; font-size: 0.9em; margin-top: 8px;">This email must be whitelisted in your VOIP.ms portal. Messages over 160 characters may be billed as MMS at $0.02 per message.</p>
  </div>
</div>

<div class="setting-section">
  <div class="section-header">API Settings</div>
  <div class="section-body">
    <label>API Username:</label><br>
    <input type="text" name="sms_voipms_username" value="<?= htmlspecialchars($fields['sms_voipms_username']) ?>"><br><br>

    <label>API Password:</label><br>
    <input type="password" name="sms_voipms_password" value="<?= htmlspecialchars($fields['sms_voipms_password']) ?>"><br>
    <p style="color: #555; font-size: 0.9em; margin-top: 8px;">Note: API messages longer than 160 characters may be rejected or truncated.</p>
  </div>
</div>
</div>

<!-- TEMPLATES ROW -->
<div class="config-row">
  <div class="setting-section" style="flex: 1; max-width: 100%;">
    <div class="section-header">Reminder Templates</div>
    <div class="section-body">
      <label>Default Reminder Template:</label><br>
      <textarea id="sms_voipms_template" name="sms_voipms_template" rows="4" style="width: 100%; max-width: 100%; box-sizing: border-box;"><?= htmlspecialchars($fields['sms_voipms_template']) ?></textarea>
      <p id="sms_voipms_template_count" style="font-size: 0.9em; color: gray; margin-top: 4px;"></p>
      <br>
      <label>New Appointment Template:</label><br>
      <textarea id="sms_voipms_template_new" name="sms_voipms_template_new" rows="4" style="width: 100%; max-width: 100%; box-sizing: border-box;"><?= htmlspecialchars($fields['sms_voipms_template_new']) ?></textarea>
      <p id="sms_voipms_template_new_count" style="font-size: 0.9em; color: gray; margin-top: 4px;"></p>
      <br>
      <label>Cancelled Appointment Template:</label><br>
      <textarea id="sms_voipms_template_cancel" name="sms_voipms_template_cancel" rows="4" style="width: 100%; max-width: 100%; box-sizing: border-box;"><?= htmlspecialchars($fields['sms_voipms_template_cancel']) ?></textarea>
      <p id="sms_voipms_template_cancel_count" style="font-size: 0.9em; color: gray; margin-top: 4px;"></p>
    </div>
  </div>
</div>

<div style="margin-top: 20px; text-align: center;">
  <button type="submit">Save Settings</button>
</div>

  </div>
</div>
<script>
function updateCharCount(id, counterId) {
  const textarea = document.getElementById(id);
  const counter = document.getElementById(counterId);
  if (!textarea || !counter) {
    console.log(`🛑 Element not found: ${id} or ${counterId}`);
    return;
  }
  const update = () => {
    counter.textContent = `Characters: ${textarea.value.length}`;
  };
  textarea.addEventListener('input', update);
  update(); // initialize
}

window.addEventListener('DOMContentLoaded', () => {
  console.log("✅ Character counter script loaded (inside config tab).");
  updateCharCount('sms_voipms_template', 'sms_voipms_template_count');
  updateCharCount('sms_voipms_template_new', 'sms_voipms_template_new_count');
  updateCharCount('sms_voipms_template_cancel', 'sms_voipms_template_cancel_count');
});
</script>

</form>
<?php endif; ?>

<?php if ($tab === 'test'): ?>
<?php
$feedback = '';
$template = $GLOBALS['sms_voipms_template'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['to'])) {
    $to = trim($_POST['to']);
    $msg = trim($_POST['msg']) ?: $template;
    $fromEmail = $GLOBALS['sms_voipms_email_from'] ?? '';
    $user = $_SESSION['authUser'] ?? 'system';

    $sender = new SmsSender();
    $result = $sender->send($to, $msg, $fromEmail, $user);
    $feedback = json_encode($result, JSON_PRETTY_PRINT);
}


?>
<h3>Send Test SMS</h3>
<form method="POST">
    <label>To (e.g. +1XXXXXXXXXX):</label><br>
    <input type="text" name="to" required><br><br>
    <label>Message:</label><br>
    <small style="color: gray;">If left blank, the default message from the settings tab will be used.</small><br>
    <textarea name="msg" rows="4"><?= htmlspecialchars($_POST['msg'] ?? $template) ?></textarea><br><br>
    <button type="submit">Send</button>
</form>
<?php if ($feedback): ?>
<h4>Result:</h4>
<pre><?= htmlspecialchars($feedback) ?></pre>
<?php endif; ?>

<?php elseif ($tab === 'log'): ?>
<?php
$viewer = new SmsLogViewer();
$data = $viewer->fetch();
?>
<h3>SMS Log</h3>
<form method="GET">
    <input type="hidden" name="tab" value="log">
    <label>Search:</label>
    <input type="text" name="q" value="<?= htmlspecialchars($_GET['q'] ?? '') ?>">
    <button type="submit">Search</button>
</form>
<table>
    <tr><th>Date</th><th>Phone</th><th>Message</th><th>Status</th><th>User</th><th>Response</th></tr>
    <?php foreach ($data as $row):
        $status = strtolower($row['status']);
        $badgeClass = $status === 'success' ? 'badge-success'
                     : ($status === 'error' ? 'badge-error' : 'badge-pending');
    ?>
    <tr>
        <td><?= htmlspecialchars($row['datetime']) ?></td>
        <td><?= htmlspecialchars($row['phone_number']) ?></td>
        <td><?= htmlspecialchars($row['message']) ?></td>
        <td><span class="status-badge <?= $badgeClass ?>"><?= htmlspecialchars($row['status']) ?></span></td>
        <td><?= htmlspecialchars($row['user']) ?></td>
        <td><?= htmlspecialchars($row['response']) ?></td>
    </tr>
    <?php endforeach; ?>
</table>

<?php elseif ($tab === 'docs'): ?>
<h3>Module Setup & Instructions</h3>
<div style="margin-top: 20px; background: #ffffff; padding: 20px; border-radius: 10px; border: 1px solid #ccc;">

<p><strong>After enabling this module:</strong></p>
<ul>
  <li>Go to the <strong>Settings</strong> tab and enter your:</li>
  <ul>
    <li><strong>VOIP.ms Username</strong> – this is the login you use to access your VOIP.ms account.</li>
    <li><strong>API Password</strong> – you must create an API password in your VOIP.ms dashboard (not the same as your account password).</li>
    <li><strong>Default DID</strong> – your 10-digit VOIP.ms phone number (e.g., 12623457229).</li>
    <li><strong>Reminder Window</strong> – number of hours before the appointment to send reminders (e.g., 24 or 48).</li>
    <li><strong>SMS Message Templates</strong> for Reminders, New Appointments, and Cancellations.</li>
  </ul>
</ul>

<hr>
<h4>Email-to-SMS Configuration at VOIP.ms</h4>
<p>To enable email-to-SMS delivery, log into your VOIP.ms portal and go to <strong>SMS/MMS Message Center Information → Email to SMS</strong>. At the bottom of that section, add the email address used in this module’s settings ("From Email Address"). This email must be whitelisted for messages to be delivered.</p>

<hr>
<h4>Message Tags</h4>
<p>You can personalize messages using these tags. Each tag will be replaced with appointment-specific information:</p>
<ul style="columns: 2;">
  <li><code style="color: #0074d9">***NAME***</code> – Patient’s full name</li>
  <li><code style="color: #2ecc40">***DATE***</code> – Appointment date</li>
  <li><code style="color: #ff851b">***STARTTIME***</code> – Start time</li>
  <li><code style="color: #ff4136">***ENDTIME***</code> – End time</li>
  <li><code style="color: #b10dc9">***PROVIDER***</code> – Provider’s full name</li>
  <li><code style="color: #3d9970">***LOCATION***</code> – Location name (optional)</li>
  <li><code style="color: #85144b">***LOCATION_PHONE***</code> – Location's phone number (optional)</li>
</ul>

<hr>
<h4>SMS Length & Live Character Counter</h4>
<p>Each SMS template includes a live character count below the input field. This helps you keep messages under 160 characters, which is the typical limit before VOIP.ms splits or reclassifies messages as MMS. Longer messages may incur higher charges or be truncated depending on your VOIP.ms settings.</p>

<hr>
<h4>Appointment Status Behavior</h4>
<p>To help the system track which appointments have been notified, the module uses the built-in OpenEMR appointment status field:</p>
<ul>
  <li><strong><code>-</code> (None):</strong> Appointments with no status are treated as new.</li>
  <li><strong><code>Sched</code>:</strong> After a confirmation SMS is sent, the appointment is marked as scheduled.</li>
  <li><strong><code>SMS</code>:</strong> Once a reminder is sent, the status is updated to SMS-confirmed.</li>
</ul>
<p>This helps prevent duplicate notifications and tracks client contact effectively.</p>

<hr>
<h4>Script Behavior and Cron Integration</h4>
<p>The module supports three core PHP scripts that can be triggered via cron:</p>
<ul>
  <li><code>voipms_sms_confirm.php</code> – Sends confirmation messages for newly created appointments.</li>
  <li><code>voipms_sms_notify.php</code> – Sends reminder messages based on the Reminder Window.</li>
  <li><code>voipms_sms_cancel.php</code> – Sends a notification when appointments are cancelled.</li>
</ul>
<p><strong>Suggested cron schedule:</strong> Every 15 minutes.</p>
<pre><code>*/15 * * * * php -f /path/to/voipms_sms_notify.php site=default user=your_username type=reminder</code></pre>

<hr>
<h4>Safe Testing Mode</h4>
<p>Each script supports a <code>testrun=1</code> parameter that allows you to simulate behavior without sending texts or updating the database. Example:</p>
<pre><code>php -f voipms_sms_confirm.php site=default user=your_username testrun=1</code></pre>

<hr>
<h4>Database Logging</h4>
<p>All messages are logged in the <code>sms_voipms_appt_reminders</code> table with:</p>
<ul>
  <li><code>event_id</code> – ID of the appointment</li>
  <li><code>type</code> – Message type: <code>confirmation</code>, <code>reminder</code>, or <code>cancellation</code></li>
  <li><code>sent_at</code> – Timestamp</li>
  <li><code>user</code> – Username who triggered the script</li>
</ul>
<p>If a record already exists for that appointment and type, no message is sent again.</p>

<hr>
<h4>Test Messages</h4>
<p>Use the <strong>Send Test</strong> tab to verify SMS delivery. Enter a number and an optional message. If blank, your default reminder template will be used.</p>

<h4>View Logs</h4>
<p>The <strong>Log Viewer</strong> tab displays all messages sent through the system, their status, and the user who triggered them. Cancellations, confirmations, and reminders are color-coded for clarity.</p>

<hr>
<h4>Important Notes</h4>
<ul>
  <li>This module relies on cron jobs. If messages are not sending, verify your cron is active.</li>
  <li>SMS replies are not currently supported.</li>
</ul>
</div>


<?php endif; ?>
</div></div>

</body>
</html>
