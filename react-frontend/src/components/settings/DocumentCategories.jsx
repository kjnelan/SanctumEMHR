/**
 * Mindline EMHR
 * Document Categories Management Component
 * Admin interface for managing document categories
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

function DocumentCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', parent_id: null });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/custom/api/document_categories.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const result = await response.json();
      setCategories(result.categories || []);
      setError(null);

    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Build hierarchical tree structure
  const buildCategoryTree = (categories) => {
    const tree = [];
    const categoryMap = {};

    // Create a map of categories by ID
    categories.forEach(cat => {
      categoryMap[cat.id] = { ...cat, children: [] };
    });

    // Build the tree
    categories.forEach(cat => {
      if (cat.parent && categoryMap[cat.parent]) {
        categoryMap[cat.parent].children.push(categoryMap[cat.id]);
      } else {
        tree.push(categoryMap[cat.id]);
      }
    });

    return tree;
  };

  // Flatten tree for display with indentation levels
  const flattenTree = (tree, level = 0) => {
    let flat = [];
    tree.forEach(node => {
      flat.push({ ...node, level });
      if (node.children && node.children.length > 0) {
        flat = flat.concat(flattenTree(node.children, level + 1));
      }
    });
    return flat;
  };

  // Get categories that can be parents (exclude self and descendants)
  const getAvailableParents = () => {
    if (!selectedCategory) {
      return categories;
    }

    // When editing, exclude the category itself and its descendants
    const excludeIds = new Set([selectedCategory.id]);
    const tree = buildCategoryTree(categories);

    const addDescendants = (node) => {
      if (node.children) {
        node.children.forEach(child => {
          excludeIds.add(child.id);
          addDescendants(child);
        });
      }
    };

    const findAndExclude = (nodes) => {
      nodes.forEach(node => {
        if (node.id === selectedCategory.id) {
          addDescendants(node);
        }
        if (node.children) {
          findAndExclude(node.children);
        }
      });
    };

    findAndExclude(tree);

    return categories.filter(cat => !excludeIds.has(cat.id));
  };

  const handleAdd = () => {
    setFormData({ name: '', parent_id: null });
    setFormError(null);
    setShowAddModal(true);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    // Ensure parent_id is a number or null
    setFormData({
      name: category.name,
      parent_id: category.parent ? parseInt(category.parent) : null
    });
    setFormError(null);
    setShowEditModal(true);
  };

  const handleDeleteClick = (category) => {
    setSelectedCategory(category);
    setFormError(null);
    setShowDeleteModal(true);
  };

  const handleSaveNew = async () => {
    if (!formData.name || formData.name.trim() === '') {
      setFormError('Category name is required');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      const response = await fetch('/custom/api/document_categories.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          parent_id: formData.parent_id || null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create category');
      }

      // Success - refresh and close
      await fetchCategories();
      setShowAddModal(false);

    } catch (err) {
      console.error('Error creating category:', err);
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!formData.name || formData.name.trim() === '') {
      setFormError('Category name is required');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      const response = await fetch('/custom/api/document_categories.php', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: selectedCategory.id,
          name: formData.name.trim(),
          parent_id: formData.parent_id || null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update category');
      }

      // Success - refresh and close
      await fetchCategories();
      setShowEditModal(false);

    } catch (err) {
      console.error('Error updating category:', err);
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      setFormError(null);

      const response = await fetch(`/custom/api/document_categories.php?id=${selectedCategory.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete category');
      }

      // Success - refresh and close
      await fetchCategories();
      setShowDeleteModal(false);

    } catch (err) {
      console.error('Error deleting category:', err);
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedCategory(null);
    setFormData({ name: '', parent_id: null });
    setFormError(null);
  };

  if (loading) {
    return (
      <div className="glass-card p-8">
        <div className="text-center text-gray-700">Loading categories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8">
        <div className="text-center text-red-600">Error: {error}</div>
        <div className="text-center mt-4">
          <button
            onClick={fetchCategories}
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
          <h2 className="text-2xl font-semibold text-gray-800">Document Categories</h2>
          <p className="text-gray-600 mt-1">Manage categories for organizing client documents</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No categories defined. Click "Add Category" to create one.
        </div>
      ) : (
        <div className="space-y-2">
          {flattenTree(buildCategoryTree(categories)).map(category => (
            <div
              key={category.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ marginLeft: `${category.level * 2}rem` }}
            >
              <div className="flex-1 flex items-center gap-2">
                {category.level > 0 && (
                  <span className="text-gray-400">
                    {'└─'}
                  </span>
                )}
                <div className="font-medium text-gray-900">{category.name}</div>
                {category.children && category.children.length > 0 && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {category.children.length} {category.children.length === 1 ? 'subcategory' : 'subcategories'}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteClick(category)}
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
            {/* Header */}
            <div className="modal-header">
              <h2 className="text-2xl font-bold text-gray-800">Add Category</h2>
              <button
                onClick={handleCloseModals}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSaveNew(); }} className="modal-body">
              {/* Error message */}
              {formError && (
                <div className="error-message">
                  {formError}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Consent Forms, Insurance Documents"
                  className="input-field"
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Parent Category (Optional)
                </label>
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({
                      ...formData,
                      parent_id: value ? parseInt(value, 10) : null
                    });
                  }}
                  className="input-field"
                >
                  <option value="">None (Top Level)</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a parent to create a subcategory
                </p>
              </div>

              {/* Action Buttons */}
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
                  {saving ? 'Creating...' : 'Create Category'}
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
            {/* Header */}
            <div className="modal-header">
              <h2 className="text-2xl font-bold text-gray-800">Edit Category</h2>
              <button
                onClick={handleCloseModals}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="modal-body">
              {/* Error message */}
              {formError && (
                <div className="error-message">
                  {formError}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Parent Category (Optional)
                </label>
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({
                      ...formData,
                      parent_id: value ? parseInt(value, 10) : null
                    });
                  }}
                  className="input-field"
                >
                  <option value="">None (Top Level)</option>
                  {getAvailableParents().map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a parent to make this a subcategory
                </p>
              </div>

              {/* Action Buttons */}
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
            {/* Header */}
            <div className="modal-header">
              <h2 className="text-2xl font-bold text-gray-800">Delete Category</h2>
              <button
                onClick={handleCloseModals}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleDelete(); }} className="modal-body">
              {/* Error message */}
              {formError && (
                <div className="error-message">
                  {formError}
                </div>
              )}

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete the category <strong>"{selectedCategory?.name}"</strong>?
                </p>

                <p className="text-sm text-gray-600">
                  Note: You cannot delete a category that has documents or subcategories.
                </p>
              </div>

              {/* Action Buttons */}
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
                  {saving ? 'Deleting...' : 'Delete Category'}
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

export default DocumentCategories;
