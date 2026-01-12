/**
 * Mindline EMHR
 * User Management Component
 * Admin interface for managing system users and providers
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React, { useState, useEffect } from 'react';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fname: '',
    mname: '',
    lname: '',
    title: '', // Professional credentials
    suffix: '',
    email: '',
    phone: '',
    phonecell: '',
    npi: '',
    federaltaxid: '',
    taxonomy: '',
    state_license_number: '',
    supervisor_id: '',
    facility_id: '',
    authorized: false, // Is provider
    active: true,
    calendar: false, // Is admin
    portal_user: false,
    notes: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchSupervisors();
    fetchFacilities();
  }, [statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/custom/api/users.php?action=list&status=${statusFilter}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();
      setUsers(result.users || []);
      setError(null);

    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const response = await fetch('/custom/api/users.php?action=supervisors', {
        credentials: 'include'
      });

      if (!response.ok) return;

      const result = await response.json();
      setSupervisors(result.supervisors || []);

    } catch (err) {
      console.error('Error fetching supervisors:', err);
    }
  };

  const fetchFacilities = async () => {
    try {
      const response = await fetch('/custom/api/users.php?action=facilities', {
        credentials: 'include'
      });

      if (!response.ok) return;

      const result = await response.json();
      setFacilities(result.facilities || []);

    } catch (err) {
      console.error('Error fetching facilities:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      fname: '',
      mname: '',
      lname: '',
      title: '',
      suffix: '',
      email: '',
      phone: '',
      phonecell: '',
      npi: '',
      federaltaxid: '',
      taxonomy: '',
      state_license_number: '',
      supervisor_id: '',
      facility_id: '',
      authorized: false,
      active: true,
      calendar: false,
      portal_user: false,
      notes: ''
    });
    setShowPassword(false);
    setFormError(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEdit = async (user) => {
    setSelectedUser(user);

    // Fetch full user details
    try {
      const response = await fetch(`/custom/api/users.php?action=get&id=${user.id}`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch user details');

      const result = await response.json();
      const userData = result.user;

      setFormData({
        id: userData.id,
        username: userData.username || '',
        password: '', // Don't populate password
        fname: userData.fname || '',
        mname: userData.mname || '',
        lname: userData.lname || '',
        title: userData.title || '',
        suffix: userData.suffix || '',
        email: userData.email || '',
        phone: userData.phone || '',
        phonecell: userData.phonecell || '',
        npi: userData.npi || '',
        federaltaxid: userData.federaltaxid || '',
        taxonomy: userData.taxonomy || '',
        state_license_number: userData.state_license_number || '',
        supervisor_id: userData.supervisor_id || '',
        facility_id: userData.facility_id || '',
        authorized: userData.authorized === '1' || userData.authorized === 1,
        active: userData.active === '1' || userData.active === 1,
        calendar: userData.calendar === '1' || userData.calendar === 1,
        portal_user: userData.portal_user === '1' || userData.portal_user === 1,
        notes: userData.notes || ''
      });

      setShowEditModal(true);

    } catch (err) {
      console.error('Error fetching user details:', err);
      setFormError(err.message);
    }
  };

  const handleSaveNew = async () => {
    // Validation
    if (!formData.username || !formData.password || !formData.fname || !formData.lname) {
      setFormError('Username, password, first name, and last name are required');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      const response = await fetch('/custom/api/users.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      await fetchUsers();
      setShowAddModal(false);
      resetForm();

    } catch (err) {
      console.error('Error creating user:', err);
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    // Validation
    if (!formData.fname || !formData.lname) {
      setFormError('First name and last name are required');
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      const response = await fetch('/custom/api/users.php', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user');
      }

      await fetchUsers();
      setShowEditModal(false);
      resetForm();

    } catch (err) {
      console.error('Error updating user:', err);
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (userId) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
      const response = await fetch(`/custom/api/users.php?id=${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to deactivate user');

      await fetchUsers();

    } catch (err) {
      console.error('Error deactivating user:', err);
      alert('Failed to deactivate user: ' + err.message);
    }
  };

  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedUser(null);
    resetForm();
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.fname?.toLowerCase().includes(searchLower) ||
      user.lname?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="glass-card p-8">
        <div className="text-center text-gray-700">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8">
        <div className="text-center text-red-600">Error: {error}</div>
        <div className="text-center mt-4">
          <button
            onClick={fetchUsers}
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
          <h2 className="text-2xl font-semibold text-gray-800">User Management</h2>
          <p className="text-gray-600 mt-1">Manage system users and providers</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Users</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* User List */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No users found
        </div>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map(user => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold bg-blue-600"
                >
                  {user.fname?.[0]}{user.lname?.[0]}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {user.fname} {user.lname}
                    {user.title && <span className="text-sm text-gray-600 ml-2">{user.title}</span>}
                  </div>
                  <div className="text-sm text-gray-600">
                    {user.username} • {user.email || 'No email'}
                    {user.authorized === '1' && <span className="ml-2 text-green-600">• Provider</span>}
                    {user.calendar === '1' && <span className="ml-2 text-blue-600">• Admin</span>}
                  </div>
                </div>
                <div className="text-sm">
                  {user.active === '1' ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">Active</span>
                  ) : (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">Inactive</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(user)}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Edit
                </button>
                {user.active === '1' && (
                  <button
                    onClick={() => handleDeactivate(user.id)}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <UserFormModal
          isEdit={showEditModal}
          formData={formData}
          formError={formError}
          saving={saving}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          supervisors={supervisors}
          facilities={facilities}
          onFormChange={handleFormChange}
          onSave={showEditModal ? handleSaveEdit : handleSaveNew}
          onClose={handleCloseModals}
        />
      )}
    </div>
  );
}

