/**
 * Mindline EMHR
 * Reference List Manager - Generic CRUD component for managing lookup lists
 * Handles Sexual Orientation, Gender Identity, Marital Status, etc.
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

function ReferenceListManager({ listType, title, description, apiEndpoint }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', active: true });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchItems();
  }, [listType]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiEndpoint}?type=${listType}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${title.toLowerCase()}`);
      }

      const result = await response.json();
      setItems(result.items || []);
      setError(null);

    } catch (err) {
      console.error(`Error fetching ${title}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({ name: '', description: '', active: true });
    setFormError(null);
    setShowAddModal(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      active: item.active !== undefined ? item.active : true
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setFormError(null);
    setShowDeleteModal(true);
  };

  const handleSaveNew = async () => {
    if (!formData.name || formData.name.trim() === '') {
      setFormError('Name is required');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: listType,
          name: formData.name.trim(),
          description: formData.description?.trim() || '',
          active: formData.active
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to create ${title.toLowerCase()}`);
      }

      await fetchItems();
      setShowAddModal(false);

    } catch (err) {
      console.error(`Error creating ${title}:`, err);
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!formData.name || formData.name.trim() === '') {
      setFormError('Name is required');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      const response = await fetch(apiEndpoint, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: listType,
          id: selectedItem.id,
          name: formData.name.trim(),
          description: formData.description?.trim() || '',
          active: formData.active
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to update ${title.toLowerCase()}`);
      }

      await fetchItems();
      setShowEditModal(false);

    } catch (err) {
      console.error(`Error updating ${title}:`, err);
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      setFormError(null);

      const response = await fetch(`${apiEndpoint}?type=${listType}&id=${selectedItem.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to delete ${title.toLowerCase()}`);
      }

      await fetchItems();
      setShowDeleteModal(false);

    } catch (err) {
      console.error(`Error deleting ${title}:`, err);
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedItem(null);
    setFormData({ name: '', description: '', active: true });
    setFormError(null);
  };

  if (loading) {
    return (
      <div className="glass-card p-8">
        <div className="text-center text-gray-700">Loading {title.toLowerCase()}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8">
        <div className="text-center text-red-600">Error: {error}</div>
        <div className="text-center mt-4">
          <button
            onClick={fetchItems}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add {title.replace(/s$/, '')}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No items defined. Click "Add {title.replace(/s$/, '')}" to create one.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 flex items-center gap-3">
                <div className="font-medium text-gray-900">{item.name}</div>
                {item.description && (
                  <div className="text-sm text-gray-500">- {item.description}</div>
                )}
                {item.active === false && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    Inactive
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(item)}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && createPortal(
        <div className="modal-backdrop">
          <div className="modal-container max-w-lg">
            <div className="modal-header">
              <h2 className="text-2xl font-bold text-gray-800">Add {title.replace(/s$/, '')}</h2>
              <button
                onClick={handleCloseModals}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveNew(); }} className="modal-body">
              {formError && (
                <div className="error-message">
                  {formError}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Heterosexual, Male, Single"
                  className="input-field"
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details or clarification"
                  className="input-field"
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-semibold text-gray-700">Active</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Inactive items won't appear in selection lists
                </p>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  disabled={saving}
                  className="btn-action btn-cancel btn-compact disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-action btn-primary btn-compact disabled:opacity-50"
                >
                  {saving ? 'Creating...' : `Create ${title.replace(/s$/, '')}`}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Modal */}
      {showEditModal && createPortal(
        <div className="modal-backdrop">
          <div className="modal-container max-w-lg">
            <div className="modal-header">
              <h2 className="text-2xl font-bold text-gray-800">Edit {title.replace(/s$/, '')}</h2>
              <button
                onClick={handleCloseModals}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="modal-body">
              {formError && (
                <div className="error-message">
                  {formError}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional details or clarification"
                  className="input-field"
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-semibold text-gray-700">Active</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Inactive items won't appear in selection lists
                </p>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  disabled={saving}
                  className="btn-action btn-cancel btn-compact disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-action btn-primary btn-compact disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && createPortal(
        <div className="modal-backdrop">
          <div className="modal-container max-w-lg">
            <div className="modal-header">
              <h2 className="text-2xl font-bold text-gray-800">Delete {title.replace(/s$/, '')}</h2>
              <button
                onClick={handleCloseModals}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleDelete(); }} className="modal-body">
              {formError && (
                <div className="error-message">
                  {formError}
                </div>
              )}

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete <strong>"{selectedItem?.name}"</strong>?
                </p>

                <p className="text-sm text-gray-600">
                  Note: You cannot delete items that are currently in use by client records.
                </p>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  disabled={saving}
                  className="btn-action btn-cancel btn-compact disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-action btn-danger btn-compact disabled:opacity-50"
                >
                  {saving ? 'Deleting...' : `Delete ${title.replace(/s$/, '')}`}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default ReferenceListManager;
