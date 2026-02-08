/**
 * SanctumEMHR - Calendar Settings Management
 * Configure calendar display, appointment statuses, and cancellation reasons
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import { useState, useEffect } from 'react';
import { getCalendarSettings, updateCalendarSettings } from '../../services/CalendarService';
import { Modal } from '../Modal';
import { GlassyTabs, GlassyTab } from '../shared/GlassyTabs';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { DangerButton } from '../DangerButton';
import { FormLabel } from '../FormLabel';
import { RequiredAsterisk } from '../shared/RequiredAsterisk';
import { ErrorMessage } from '../ErrorMessage';
import { CalendarCategoriesTab } from './CalendarCategories';

function CalendarSettings() {
  const [mainTab, setMainTab] = useState('general');

  return (
    <div className="w-full">
      {/* Header */}
      <div className="glass-card p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Calendar Settings</h1>
        <p className="text-gray-600 mt-2">Configure calendar display, categories, and appointment options</p>
      </div>

      {/* Tab Navigation */}
      <GlassyTabs className="mb-6">
        <GlassyTab
          active={mainTab === 'general'}
          onClick={() => setMainTab('general')}
        >
          General Settings
        </GlassyTab>
        <GlassyTab
          active={mainTab === 'categories'}
          onClick={() => setMainTab('categories')}
        >
          Categories
        </GlassyTab>
        <GlassyTab
          active={mainTab === 'statuses'}
          onClick={() => setMainTab('statuses')}
        >
          Appointment Statuses
        </GlassyTab>
        <GlassyTab
          active={mainTab === 'reasons'}
          onClick={() => setMainTab('reasons')}
        >
          Cancellation Reasons
        </GlassyTab>
      </GlassyTabs>

      {/* Tab Content */}
      <div className="glass-card p-6">
        {mainTab === 'general' && <GeneralSettingsTab />}
        {mainTab === 'categories' && <CalendarCategoriesTab />}
        {mainTab === 'statuses' && <SettingsListTab listId="appointment_statuses" title="Appointment Statuses" description="Define the status options for appointments" itemLabel="Status" />}
        {mainTab === 'reasons' && <SettingsListTab listId="cancellation_reasons" title="Cancellation Reasons" description="Define reasons for appointment cancellations (including no-shows)" itemLabel="Reason" />}
      </div>
    </div>
  );
}

// ============================================
// GENERAL SETTINGS TAB
// ============================================
function GeneralSettingsTab() {
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
      <div className="text-center text-gray-700 py-8">Loading settings...</div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">General Settings</h2>
        <p className="text-gray-600 mt-1">Configure calendar display and behavior</p>
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
        <div>
          <FormLabel>Calendar Starting Hour</FormLabel>
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

        <div>
          <FormLabel>Calendar Ending Hour</FormLabel>
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

        <div>
          <FormLabel>Calendar Interval (minutes)</FormLabel>
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

        <div>
          <FormLabel>Default Calendar View</FormLabel>
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

        <div>
          <FormLabel>Appointment/Event Color</FormLabel>
          <select
            value={settings.eventColor}
            onChange={(e) => handleChange('eventColor', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
          >
            <option value="1">Category Color Schema</option>
            <option value="2">Facility Color Schema</option>
          </select>
        </div>

        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.providersSeeAll}
              onChange={(e) => handleChange('providersSeeAll', e.target.checked)}
              className="checkbox"
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

      <div className="mt-8 pt-6 border-t border-gray-200">
        <PrimaryButton onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </PrimaryButton>
      </div>
    </>
  );
}