// Separate modal component to keep main component clean
function UserFormModal({
  isEdit,
  formData,
  formError,
  saving,
  showPassword,
  setShowPassword,
  supervisors,
  facilities,
  onFormChange,
  onSave,
  onClose
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 my-8">
        <div className="p-6 max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {isEdit ? 'Edit User' : 'Add New User'}
          </h2>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {formError}
            </div>
          )}

          <div className="space-y-6">
            {/* Login Credentials */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Login Credentials</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => onFormChange('username', e.target.value)}
                    disabled={isEdit}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isEdit ? 'New Password (leave blank to keep current)' : 'Password *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => onFormChange('password', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Personal Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legal First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fname}
                    onChange={(e) => onFormChange('fname', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={formData.mname}
                    onChange={(e) => onFormChange('mname', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Legal Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.lname}
                    onChange={(e) => onFormChange('lname', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Professional Credentials
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => onFormChange('title', e.target.value)}
                    placeholder="MD, LCSW, PhD, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Suffix
                  </label>
                  <input
                    type="text"
                    value={formData.suffix}
                    onChange={(e) => onFormChange('suffix', e.target.value)}
                    placeholder="Jr., Sr., III, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State License Number
                  </label>
                  <input
                    type="text"
                    value={formData.state_license_number}
                    onChange={(e) => onFormChange('state_license_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Contact Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => onFormChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Office Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => onFormChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cell Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phonecell}
                    onChange={(e) => onFormChange('phonecell', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Professional Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NPI
                  </label>
                  <input
                    type="text"
                    value={formData.npi}
                    onChange={(e) => onFormChange('npi', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Federal Tax ID
                  </label>
                  <input
                    type="text"
                    value={formData.federaltaxid}
                    onChange={(e) => onFormChange('federaltaxid', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taxonomy Code
                  </label>
                  <input
                    type="text"
                    value={formData.taxonomy}
                    onChange={(e) => onFormChange('taxonomy', e.target.value)}
                    placeholder="207Q00000X"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Organization */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Organization</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supervisor
                  </label>
                  <select
                    value={formData.supervisor_id}
                    onChange={(e) => onFormChange('supervisor_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">None</option>
                    {supervisors.map(sup => (
                      <option key={sup.id} value={sup.id}>
                        {sup.fname} {sup.lname} {sup.title && `(${sup.title})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Facility
                  </label>
                  <select
                    value={formData.facility_id}
                    onChange={(e) => onFormChange('facility_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">None</option>
                    {facilities.map(fac => (
                      <option key={fac.id} value={fac.id}>
                        {fac.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Access Control */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Access Control</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.authorized}
                    onChange={(e) => onFormChange('authorized', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Provider (Can create clinical notes)
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.calendar}
                    onChange={(e) => onFormChange('calendar', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Administrator (Access to Settings)
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.portal_user}
                    onChange={(e) => onFormChange('portal_user', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Portal Access
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => onFormChange('active', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active
                  </span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => onFormChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional information about this user..."
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onSave}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create User')}
            </button>
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-400 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserManagement;
