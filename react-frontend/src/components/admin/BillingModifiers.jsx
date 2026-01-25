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
import { Modal } from '../Modal';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { FormLabel } from '../FormLabel';
import { RequiredAsterisk } from '../RequiredAsterisk';
import { ErrorMessage } from '../ErrorMessage';
import { DangerButton } from '../DangerButton';

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
        <ErrorMessage>
          {error}
        </ErrorMessage>
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
                    <DangerButton
                      onClick={() => handleDelete(modifier.id)}
                    >
                      Delete
                    </DangerButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => { setShowAddModal(false); setShowEditModal(false); }}
        title={formData.id ? 'Edit Modifier' : 'Add Modifier'}
        size="sm"
      >
        <div className="space-y-4">
          {formError && (
            <ErrorMessage>{formError}</ErrorMessage>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel>Modifier Code <RequiredAsterisk /></FormLabel>
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
              <FormLabel>Type</FormLabel>
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
            <FormLabel>Description <RequiredAsterisk /></FormLabel>
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
                className="mr-2 checkbox"
              />
              <span className="checkbox-label">Active</span>
            </label>
          </div>

          <Modal.Footer>
            <SecondaryButton
              onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
              disabled={saving}
            >
              Cancel
            </SecondaryButton>
            <PrimaryButton onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Modifier'}
            </PrimaryButton>
          </Modal.Footer>
        </div>
      </Modal>
    </div>
  );
}

export default BillingModifiers;
