/**
 * SanctumEMHR EMHR
 * Clinical Settings Component
 * Configure clinical note and supervision settings
 */

import { useState, useEffect } from 'react';
import { PrimaryButton } from '../PrimaryButton';
import { ErrorMessage } from '../ErrorMessage';

function ClinicalSettings() {
    const [settings, setSettings] = useState({
        supervision_require_cosign: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await fetch('/custom/api/settings.php?category=supervision', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch settings');
            }

            const result = await response.json();
            const settingsObj = {};

            // Convert array to object for easier access
            (result.settings || []).forEach(setting => {
                settingsObj[setting.setting_key] = setting.setting_value === '1' || setting.setting_value === 'true';
            });

            setSettings(prev => ({
                ...prev,
                ...settingsObj
            }));
            setError(null);
        } catch (err) {
            console.error('Error fetching settings:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccessMessage(null);

            const response = await fetch('/custom/api/settings.php', {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    settings: {
                        'supervision.require_cosign': settings.supervision_require_cosign ? '1' : '0'
                    }
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to save settings');
            }

            setSuccessMessage('Settings saved successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            console.error('Error saving settings:', err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = (key) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    if (loading) {
        return (
            <div className="glass-card p-6">
                <div className="text-center text-gray-600">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="glass-card p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Clinical Settings</h2>
            <p className="text-gray-600 mb-6">Configure clinical documentation and supervision settings</p>

            {error && <ErrorMessage className="mb-4">{error}</ErrorMessage>}

            {successMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    {successMessage}
                </div>
            )}

            {/* Supervision Settings */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                    Supervision Settings
                </h3>

                <div className="space-y-4">
                    <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                        <input
                            type="checkbox"
                            checked={settings.supervision_require_cosign || false}
                            onChange={() => handleToggle('supervision_require_cosign')}
                            className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                            <span className="block font-medium text-gray-800">
                                Require Supervisor Co-signature on Notes
                            </span>
                            <span className="block text-sm text-gray-600 mt-1">
                                When enabled, clinical notes from providers who have assigned supervisors
                                will require their supervisor to co-sign before the note is fully locked.
                                The provider can still sign and lock their portion, but a supervisor
                                review will be required.
                            </span>
                        </div>
                    </label>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
                <PrimaryButton onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                </PrimaryButton>
            </div>
        </div>
    );
}

export default ClinicalSettings;
