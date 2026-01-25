/**
 * SanctumEMHR - Calendar Categories Management
 * Manage appointment categories with CPT code linking
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

function CalendarCategories() {
  const [categories, setCategories] = useState([]);
  const [cptCodes, setCptCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    description: '',
    color: '#3b82f6',
    default_duration: 50,
    is_billable: 1,
    is_active: 1,
    category_type: 'client',
    requires_cpt_selection: 0,
    blocks_availability: 0,
    linked_cpt_codes: [],
    sort_order: 0
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchCPTCodes();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/custom/api/calendar_categories.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch calendar categories');
      }

      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCPTCodes = async () => {
    try {
      const response = await fetch('/custom/api/cpt_codes.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CPT codes');
      }

      const data = await response.json();
      setCptCodes(data.cpt_codes?.filter(code => code.is_active) || []);
    } catch (err) {
      console.error('Failed to load CPT codes:', err);
    }
  };

  const handleAdd = () => {
    setFormData({
      id: null,
      name: '',
      description: '',
      color: '#3b82f6',
      default_duration: 50,
      is_billable: 1,
      is_active: 1,
      category_type: 'client',
      requires_cpt_selection: 0,
      blocks_availability: 0,
      linked_cpt_codes: [],
      sort_order: 0
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleEdit = async (category) => {
    try {
      // Fetch full category details including linked CPT codes
      const response = await fetch(`/custom/api/calendar_categories.php?action=get&id=${category.id}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch category details');
      }

      const data = await response.json();
      const fullCategory = data.category;

      setFormData({
        id: fullCategory.id,
        name: fullCategory.name,
        description: fullCategory.description || '',
        color: fullCategory.color || '#3b82f6',
        default_duration: fullCategory.default_duration || 50,
        is_billable: fullCategory.is_billable,
        is_active: fullCategory.is_active,
        category_type: fullCategory.category_type || 'client',
        requires_cpt_selection: fullCategory.requires_cpt_selection || 0,
        blocks_availability: fullCategory.blocks_availability || 0,
        linked_cpt_codes: fullCategory.linked_cpt_codes || [],
        sort_order: fullCategory.sort_order || 0
      });
      setFormError('');
      setShowEditModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async () => {
    setFormError('');

    // Validation
    if (!formData.name.trim()) {
      setFormError('Category name is required');
      return;
    }

    try {
      setSaving(true);
      const action = formData.id ? 'update' : 'create';
      const response = await fetch('/custom/api/calendar_categories.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...formData })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save category');
      }

      await fetchCategories();
      setShowAddModal(false);
      setShowEditModal(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/custom/api/calendar_categories.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete category');
      }

      await fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      const response = await fetch('/custom/api/calendar_categories.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: category.id,
          is_active: category.is_active ? 0 : 1
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update status');
      }

      await fetchCategories();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleCPTCode = (cptId) => {
    setFormData(prev => ({
      ...prev,
      linked_cpt_codes: prev.linked_cpt_codes.includes(cptId)
        ? prev.linked_cpt_codes.filter(id => id !== cptId)
        : [...prev.linked_cpt_codes, cptId]
    }));
  };

  // Filter categories
  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (cat.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || cat.category_type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="glass-card p-8">
        <div className="text-center text-gray-600">Loading calendar categories...</div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Calendar Categories</h2>
          <p className="text-gray-600 mt-1">Manage appointment types and link them to billing codes</p>
        </div>

        <PrimaryButton
          onClick={handleAdd}
        >
          + Add Category
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
            placeholder="Search categories..."
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
            <option value="client">Client Appointments</option>
            <option value="clinic">Clinic/Internal</option>
            <option value="holiday">Holidays/Closures</option>
          </select>
        </div>
      </div>

      {/* Categories Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Duration</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Billable</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">CPT Required</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  No categories found
                </td>
              </tr>
            ) : (
              filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{category.name}</div>
                        {category.description && (
                          <div className="text-xs text-gray-500">{category.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      category.category_type === 'client' ? 'bg-blue-100 text-blue-700' :
                      category.category_type === 'clinic' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {category.category_type === 'client' ? 'Client' :
                       category.category_type === 'clinic' ? 'Clinic' : 'Holiday'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-center">{category.default_duration} min</td>
                  <td className="px-4 py-3 text-center">
                    {category.is_billable ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {category.requires_cpt_selection ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(category)}
                      className={`px-3 py-1 text-xs rounded-full ${
                        category.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {category.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <DangerButton
                      onClick={() => handleDelete(category.id)}
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
        title={formData.id ? 'Edit Category' : 'Add Category'}
        size="lg"
      >
        <div className="space-y-6">
          {formError && <ErrorMessage>{formError}</ErrorMessage>}

          {/* Basic Info */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel>Category Name <RequiredAsterisk /></FormLabel>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Office Visit"
                  />
                </div>

                <div>
                  <FormLabel>Category Type</FormLabel>
                  <select
                    value={formData.category_type}
                    onChange={(e) => setFormData({ ...formData, category_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="client">Client Appointment</option>
                    <option value="clinic">Clinic/Internal</option>
                    <option value="holiday">Holiday/Closure</option>
                  </select>
                </div>
              </div>

              <div>
                <FormLabel>Description</FormLabel>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  placeholder="Brief description of this category"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <FormLabel>Color</FormLabel>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <FormLabel>Default Duration (min)</FormLabel>
                  <input
                    type="number"
                    value={formData.default_duration}
                    onChange={(e) => setFormData({ ...formData, default_duration: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <FormLabel>Sort Order</FormLabel>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Settings</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_billable === 1}
                  onChange={(e) => setFormData({ ...formData, is_billable: e.target.checked ? 1 : 0 })}
                  className="mr-2 checkbox"
                />
                <span className="checkbox-label">Billable</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.requires_cpt_selection === 1}
                  onChange={(e) => setFormData({ ...formData, requires_cpt_selection: e.target.checked ? 1 : 0 })}
                  className="mr-2 checkbox"
                />
                <span className="checkbox-label">Requires CPT Code Selection</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.blocks_availability === 1}
                  onChange={(e) => setFormData({ ...formData, blocks_availability: e.target.checked ? 1 : 0 })}
                  className="mr-2 checkbox"
                />
                <span className="checkbox-label">Blocks Provider Availability</span>
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
          </div>

          {/* CPT Code Linking */}
          {formData.requires_cpt_selection === 1 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Linked CPT Codes</h4>
              <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                {cptCodes.length === 0 ? (
                  <p className="text-sm text-gray-500">No active CPT codes available</p>
                ) : (
                  <div className="space-y-2">
                    {cptCodes.map((code) => (
                      <label key={code.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.linked_cpt_codes.includes(code.id)}
                          onChange={() => toggleCPTCode(code.id)}
                          className="mr-2 checkbox"
                        />
                        <span className="checkbox-label">
                          <span className="font-mono font-semibold">{code.code}</span> - {code.description}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Selected CPT codes will be available when scheduling appointments with this category
              </p>
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
              {saving ? 'Saving...' : 'Save Category'}
            </PrimaryButton>
          </Modal.Footer>
        </div>
      </Modal>
    </div>
  );
}

export default CalendarCategories;
