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
import { createPortal } from 'react-dom';

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
    supervisor_id: '', // Legacy field - kept for compatibility
    supervisor_ids: [], // Array of supervisor IDs for multi-supervisor support
    facility_id: '',
    authorized: false, // Is provider
    is_supervisor: false, // Is supervisor
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
      supervisor_ids: [],
      facility_id: '',
      authorized: false,
      is_supervisor: false,
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
    console.log('handleEdit called for user:', user);
    setSelectedUser(user);
    setFormError(null);

    // Fetch full user details
    try {
      console.log('Fetching user details for ID:', user.id);
      const response = await fetch(`/custom/api/users.php?action=get&id=${user.id}`, {
        credentials: 'include'
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers.get('content-type'));

      // Check if response is empty
      const text = await response.text();
      console.log('Response text:', text);

      if (!text) {
        throw new Error('Empty response from server. Check server logs.');
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr);
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch user details');
      }

      const userData = result.user;

      if (!userData) {
        throw new Error('No user data in response');
      }

      // Fetch supervisors for this user from junction table
      const supervisorsResponse = await fetch(`/custom/api/users.php?action=user_supervisors&id=${user.id}`, {
        credentials: 'include'
      });

      let supervisor_ids = [];
      if (supervisorsResponse.ok) {
        const supervisorsResult = await supervisorsResponse.json();
        supervisor_ids = supervisorsResult.supervisor_ids || [];
      }

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
        supervisor_id: userData.supervisor_id || '', // Legacy field
        supervisor_ids: supervisor_ids, // Multi-supervisor support
        facility_id: userData.facility_id || '',
        authorized: userData.authorized === '1' || userData.authorized === 1,
        is_supervisor: userData.is_supervisor === '1' || userData.is_supervisor === 1,
        active: userData.active === '1' || userData.active === 1,
        calendar: userData.calendar === '1' || userData.calendar === 1,
        portal_user: userData.portal_user === '1' || userData.portal_user === 1,
        notes: userData.notes || ''
      });

      setShowEditModal(true);

    } catch (err) {
      console.error('Error fetching user details:', err);
      alert('Failed to load user details: ' + err.message + '\n\nCheck the browser console and server logs for more details.');
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
      await fetchSupervisors(); // Refetch in case new user is a supervisor
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
      await fetchSupervisors(); // Refetch in case supervisor status changed
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

  const toggleSupervisor = (supervisorId) => {
    setFormData(prev => {
      const currentIds = prev.supervisor_ids || [];
      const isSelected = currentIds.includes(supervisorId);

      return {
        ...prev,
        supervisor_ids: isSelected
          ? currentIds.filter(id => id !== supervisorId)
          : [...currentIds, supervisorId]
      };
    });
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
      {(showAddModal || showEditModal) && createPortal(
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
        />,
        document.body
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
    <div className="modal-backdrop">
      <div className="modal-container modal-lg">
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Edit User' : 'Add New User'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="modal-body">
          {/* Error message */}
          {formError && (
            <div className="error-message">
              {formError}
            </div>
          )}

          <div className="space-y-6">
            {/* Login Credentials */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Login Credentials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => onFormChange('username', e.target.value)}
                    disabled={isEdit}
                    className="input-field disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {isEdit ? 'New Password (leave blank to keep current)' : 'Password'} {!isEdit && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => onFormChange('password', e.target.value)}
                      className="input-field"
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
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Legal First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fname}
                    onChange={(e) => onFormChange('fname', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={formData.mname}
                    onChange={(e) => onFormChange('mname', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Legal Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lname}
                    onChange={(e) => onFormChange('lname', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Professional Credentials
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => onFormChange('title', e.target.value)}
                    placeholder="MD, LCSW, PhD, etc."
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Suffix
                  </label>
                  <input
                    type="text"
                    value={formData.suffix}
                    onChange={(e) => onFormChange('suffix', e.target.value)}
                    placeholder="Jr., Sr., III, etc."
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    State License Number
                  </label>
                  <input
                    type="text"
                    value={formData.state_license_number}
                    onChange={(e) => onFormChange('state_license_number', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => onFormChange('email', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Office Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => onFormChange('phone', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cell Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phonecell}
                    onChange={(e) => onFormChange('phonecell', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    NPI
                  </label>
                  <input
                    type="text"
                    value={formData.npi}
                    onChange={(e) => onFormChange('npi', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Federal Tax ID
                  </label>
                  <input
                    type="text"
                    value={formData.federaltaxid}
                    onChange={(e) => onFormChange('federaltaxid', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Taxonomy Code
                  </label>
                  <input
                    type="text"
                    value={formData.taxonomy}
                    onChange={(e) => onFormChange('taxonomy', e.target.value)}
                    placeholder="207Q00000X"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Access Control */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Access Control</h3>
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
                    checked={formData.is_supervisor}
                    onChange={(e) => onFormChange('is_supervisor', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Supervisor (Can supervise other providers)
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

            {/* Organization */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Organization</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Supervisors (select one or more)
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-white">
                    {supervisors.length === 0 ? (
                      <div className="text-sm text-gray-500 italic">
                        No supervisors available. Mark users as supervisors in Access Control.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {supervisors.map(sup => (
                          <label key={sup.id} className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.supervisor_ids.includes(sup.id)}
                              onChange={() => toggleSupervisor(sup.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">
                              {sup.fname} {sup.lname} {sup.title && `(${sup.title})`}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Default Facility
                  </label>
                  <select
                    value={formData.facility_id}
                    onChange={(e) => onFormChange('facility_id', e.target.value)}
                    className="input-field"
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

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => onFormChange('notes', e.target.value)}
                rows={3}
                className="input-field"
                placeholder="Additional information about this user..."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
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
              {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserManagement;
