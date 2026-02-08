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

import React, { useState, useEffect } from 'react';
import { Mail, Server, Bell, Save, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { FormLabel } from '../FormLabel';
import { ErrorMessage } from '../ErrorMessage';

function EmailSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
    notify_provider_on_appointment: true
  });

  const [passwordSet, setPasswordSet] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

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
          smtp_password: '' // Don't populate password field
        }));
        setPasswordSet(result.settings.smtp_password_set || false);
      }
    } catch (err) {
      console.error('Error loading email settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

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

      setSuccess('Email settings saved successfully');
      if (settings.smtp_password) {
        setPasswordSet(true);
        setSettings(prev => ({ ...prev, smtp_password: '' }));
      }

      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error saving email settings:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="glass-card p-8">
        <div className="text-center text-gray-600">Loading email settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3">
          <Mail className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Email Settings</h2>
            <p className="text-gray-600 text-sm">Configure email notifications for appointments</p>
          </div>
        </div>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Enable/Disable */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${settings.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
              {settings.enabled ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Email Notifications</h3>
              <p className="text-sm text-gray-500">
                {settings.enabled ? 'Email notifications are enabled' : 'Email notifications are disabled'}
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Sender Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Sender Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FormLabel>From Email Address</FormLabel>
            <input
              type="email"
              value={settings.from_email}
              onChange={(e) => handleChange('from_email', e.target.value)}
              placeholder="noreply@yourpractice.com"
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">Email address that notifications will be sent from</p>
          </div>
          <div>
            <FormLabel>From Name</FormLabel>
            <input
              type="text"
              value={settings.from_name}
              onChange={(e) => handleChange('from_name', e.target.value)}
              placeholder="Your Practice Name"
              className="input-field"
            />
            <p className="text-xs text-gray-500 mt-1">Display name shown to recipients</p>
          </div>
        </div>
      </div>

      {/* SMTP Settings */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">SMTP Configuration</h3>
        </div>
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
              className="input-field"
            />
          </div>
          <div>
            <FormLabel>SMTP Port</FormLabel>
            <input
              type="text"
              value={settings.smtp_port}
              onChange={(e) => handleChange('smtp_port', e.target.value)}
              placeholder="587"
              className="input-field"
            />
          </div>
          <div>
            <FormLabel>SMTP Username</FormLabel>
            <input
              type="text"
              value={settings.smtp_user}
              onChange={(e) => handleChange('smtp_user', e.target.value)}
              placeholder="username@yourprovider.com"
              className="input-field"
            />
          </div>
          <div>
            <FormLabel>SMTP Password</FormLabel>
            <input
              type="password"
              value={settings.smtp_password}
              onChange={(e) => handleChange('smtp_password', e.target.value)}
              placeholder={passwordSet ? '••••••••' : 'Enter password'}
              className="input-field"
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
              className="input-field"
            >
              <option value="tls">TLS (Recommended)</option>
              <option value="ssl">SSL</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Notification Preferences</h3>
        </div>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notify_client_on_appointment}
              onChange={(e) => handleChange('notify_client_on_appointment', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-800">Notify clients when appointments are created</span>
              <p className="text-sm text-gray-500">Send email confirmation to clients when new appointments are scheduled</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notify_provider_on_appointment}
              onChange={(e) => handleChange('notify_provider_on_appointment', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div>
              <span className="font-medium text-gray-800">Notify clinicians when appointments are created</span>
              <p className="text-sm text-gray-500">Send email notification to providers when appointments are added to their calendar</p>
            </div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <SecondaryButton onClick={fetchSettings} disabled={saving}>
          Reset
        </SecondaryButton>
        <PrimaryButton onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </PrimaryButton>
      </div>
    </div>
  );
}

export default EmailSettings;
