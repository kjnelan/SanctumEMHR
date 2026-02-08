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
    private array $templates;
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

        $this->templates = [];

        try {
            $sql = "SELECT setting_key, setting_value FROM system_settings WHERE setting_key LIKE 'email.%'";
            $rows = $this->db->queryAll($sql);

            foreach ($rows as $row) {
                $key = $row['setting_key'];

                // Handle templates (custom templates take priority over defaults)
                if (strpos($key, 'email.template_') === 0) {
                    $templateKey = str_replace('email.template_', '', $key);
                    $this->templates[$templateKey] = $row['setting_value'];
                } elseif (strpos($key, 'email.default_template_') === 0) {
                    $templateKey = str_replace('email.default_template_', '', $key);
                    // Only use default if custom not already set
                    if (!isset($this->templates[$templateKey])) {
                        $this->templates[$templateKey] = $row['setting_value'];
                    }
                } else {
                    // Regular settings
                    $settingKey = str_replace('email.', '', $key);
                    $this->settings[$settingKey] = $row['setting_value'];
                }
            }

            $this->enabled = filter_var($this->settings['enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
        } catch (\Exception $e) {
            error_log("EmailService: Failed to load settings - " . $e->getMessage());
            $this->enabled = false;
        }
    }

    /**
     * Get template with variable substitution
     */
    private function getTemplateContent(string $templateKey, array $variables): array
    {
        $subject = $this->templates[$templateKey . '_subject'] ?? '';
        $body = $this->templates[$templateKey . '_body'] ?? '';

        // Substitute variables
        foreach ($variables as $key => $value) {
            $placeholder = '{{' . $key . '}}';
            $subject = str_replace($placeholder, $value, $subject);
            $body = str_replace($placeholder, $value, $body);
        }

        return ['subject' => $subject, 'body' => $body];
    }

    /**
     * Convert plain text body to HTML email
     */
    private function textToHtml(string $text, string $headerTitle, string $headerColor): string
    {
        // Escape HTML entities and convert newlines to <br>
        $htmlBody = nl2br(htmlspecialchars($text, ENT_QUOTES, 'UTF-8'));

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
                            <div style="color: #374151; font-size: 16px; line-height: 1.8;">$htmlBody</div>
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
     * Build variables array for template substitution
     */
    private function buildTemplateVariables(array $appointment, array $client, array $provider, string $cancellationReason = ''): array
    {
        $providerName = trim(($provider['first_name'] ?? '') . ' ' . ($provider['last_name'] ?? ''));
        if (!empty($provider['title'])) {
            $providerName .= ', ' . $provider['title'];
        }

        return [
            'client_name' => trim(($client['first_name'] ?? '') . ' ' . ($client['last_name'] ?? '')),
            'provider_name' => $providerName,
            'appointment_date' => date('l, F j, Y', strtotime($appointment['eventDate'])),
            'appointment_time' => date('g:i A', strtotime($appointment['startTime'])),
            'duration' => (string)intval($appointment['duration'] / 60),
            'appointment_type' => $appointment['categoryName'] ?? 'Appointment',
            'practice_name' => $this->settings['from_name'] ?? 'SanctumEMHR',
            'cancellation_reason' => $cancellationReason ? "Reason: $cancellationReason" : ''
        ];
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

        $variables = $this->buildTemplateVariables($appointment, $client, $provider);
        $template = $this->getTemplateContent('client_confirmation', $variables);

        $headerColor = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        $htmlBody = $this->textToHtml($template['body'], 'Appointment Confirmation', $headerColor);

        return $this->send($clientEmail, $template['subject'], $htmlBody, $template['body']);
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

        $variables = $this->buildTemplateVariables($appointment, $client, $provider);
        $template = $this->getTemplateContent('provider_confirmation', $variables);

        $headerColor = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        $htmlBody = $this->textToHtml($template['body'], 'New Appointment', $headerColor);

        return $this->send($providerEmail, $template['subject'], $htmlBody, $template['body']);
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

        $variables = $this->buildTemplateVariables($appointment, $client, $provider, $reason);
        $template = $this->getTemplateContent('client_cancellation', $variables);

        $headerColor = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        $htmlBody = $this->textToHtml($template['body'], 'Appointment Cancelled', $headerColor);

        return $this->send($clientEmail, $template['subject'], $htmlBody, $template['body']);
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

        $variables = $this->buildTemplateVariables($appointment, $client, $provider, $reason);
        $template = $this->getTemplateContent('provider_cancellation', $variables);

        $headerColor = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        $htmlBody = $this->textToHtml($template['body'], 'Appointment Cancelled', $headerColor);

        return $this->send($providerEmail, $template['subject'], $htmlBody, $template['body']);
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

        $variables = $this->buildTemplateVariables($appointment, $client, $provider);
        $template = $this->getTemplateContent('client_modification', $variables);

        $headerColor = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        $htmlBody = $this->textToHtml($template['body'], 'Appointment Updated', $headerColor);

        return $this->send($clientEmail, $template['subject'], $htmlBody, $template['body']);
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

        $variables = $this->buildTemplateVariables($appointment, $client, $provider);
        $template = $this->getTemplateContent('provider_modification', $variables);

        $headerColor = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        $htmlBody = $this->textToHtml($template['body'], 'Appointment Updated', $headerColor);

        return $this->send($providerEmail, $template['subject'], $htmlBody, $template['body']);
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
