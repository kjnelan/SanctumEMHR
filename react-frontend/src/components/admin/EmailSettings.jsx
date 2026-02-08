/**
 * SanctumEMHR EMHR
 * EmailSettings - Admin settings for email configuration
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import { useState, useEffect } from 'react';
import { PrimaryButton } from '../PrimaryButton';
import { FormLabel } from '../FormLabel';

function EmailSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [settings, setSettings] = useState({
    enabled: false,
    from_email: '',
    from_name: 'SanctumEMHR',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    notify_client_on_appointment: true,
    notify_provider_on_appointment: true,
    notify_client_on_cancelled: true,
    notify_provider_on_cancelled: true,
    notify_client_on_modified: true,
    notify_provider_on_modified: true
  });

  const [passwordSet, setPasswordSet] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch('/custom/api/email_settings.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load email settings');
      }

      const result = await response.json();

      if (result.settings) {
        setSettings(prev => ({
          ...prev,
          ...result.settings,
          smtp_password: ''
        }));
        setPasswordSet(result.settings.smtp_password_set || false);
      }
    } catch (err) {
      console.error('Error loading email settings:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/custom/api/email_settings.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save settings');
      }

      setMessage({ type: 'success', text: 'Email settings saved successfully!' });
      if (settings.smtp_password) {
        setPasswordSet(true);
        setSettings(prev => ({ ...prev, smtp_password: '' }));
      }

      setTimeout(() => setMessage(null), 3000);

    } catch (err) {
      console.error('Error saving email settings:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="text-center text-gray-700 py-8">Loading email settings...</div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Email Settings</h2>
        <p className="text-gray-600 mt-1">Configure email notifications for appointments</p>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-100/60 border-green-300/50 text-green-700'
            : 'bg-red-100/60 border-red-300/50 text-red-700'
        } border`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Enable Toggle */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
              className="checkbox"
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              Enable Email Notifications
            </span>
          </label>
          <p className="text-sm text-gray-500 mt-1 ml-8">
            Send email notifications for appointment events
          </p>
        </div>

        {/* Sender Information */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sender Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FormLabel>From Email Address</FormLabel>
              <input
                type="email"
                value={settings.from_email}
                onChange={(e) => handleChange('from_email', e.target.value)}
                placeholder="noreply@yourpractice.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
              />
              <p className="text-xs text-gray-500 mt-1">Email address notifications will be sent from</p>
            </div>
            <div>
              <FormLabel>From Name</FormLabel>
              <input
                type="text"
                value={settings.from_name}
                onChange={(e) => handleChange('from_name', e.target.value)}
                placeholder="Your Practice Name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
              />
              <p className="text-xs text-gray-500 mt-1">Display name shown to recipients</p>
            </div>
          </div>
        </div>

        {/* SMTP Configuration */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">SMTP Configuration</h3>
          <p className="text-sm text-gray-500 mb-4">
            Configure your mail server settings. Leave blank to use the server's default mail settings.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FormLabel>SMTP Host</FormLabel>
              <input
                type="text"
                value={settings.smtp_host}
                onChange={(e) => handleChange('smtp_host', e.target.value)}
                placeholder="smtp.yourprovider.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
              />
            </div>
            <div>
              <FormLabel>SMTP Port</FormLabel>
              <input
                type="text"
                value={settings.smtp_port}
                onChange={(e) => handleChange('smtp_port', e.target.value)}
                placeholder="587"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
              />
            </div>
            <div>
              <FormLabel>SMTP Username</FormLabel>
              <input
                type="text"
                value={settings.smtp_user}
                onChange={(e) => handleChange('smtp_user', e.target.value)}
                placeholder="username@yourprovider.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
              />
            </div>
            <div>
              <FormLabel>SMTP Password</FormLabel>
              <input
                type="password"
                value={settings.smtp_password}
                onChange={(e) => handleChange('smtp_password', e.target.value)}
                placeholder={passwordSet ? '••••••••' : 'Enter password'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
              />
              {passwordSet && (
                <p className="text-xs text-green-600 mt-1">Password is set. Leave blank to keep current password.</p>
              )}
            </div>
            <div>
              <FormLabel>Encryption</FormLabel>
              <select
                value={settings.smtp_encryption}
                onChange={(e) => handleChange('smtp_encryption', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
              >
                <option value="tls">TLS (Recommended)</option>
                <option value="ssl">SSL</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>

          {/* New Appointment */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">New Appointments</h4>
            <div className="space-y-2 ml-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notify_client_on_appointment}
                  onChange={(e) => handleChange('notify_client_on_appointment', e.target.checked)}
                  className="checkbox"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Notify clients when appointments are created
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notify_provider_on_appointment}
                  onChange={(e) => handleChange('notify_provider_on_appointment', e.target.checked)}
                  className="checkbox"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Notify clinicians when appointments are created
                </span>
              </label>
            </div>
          </div>

          {/* Cancelled Appointment */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Cancelled Appointments</h4>
            <div className="space-y-2 ml-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notify_client_on_cancelled}
                  onChange={(e) => handleChange('notify_client_on_cancelled', e.target.checked)}
                  className="checkbox"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Notify clients when appointments are cancelled
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notify_provider_on_cancelled}
                  onChange={(e) => handleChange('notify_provider_on_cancelled', e.target.checked)}
                  className="checkbox"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Notify clinicians when appointments are cancelled
                </span>
              </label>
            </div>
          </div>

          {/* Modified Appointment */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Modified Appointments</h4>
            <div className="space-y-2 ml-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notify_client_on_modified}
                  onChange={(e) => handleChange('notify_client_on_modified', e.target.checked)}
                  className="checkbox"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Notify clients when appointment date/time changes
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.notify_provider_on_modified}
                  onChange={(e) => handleChange('notify_provider_on_modified', e.target.checked)}
                  className="checkbox"
                />
                <span className="ml-3 text-sm text-gray-700">
                  Notify clinicians when appointment date/time changes
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <PrimaryButton onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </PrimaryButton>
      </div>
    </div>
  );
}

export default EmailSettings;
