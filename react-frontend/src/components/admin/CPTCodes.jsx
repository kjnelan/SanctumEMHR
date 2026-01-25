/**
 * SanctumEMHR - CPT Codes Management
 * Manage CPT billing codes for services
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

function CPTCodes() {
  const [cptCodes, setCptCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    code: '',
    category: 'Individual Therapy',
    type: 'CPT4',
    description: '',
    standard_duration_minutes: 50,
    standard_fee: '',
    is_active: 1,
    is_addon: 0,
    requires_primary_code: '',
    sort_order: 0
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const categoryOptions = [
    'Individual Therapy',
    'Family Therapy',
    'Group Therapy',
    'Intake',
    'Crisis',
    'Assessment',
    'Case Management',
    'Non-Billable',
    'Other'
  ];

  useEffect(() => {
    fetchCPTCodes();
  }, []);

  const fetchCPTCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/custom/api/cpt_codes.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CPT codes');
      }

      const data = await response.json();
      setCptCodes(data.cpt_codes || []);
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
      category: 'Individual Therapy',
      type: 'CPT4',
      description: '',
      standard_duration_minutes: 50,
      standard_fee: '',
      is_active: 1,
      is_addon: 0,
      requires_primary_code: '',
      sort_order: 0
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleEdit = (code) => {
    setFormData({
      id: code.id,
      code: code.code,
      category: code.category,
      type: code.type,
      description: code.description,
      standard_duration_minutes: code.standard_duration_minutes,
      standard_fee: code.standard_fee || '',
      is_active: code.is_active,
      is_addon: code.is_addon,
      requires_primary_code: code.requires_primary_code || '',
      sort_order: code.sort_order
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleSave = async () => {
    setFormError('');

    // Validation
    if (!formData.code.trim()) {
      setFormError('CPT code is required');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Description is required');
      return;
    }

    try {
      setSaving(true);
      const action = formData.id ? 'update' : 'create';
      const response = await fetch('/custom/api/cpt_codes.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...formData })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save CPT code');
      }

      await fetchCPTCodes();
      setShowAddModal(false);
      setShowEditModal(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this CPT code? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/custom/api/cpt_codes.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete CPT code');
      }

      await fetchCPTCodes();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (code) => {
    try {
      const response = await fetch('/custom/api/cpt_codes.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: code.id,
          is_active: code.is_active ? 0 : 1
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update status');
      }

      await fetchCPTCodes();
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter and sort codes
  const filteredCodes = cptCodes
    .filter(code => {
      const matchesSearch = code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           code.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || code.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Sort by CPT code (numeric comparison for numeric codes)
      const aCode = a.code.toString();
      const bCode = b.code.toString();
      return aCode.localeCompare(bCode, undefined, { numeric: true });
    });

  const uniqueCategories = [...new Set(cptCodes.map(c => c.category))];

  if (loading) {
    return (
      <div className="glass-card p-8">
        <div className="text-center text-gray-600">Loading CPT codes...</div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CPT Codes</h2>
          <p className="text-gray-600 mt-1">Manage billing codes for clinical services</p>
        </div>

        <PrimaryButton
          onClick={handleAdd}
          >
          + Add CPT Code
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
            placeholder="Search codes or descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* CPT Codes Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Duration</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Fee</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCodes.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  No CPT codes found
                </td>
              </tr>
            ) : (
              filteredCodes.map((code) => (
                <tr key={code.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-gray-900">
                    {code.code}
                    {code.is_addon === 1 && (
                      <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Add-on</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{code.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{code.description}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-center">{code.standard_duration_minutes} min</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                    {code.standard_fee ? `$${parseFloat(code.standard_fee).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(code)}
                      className={`px-3 py-1 text-xs rounded-full ${
                        code.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {code.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleEdit(code)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <DangerButton
                      onClick={() => handleDelete(code.id)}
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
        title={formData.id ? 'Edit CPT Code' : 'Add CPT Code'}
        size="md"
      >
        <div className="space-y-4">
          {formError && <ErrorMessage>{formError}</ErrorMessage>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel>CPT Code <RequiredAsterisk /></FormLabel>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="90834"
              />
            </div>

            <div>
              <FormLabel>Category</FormLabel>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categoryOptions.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
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
              placeholder="Psychotherapy 45-50 minutes"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel>Standard Duration (minutes)</FormLabel>
              <input
                type="number"
                value={formData.standard_duration_minutes}
                onChange={(e) => setFormData({ ...formData, standard_duration_minutes: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <FormLabel>Standard Fee ($)</FormLabel>
              <input
                type="number"
                step="0.01"
                value={formData.standard_fee}
                onChange={(e) => setFormData({ ...formData, standard_fee: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="150.00"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_addon === 1}
                onChange={(e) => setFormData({ ...formData, is_addon: e.target.checked ? 1 : 0 })}
                className="mr-2 checkbox"
              />
              <span className="checkbox-label">Add-on Code</span>
            </label>

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

          {formData.is_addon === 1 && (
            <div>
              <FormLabel>Requires Primary Code</FormLabel>
              <input
                type="text"
                value={formData.requires_primary_code}
                onChange={(e) => setFormData({ ...formData, requires_primary_code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="90834"
              />
              <p className="text-xs text-gray-500 mt-1">Which primary CPT code is required for this add-on?</p>
            </div>
          )}

          <Modal.Footer>
            <SecondaryButton
              onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
              disabled={saving}
            >
              Cancel
            </SecondaryButton>
            <PrimaryButton onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save CPT Code'}
            </PrimaryButton>
          </Modal.Footer>
        </div>
      </Modal>
    </div>
  );
}

export default CPTCodes;
