import { useState, useEffect } from 'react';
import { getCalendarSettings, updateCalendarSettings } from '../../utils/api';

function CalendarSettings() {
  const [settings, setSettings] = useState({
    startHour: 8,
    endHour: 17,
    interval: 15,
    viewType: 'week',
    eventColor: '1',
    providersSeeAll: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await getCalendarSettings();
      if (response.settings) {
        setSettings({
          startHour: response.settings.startHour || 8,
          endHour: response.settings.endHour || 17,
          interval: response.settings.interval || 15,
          viewType: response.settings.viewType || 'week',
          eventColor: response.settings.eventColor || '1',
          providersSeeAll: response.settings.providersSeeAll !== undefined ? response.settings.providersSeeAll : true
        });
      }
    } catch (err) {
      console.error('Failed to load calendar settings:', err);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateCalendarSettings(settings);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (err) {
      console.error('Failed to save calendar settings:', err);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-gray-700">Loading calendar settings...</div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Calendar Settings</h2>
        <p className="text-gray-600 mt-1">Configure calendar display and behavior</p>
      </div>

      {/* Success/Error Message */}
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
        {/* Calendar Starting Hour */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Calendar Starting Hour
          </label>
          <select
            value={settings.startHour}
            onChange={(e) => handleChange('startHour', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
              </option>
            ))}
          </select>
        </div>

        {/* Calendar Ending Hour */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Calendar Ending Hour
          </label>
          <select
            value={settings.endHour}
            onChange={(e) => handleChange('endHour', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
              </option>
            ))}
          </select>
        </div>

        {/* Calendar Interval */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Calendar Interval (minutes)
          </label>
          <select
            value={settings.interval}
            onChange={(e) => handleChange('interval', parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>60 minutes</option>
          </select>
        </div>

        {/* Default Calendar View */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Calendar View
          </label>
          <select
            value={settings.viewType}
            onChange={(e) => handleChange('viewType', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>

        {/* Appointment/Event Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Appointment/Event Color
          </label>
          <select
            value={settings.eventColor}
            onChange={(e) => handleChange('eventColor', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
          >
            <option value="1">Category Color Schema</option>
            <option value="2">Facility Color Schema</option>
          </select>
        </div>

        {/* Providers See Entire Calendar */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.providersSeeAll}
              onChange={(e) => handleChange('providersSeeAll', e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-3 text-sm font-medium text-gray-700">
              Providers See Entire Calendar
            </span>
          </label>
          <p className="text-sm text-gray-500 mt-1 ml-8">
            Allow providers to see all appointments, not just their own
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            saving
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

export default CalendarSettings;
