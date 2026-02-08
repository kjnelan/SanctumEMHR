<?php
/**
 * SanctumEMHR EMHR
 * EmailService - Handles sending email notifications
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

namespace Custom\Lib\Services;

use Custom\Lib\Database\Database;

class EmailService
{
    private Database $db;
    private array $settings;
    private bool $enabled;

    public function __construct(?Database $db = null)
    {
        $this->db = $db ?? Database::getInstance();
        $this->loadSettings();
    }

    /**
     * Load email settings from system_settings
     */
    private function loadSettings(): void
    {
        $this->settings = [
            'smtp_host' => '',
            'smtp_port' => '587',
            'smtp_user' => '',
            'smtp_password' => '',
            'smtp_encryption' => 'tls',
            'from_email' => '',
            'from_name' => 'SanctumEMHR',
            'enabled' => false,
            'notify_client_on_appointment' => true,
            'notify_provider_on_appointment' => true,
            'notify_client_on_cancelled' => true,
            'notify_provider_on_cancelled' => true,
            'notify_client_on_modified' => true,
            'notify_provider_on_modified' => true
        ];

        try {
            $sql = "SELECT setting_key, setting_value FROM system_settings WHERE setting_key LIKE 'email.%'";
            $rows = $this->db->queryAll($sql);

            foreach ($rows as $row) {
                $key = str_replace('email.', '', $row['setting_key']);
                $this->settings[$key] = $row['setting_value'];
            }

            $this->enabled = filter_var($this->settings['enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        } catch (\Exception $e) {
            error_log("EmailService: Failed to load settings - " . $e->getMessage());
            $this->enabled = false;
        }
    }

    /**
     * Check if email sending is enabled
     */
    public function isEnabled(): bool
    {
        return $this->enabled && !empty($this->settings['from_email']);
    }

    /**
     * Send an email
     */
    public function send(string $to, string $subject, string $htmlBody, ?string $textBody = null): bool
    {
        if (!$this->isEnabled()) {
            error_log("EmailService: Email sending is disabled");
            return false;
        }

        if (empty($to) || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            error_log("EmailService: Invalid recipient email: $to");
            return false;
        }

        try {
            $fromEmail = $this->settings['from_email'];
            $fromName = $this->settings['from_name'];
            $boundary = md5(time());

            $headers = [
                'MIME-Version: 1.0',
                "From: $fromName <$fromEmail>",
                'Reply-To: ' . $fromEmail,
                'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
                'X-Mailer: SanctumEMHR'
            ];

            $body = "--$boundary\r\n";
            $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
            $body .= ($textBody ?? strip_tags($htmlBody)) . "\r\n\r\n";

            $body .= "--$boundary\r\n";
            $body .= "Content-Type: text/html; charset=UTF-8\r\n";
            $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
            $body .= $htmlBody . "\r\n\r\n";

            $body .= "--$boundary--";

            if (!empty($this->settings['smtp_host'])) {
                ini_set('SMTP', $this->settings['smtp_host']);
                ini_set('smtp_port', $this->settings['smtp_port']);
            }

            $result = mail($to, $subject, $body, implode("\r\n", $headers));

            if ($result) {
                error_log("EmailService: Email sent successfully to $to");
            } else {
                error_log("EmailService: Failed to send email to $to");
            }

            return $result;

        } catch (\Exception $e) {
            error_log("EmailService: Exception sending email - " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send new appointment notification to client
     */
    public function sendClientAppointmentNotification(array $appointment, array $client, array $provider): bool
    {
        if (!filter_var($this->settings['notify_client_on_appointment'] ?? true, FILTER_VALIDATE_BOOLEAN)) {
            return false;
        }

        $clientEmail = $client['email'] ?? '';
        if (empty($clientEmail)) {
            return false;
        }

        $clientName = trim(($client['first_name'] ?? '') . ' ' . ($client['last_name'] ?? ''));
        $providerName = trim(($provider['first_name'] ?? '') . ' ' . ($provider['last_name'] ?? ''));
        $providerTitle = $provider['title'] ?? '';

        $appointmentDate = date('l, F j, Y', strtotime($appointment['eventDate']));
        $appointmentTime = date('g:i A', strtotime($appointment['startTime']));
        $duration = intval($appointment['duration'] / 60);

        $subject = "Appointment Confirmation - $appointmentDate";
        $htmlBody = $this->getEmailTemplate('confirmation', $clientName, $providerName, $providerTitle, $appointmentDate, $appointmentTime, $duration, $appointment['categoryName'] ?? 'Appointment', 'client');

        return $this->send($clientEmail, $subject, $htmlBody);
    }

    /**
     * Send new appointment notification to provider
     */
    public function sendProviderAppointmentNotification(array $appointment, array $client, array $provider): bool
    {
        if (!filter_var($this->settings['notify_provider_on_appointment'] ?? true, FILTER_VALIDATE_BOOLEAN)) {
            return false;
        }

        $providerEmail = $provider['email'] ?? '';
        if (empty($providerEmail)) {
            return false;
        }

        $clientName = trim(($client['first_name'] ?? '') . ' ' . ($client['last_name'] ?? ''));
        $providerName = trim(($provider['first_name'] ?? '') . ' ' . ($provider['last_name'] ?? ''));

        $appointmentDate = date('l, F j, Y', strtotime($appointment['eventDate']));
        $appointmentTime = date('g:i A', strtotime($appointment['startTime']));
        $duration = intval($appointment['duration'] / 60);

        $subject = "New Appointment Scheduled - $clientName on $appointmentDate";
        $htmlBody = $this->getEmailTemplate('confirmation', $clientName, $providerName, '', $appointmentDate, $appointmentTime, $duration, $appointment['categoryName'] ?? 'Appointment', 'provider');

        return $this->send($providerEmail, $subject, $htmlBody);
    }

    /**
     * Send cancellation notification to client
     */
    public function sendClientCancellationNotification(array $appointment, array $client, array $provider, string $reason = ''): bool
    {
        if (!filter_var($this->settings['notify_client_on_cancelled'] ?? true, FILTER_VALIDATE_BOOLEAN)) {
            return false;
        }

        $clientEmail = $client['email'] ?? '';
        if (empty($clientEmail)) {
            return false;
        }

        $clientName = trim(($client['first_name'] ?? '') . ' ' . ($client['last_name'] ?? ''));
        $providerName = trim(($provider['first_name'] ?? '') . ' ' . ($provider['last_name'] ?? ''));
        $providerTitle = $provider['title'] ?? '';

        $appointmentDate = date('l, F j, Y', strtotime($appointment['eventDate']));
        $appointmentTime = date('g:i A', strtotime($appointment['startTime']));
        $duration = intval($appointment['duration'] / 60);

        $subject = "Appointment Cancelled - $appointmentDate";
        $htmlBody = $this->getEmailTemplate('cancellation', $clientName, $providerName, $providerTitle, $appointmentDate, $appointmentTime, $duration, $appointment['categoryName'] ?? 'Appointment', 'client', $reason);

        return $this->send($clientEmail, $subject, $htmlBody);
    }

    /**
     * Send cancellation notification to provider
     */
    public function sendProviderCancellationNotification(array $appointment, array $client, array $provider, string $reason = ''): bool
    {
        if (!filter_var($this->settings['notify_provider_on_cancelled'] ?? true, FILTER_VALIDATE_BOOLEAN)) {
            return false;
        }

        $providerEmail = $provider['email'] ?? '';
        if (empty($providerEmail)) {
            return false;
        }

        $clientName = trim(($client['first_name'] ?? '') . ' ' . ($client['last_name'] ?? ''));
        $providerName = trim(($provider['first_name'] ?? '') . ' ' . ($provider['last_name'] ?? ''));

        $appointmentDate = date('l, F j, Y', strtotime($appointment['eventDate']));
        $appointmentTime = date('g:i A', strtotime($appointment['startTime']));
        $duration = intval($appointment['duration'] / 60);

        $subject = "Appointment Cancelled - $clientName on $appointmentDate";
        $htmlBody = $this->getEmailTemplate('cancellation', $clientName, $providerName, '', $appointmentDate, $appointmentTime, $duration, $appointment['categoryName'] ?? 'Appointment', 'provider', $reason);

        return $this->send($providerEmail, $subject, $htmlBody);
    }

    /**
     * Send modification notification to client
     */
    public function sendClientModificationNotification(array $appointment, array $client, array $provider): bool
    {
        if (!filter_var($this->settings['notify_client_on_modified'] ?? true, FILTER_VALIDATE_BOOLEAN)) {
            return false;
        }

        $clientEmail = $client['email'] ?? '';
        if (empty($clientEmail)) {
            return false;
        }

        $clientName = trim(($client['first_name'] ?? '') . ' ' . ($client['last_name'] ?? ''));
        $providerName = trim(($provider['first_name'] ?? '') . ' ' . ($provider['last_name'] ?? ''));
        $providerTitle = $provider['title'] ?? '';

        $appointmentDate = date('l, F j, Y', strtotime($appointment['eventDate']));
        $appointmentTime = date('g:i A', strtotime($appointment['startTime']));
        $duration = intval($appointment['duration'] / 60);

        $subject = "Appointment Updated - $appointmentDate";
        $htmlBody = $this->getEmailTemplate('modification', $clientName, $providerName, $providerTitle, $appointmentDate, $appointmentTime, $duration, $appointment['categoryName'] ?? 'Appointment', 'client');

        return $this->send($clientEmail, $subject, $htmlBody);
    }

    /**
     * Send modification notification to provider
     */
    public function sendProviderModificationNotification(array $appointment, array $client, array $provider): bool
    {
        if (!filter_var($this->settings['notify_provider_on_modified'] ?? true, FILTER_VALIDATE_BOOLEAN)) {
            return false;
        }

        $providerEmail = $provider['email'] ?? '';
        if (empty($providerEmail)) {
            return false;
        }

        $clientName = trim(($client['first_name'] ?? '') . ' ' . ($client['last_name'] ?? ''));
        $providerName = trim(($provider['first_name'] ?? '') . ' ' . ($provider['last_name'] ?? ''));

        $appointmentDate = date('l, F j, Y', strtotime($appointment['eventDate']));
        $appointmentTime = date('g:i A', strtotime($appointment['startTime']));
        $duration = intval($appointment['duration'] / 60);

        $subject = "Appointment Updated - $clientName on $appointmentDate";
        $htmlBody = $this->getEmailTemplate('modification', $clientName, $providerName, '', $appointmentDate, $appointmentTime, $duration, $appointment['categoryName'] ?? 'Appointment', 'provider');

        return $this->send($providerEmail, $subject, $htmlBody);
    }

    /**
     * Get HTML email template
     */
    private function getEmailTemplate(
        string $templateType,
        string $clientName,
        string $providerName,
        string $providerTitle,
        string $appointmentDate,
        string $appointmentTime,
        int $duration,
        string $appointmentType,
        string $recipientType,
        string $cancellationReason = ''
    ): string {
        $providerDisplay = $providerName;
        if (!empty($providerTitle)) {
            $providerDisplay .= ", $providerTitle";
        }

        // Set colors and titles based on template type
        switch ($templateType) {
            case 'cancellation':
                $headerColor = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                $headerTitle = 'Appointment Cancelled';
                if ($recipientType === 'client') {
                    $greeting = "Dear $clientName,";
                    $intro = "Your appointment with $providerDisplay has been cancelled.";
                } else {
                    $greeting = "Dear $providerName,";
                    $intro = "The appointment with $clientName has been cancelled.";
                }
                $footerNote = $cancellationReason ? "Reason: $cancellationReason" : "Please contact us if you have any questions.";
                break;

            case 'modification':
                $headerColor = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
                $headerTitle = 'Appointment Updated';
                if ($recipientType === 'client') {
                    $greeting = "Dear $clientName,";
                    $intro = "Your appointment with $providerDisplay has been updated. Please see the new details below.";
                } else {
                    $greeting = "Dear $providerName,";
                    $intro = "The appointment with $clientName has been updated. Please see the new details below.";
                }
                $footerNote = "If you need to reschedule or cancel, please contact us as soon as possible.";
                break;

            default: // confirmation
                $headerColor = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                $headerTitle = 'Appointment Confirmation';
                if ($recipientType === 'client') {
                    $greeting = "Dear $clientName,";
                    $intro = "Your appointment has been scheduled with $providerDisplay.";
                } else {
                    $greeting = "Dear $providerName,";
                    $intro = "A new appointment has been scheduled with $clientName.";
                }
                $footerNote = "If you need to reschedule or cancel this appointment, please contact us as soon as possible.";
                break;
        }

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$headerTitle</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                        <td style="padding: 32px 40px; background: $headerColor; border-radius: 12px 12px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">$headerTitle</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">$greeting</p>
                            <p style="margin: 0 0 32px 0; color: #374151; font-size: 16px; line-height: 1.6;">$intro</p>
                            <table role="presentation" style="width: 100%; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <table role="presentation" style="width: 100%;">
                                            <tr><td style="padding: 8px 0;"><span style="color: #6b7280; font-size: 14px;">Date</span><br><strong style="color: #111827; font-size: 16px;">$appointmentDate</strong></td></tr>
                                            <tr><td style="padding: 8px 0;"><span style="color: #6b7280; font-size: 14px;">Time</span><br><strong style="color: #111827; font-size: 16px;">$appointmentTime</strong></td></tr>
                                            <tr><td style="padding: 8px 0;"><span style="color: #6b7280; font-size: 14px;">Duration</span><br><strong style="color: #111827; font-size: 16px;">$duration minutes</strong></td></tr>
                                            <tr><td style="padding: 8px 0;"><span style="color: #6b7280; font-size: 14px;">Appointment Type</span><br><strong style="color: #111827; font-size: 16px;">$appointmentType</strong></td></tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 32px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">$footerNote</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">This is an automated message from SanctumEMHR. Please do not reply directly to this email.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }

    /**
     * Get current email settings (for admin display)
     */
    public function getSettings(): array
    {
        return [
            'enabled' => $this->enabled,
            'from_email' => $this->settings['from_email'] ?? '',
            'from_name' => $this->settings['from_name'] ?? 'SanctumEMHR',
            'smtp_host' => $this->settings['smtp_host'] ?? '',
            'smtp_port' => $this->settings['smtp_port'] ?? '587',
            'smtp_encryption' => $this->settings['smtp_encryption'] ?? 'tls',
            'notify_client_on_appointment' => filter_var($this->settings['notify_client_on_appointment'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'notify_provider_on_appointment' => filter_var($this->settings['notify_provider_on_appointment'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'notify_client_on_cancelled' => filter_var($this->settings['notify_client_on_cancelled'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'notify_provider_on_cancelled' => filter_var($this->settings['notify_provider_on_cancelled'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'notify_client_on_modified' => filter_var($this->settings['notify_client_on_modified'] ?? true, FILTER_VALIDATE_BOOLEAN),
            'notify_provider_on_modified' => filter_var($this->settings['notify_provider_on_modified'] ?? true, FILTER_VALIDATE_BOOLEAN)
        ];
    }
}