// ============================================
// REUSABLE SETTINGS LIST TAB
// ============================================
function SettingsListTab({ listId, title, description, itemLabel }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    option_id: '',
    title: '',
    notes: '',
    is_active: 1,
    is_default: 0,
    sort_order: 0
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [listId]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/custom/api/settings_lists.php?list_id=${listId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${title.toLowerCase()}`);
      }

      const data = await response.json();
      setItems(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({
      option_id: '',
      title: '',
      notes: '',
      is_active: 1,
      is_default: 0,
      sort_order: items.length + 1
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleEdit = (item) => {
    setFormData({
      option_id: item.option_id,
      title: item.title,
      notes: item.notes || '',
      is_active: item.is_active,
      is_default: item.is_default,
      sort_order: item.sort_order
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!formData.option_id?.trim()) {
      setFormError(`${itemLabel} ID is required`);
      return;
    }
    if (!formData.title?.trim()) {
      setFormError(`${itemLabel} name is required`);
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      const method = showEditModal ? 'PUT' : 'POST';
      const response = await fetch(`/custom/api/settings_lists.php?list_id=${listId}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          list_id: listId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${showEditModal ? 'update' : 'create'} ${itemLabel.toLowerCase()}`);
      }

      await fetchItems();
      setShowAddModal(false);
      setShowEditModal(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (optionId) => {
    if (!confirm(`Are you sure you want to delete this ${itemLabel.toLowerCase()}?`)) {
      return;
    }

    try {
      const response = await fetch(`/custom/api/settings_lists.php?list_id=${listId}&option_id=${optionId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${itemLabel.toLowerCase()}`);
      }

      await fetchItems();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const response = await fetch(`/custom/api/settings_lists.php?list_id=${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          list_id: listId,
          option_id: item.option_id,
          is_active: item.is_active ? 0 : 1
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      await fetchItems();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setFormError('');
  };

  if (loading) {
    return (
      <div className="text-center text-gray-700 py-8">Loading {title.toLowerCase()}...</div>
    );
  }

  return (
    <>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>
        <PrimaryButton onClick={handleAdd}>
          + Add {itemLabel}
        </PrimaryButton>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Items Table */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No {title.toLowerCase()} configured</p>
          <p className="text-gray-500 text-sm mt-1">Click "+ Add {itemLabel}" to create your first entry</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Order</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.option_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-gray-900">
                    {item.option_id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {item.title}
                    {item.is_default === 1 && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">Default</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                    {item.notes || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-center">
                    {item.sort_order}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`px-3 py-1 text-xs rounded-full ${
                        item.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {item.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <DangerButton onClick={() => handleDelete(item.option_id)}>
                      Delete
                    </DangerButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={handleCloseModals}
        title={showEditModal ? `Edit ${itemLabel}` : `Add ${itemLabel}`}
        size="sm"
      >
        <div className="space-y-4">
          {formError && <ErrorMessage>{formError}</ErrorMessage>}

          <div>
            <FormLabel>{itemLabel} ID <RequiredAsterisk /></FormLabel>
            <input
              type="text"
              value={formData.option_id}
              onChange={(e) => setFormData({ ...formData, option_id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              className="input-field"
              placeholder="e.g., scheduled"
              disabled={showEditModal}
            />
            <p className="text-xs text-gray-500 mt-1">Unique identifier (lowercase, no spaces)</p>
          </div>

          <div>
            <FormLabel>{itemLabel} Name <RequiredAsterisk /></FormLabel>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="e.g., Scheduled"
            />
          </div>

          <div>
            <FormLabel>Description</FormLabel>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              rows={2}
              placeholder="Optional description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel>Sort Order</FormLabel>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                className="input-field"
              />
            </div>
            <div>
              <FormLabel>Options</FormLabel>
              <div className="space-y-2 mt-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active === 1}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                    className="checkbox mr-2"
                  />
                  <span className="checkbox-label">Active</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_default === 1}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked ? 1 : 0 })}
                    className="checkbox mr-2"
                  />
                  <span className="checkbox-label">Default</span>
                </label>
              </div>
            </div>
          </div>

          <Modal.Footer>
            <SecondaryButton onClick={handleCloseModals} disabled={saving}>
              Cancel
            </SecondaryButton>
            <PrimaryButton onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : (showEditModal ? 'Save Changes' : `Add ${itemLabel}`)}
            </PrimaryButton>
          </Modal.Footer>
        </div>
      </Modal>
    </>
  );
}

export default CalendarSettings;
