/**
 * SanctumEMHR - Billing Modifiers Management
 * Manage billing modifiers for CPT codes
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';

function BillingModifiers() {
  const [modifiers, setModifiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    code: '',
    description: '',
    modifier_type: 'clinician',
    is_active: 1,
    sort_order: 0
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const modifierTypes = [
    { value: 'telehealth', label: 'Telehealth' },
    { value: 'clinician', label: 'Clinician Type' },
    { value: 'administrative', label: 'Administrative' },
    { value: 'mh-specific', label: 'MH-Specific' }
  ];

  useEffect(() => {
    fetchModifiers();
  }, []);

  const fetchModifiers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/custom/api/billing_modifiers.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch billing modifiers');
      }

      const data = await response.json();
      setModifiers(data.modifiers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({
      id: null,
      code: '',
      description: '',
      modifier_type: 'clinician',
      is_active: 1,
      sort_order: 0
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleEdit = (modifier) => {
    setFormData({
      id: modifier.id,
      code: modifier.code,
      description: modifier.description,
      modifier_type: modifier.modifier_type,
      is_active: modifier.is_active,
      sort_order: modifier.sort_order
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleSave = async () => {
    setFormError('');

    // Validation
    if (!formData.code.trim()) {
      setFormError('Modifier code is required');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Description is required');
      return;
    }

    try {
      setSaving(true);
      const action = formData.id ? 'update' : 'create';
      const response = await fetch('/custom/api/billing_modifiers.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...formData })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save modifier');
      }

      await fetchModifiers();
      setShowAddModal(false);
      setShowEditModal(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this modifier? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/custom/api/billing_modifiers.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete modifier');
      }

      await fetchModifiers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (modifier) => {
    try {
      const response = await fetch('/custom/api/billing_modifiers.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: modifier.id,
          is_active: modifier.is_active ? 0 : 1
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update status');
      }

      await fetchModifiers();
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter modifiers
  const filteredModifiers = modifiers.filter(mod => {
    const matchesSearch = mod.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mod.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || mod.modifier_type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="glass-card p-8">
        <div className="text-center text-gray-600">Loading billing modifiers...</div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Billing Modifiers</h2>
          <p className="text-gray-600 mt-1">Manage CPT code modifiers for billing</p>
        </div>

        <PrimaryButton
          onClick={handleAdd}
        >
          + Add Modifier
        </PrimaryButton>

      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <input
            type="text"
            placeholder="Search modifiers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            {modifierTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Modifiers Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredModifiers.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                  No modifiers found
                </td>
              </tr>
            ) : (
              filteredModifiers.map((modifier) => (
                <tr key={modifier.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-gray-900">
                    {modifier.code}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      modifier.modifier_type === 'telehealth' ? 'bg-blue-100 text-blue-700' :
                      modifier.modifier_type === 'clinician' ? 'bg-green-100 text-green-700' :
                      modifier.modifier_type === 'administrative' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {modifierTypes.find(t => t.value === modifier.modifier_type)?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{modifier.description}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(modifier)}
                      className={`px-3 py-1 text-xs rounded-full ${
                        modifier.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {modifier.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleEdit(modifier)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(modifier.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {formData.id ? 'Edit Modifier' : 'Add Modifier'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modifier Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="HO"
                    maxLength="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.modifier_type}
                    onChange={(e) => setFormData({ ...formData, modifier_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {modifierTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Master's Level Therapist"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active === 1}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <SecondaryButton
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
                disabled={saving}
              >
                Cancel
              </SecondaryButton>

              <PrimaryButton
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Modifier'}
              </PrimaryButton>

            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default BillingModifiers;
