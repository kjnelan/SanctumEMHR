<?php

namespace OpenEMR\Modules\SmsVoipms\Service;

class SmsSender
{
    public function send($to, $message, $fromEmail = '', $user = 'system')
    {
        $useApi   = ($GLOBALS['sms_voipms_use_api'] ?? '0') === '1';
        $useEmail = ($GLOBALS['sms_voipms_use_email'] ?? '0') === '1';

        $to = $this->normalizePhone($to);
        error_log("💬 SmsSender::send() was called with: $to");

        // ✅ Use API if enabled
        if ($useApi) {
            $username = $GLOBALS['sms_voipms_username'] ?? '';
            $password = $GLOBALS['sms_voipms_password'] ?? '';
            $did      = $GLOBALS['sms_voipms_did'] ?? '';

            if (empty($username) || empty($password) || empty($did)) {
                $error = 'Missing VOIP.ms API credentials or DID.';
                $this->log($to, $message, 'error', $error, $user);
                return ['status' => 'error', 'error' => $error];
            }

            $url = "https://voip.ms/api/v1/rest.php";
            $fields = [
                'api_username' => $username,
                'api_password' => $password,
                'method'       => 'sendSMS',
                'did'          => $did,
                'dst'          => $to,
                'message'      => $message,
            ];

            error_log("🔍 VOIP.ms POST FIELDS: " . print_r($fields, true));

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($fields));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSLVERSION, CURL_SSLVERSION_TLSv1_2);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/x-www-form-urlencoded',
                'Accept: application/json',
                'User-Agent: OpenEMR-VOIPms-Module/1.1'
            ]);

            // Optional: verbose log to file
            curl_setopt($ch, CURLOPT_VERBOSE, true);
            $verbose = fopen('/tmp/curl.log', 'w+');
            curl_setopt($ch, CURLOPT_STDERR, $verbose);

            $result = curl_exec($ch);
            $curl_error = curl_error($ch);
            curl_close($ch);

            if ($curl_error) {
                $this->log($to, $message, 'error', $curl_error, $user);
                return ['status' => 'error', 'error' => $curl_error];
            }

            $decoded = json_decode($result, true);

            if (isset($decoded['status']) && $decoded['status'] === 'success') {
                $this->log($to, $message, 'success', $result, $user);
                return ['status' => 'success', 'message_id' => $decoded['sms']];
            }

            $this->log($to, $message, 'error', $result, $user);
            return ['status' => 'error', 'error' => $decoded['error'] ?? $result];
        }

        // ✅ Fall back to Email if allowed
        elseif ($useEmail) {
    if (empty($fromEmail)) {
        $error = 'Email-to-SMS is enabled but no From Email address is configured.';
        $this->log($to, $message, 'error', $error, $user);
        return ['status' => 'error', 'error' => $error];
    }

    $email_to = "sms@voip.ms";
    $headers = "From: {$fromEmail}
";
    $subject = preg_replace('/[^0-9]/', '', $to); // phone number only
    $sent = mail($email_to, $subject, $message, $headers);

    $status = $sent ? 'success' : 'error';
    $note = $sent
        ? "Email-to-SMS sent to $email_to (from $fromEmail)"
        : "Email send failure (from $fromEmail)";

    $this->log($to, $message, $status, $note, $user);
    return ['status' => $status, 'transport' => 'email'];
        }

        // ❌ Neither method enabled
        return ['status' => 'error', 'message' => 'No SMS transport enabled (API or Email)'];
    }

    private function log($to, $message, $status, $response, $user)
    {
        $now = date('Y-m-d H:i:s');
        $sql = "INSERT INTO sms_voipms_log (datetime, phone_number, message, status, response, user)
                VALUES (?, ?, ?, ?, ?, ?)";
        sqlStatement($sql, [$now, $to, $message, $status, $response, $user]);
    }

    private function normalizePhone($raw)
    {
        $digits = preg_replace('/[^0-9]/', '', $raw);

        if (strlen($digits) === 10) {
            return '+1' . $digits;
        }

        if (strlen($digits) === 11 && $digits[0] === '1') {
            return '+' . $digits;
        }

        return '+' . $digits;
    }
}
