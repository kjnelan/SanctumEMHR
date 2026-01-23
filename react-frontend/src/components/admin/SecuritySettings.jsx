/**
 * Security Settings Component
 * Configure security-related system settings
 */

import { useState, useEffect } from 'react';

function SecuritySettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/custom/api/settings.php?category=security', {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch settings');

      const data = await response.json();
      setSettings(data.settings || []);

      // Initialize form data
      const initialData = {};
      data.settings.forEach(setting => {
        initialData[setting.setting_key] = setting.setting_value;
      });
      setFormData(initialData);

    } catch (err) {
      console.error('Error fetching settings:', err);
      setMessage({ type: 'error', text: 'Failed to load security settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch('/custom/api/settings.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          settings: formData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save settings');
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage(null), 3000);

    } catch (err) {
      console.error('Error saving settings:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const renderSettingInput = (setting) => {
    const key = setting.setting_key;
    const value = formData[key] || setting.setting_value;

    if (setting.setting_type === 'boolean') {
      return (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={value === '1' || value === true}
            onChange={(e) => handleChange(key, e.target.checked ? '1' : '0')}
            disabled={!setting.is_editable}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      );
    } else if (setting.setting_type === 'integer') {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
          disabled={!setting.is_editable}
          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 text-gray-900"
          min="0"
        />
      );
    } else {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
          disabled={!setting.is_editable}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 text-gray-900"
        />
      );
    }
  };

  const getSettingLabel = (key) => {
    return key.split('.').pop().split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-gray-700">Loading security settings...</div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
        <p className="text-gray-600 mt-1">Configure security and authentication parameters</p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`mb-6 px-4 py-3 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-100/60 border-green-300/50 text-green-700'
            : 'bg-red-100/60 border-red-300/50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Account Lockout Section */}
        <div className="bg-white/30 backdrop-blur-sm rounded-xl p-6 border border-white/40">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Account Lockout</h3>
          <div className="space-y-5">
            {settings.filter(s => s.setting_key.includes('login_attempts') || s.setting_key.includes('lockout')).map(setting => (
              <div key={setting.setting_key} className="flex items-center justify-between py-2">
                <div className="flex-1 pr-4">
                  <label className="block font-medium text-gray-900 text-sm">
                    {getSettingLabel(setting.setting_key)}
                  </label>
                  <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                </div>
                <div className="flex-shrink-0">
                  {renderSettingInput(setting)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Password Requirements Section */}
        <div className="bg-white/30 backdrop-blur-sm rounded-xl p-6 border border-white/40">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Password Requirements</h3>
          <div className="space-y-5">
            {settings.filter(s => s.setting_key.includes('password')).map(setting => (
              <div key={setting.setting_key} className="flex items-center justify-between py-2">
                <div className="flex-1 pr-4">
                  <label className="block font-medium text-gray-900 text-sm">
                    {getSettingLabel(setting.setting_key)}
                  </label>
                  <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                </div>
                <div className="flex-shrink-0">
                  {renderSettingInput(setting)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Session Management Section */}
        <div className="bg-white/30 backdrop-blur-sm rounded-xl p-6 border border-white/40">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Session Management</h3>
          <div className="space-y-5">
            {settings.filter(s => s.setting_key.includes('session')).map(setting => (
              <div key={setting.setting_key} className="flex items-center justify-between py-2">
                <div className="flex-1 pr-4">
                  <label className="block font-medium text-gray-900 text-sm">
                    {getSettingLabel(setting.setting_key)}
                  </label>
                  <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                </div>
                <div className="flex-shrink-0">
                  {renderSettingInput(setting)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SecuritySettings;
