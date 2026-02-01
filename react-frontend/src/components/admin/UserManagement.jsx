/**
 * SanctumEMHR EMHR
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
import { Modal } from '../Modal';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { FormLabel } from '../FormLabel';
import { RequiredAsterisk } from '../RequiredAsterisk';
import { ErrorMessage } from '../ErrorMessage';
import { DangerButton } from '../DangerButton';

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
    color: '', // Calendar color for providers
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
      color: '',
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
        // Convert to strings to match supervisor IDs from the list
        supervisor_ids = (supervisorsResult.supervisor_ids || []).map(id => String(id));
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
        color: userData.color || '',
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
    if (!formData.username || !formData.password || !formData.fname || !formData.lname || !formData.email) {
      setFormError('Username, password, email, first name, and last name are required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address');
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }
    if (!/[a-z]/.test(formData.password)) {
      setFormError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setFormError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[0-9]/.test(formData.password)) {
      setFormError('Password must contain at least one number');
      return;
    }
    if (!/[^a-zA-Z0-9]/.test(formData.password)) {
      setFormError('Password must contain at least one special character');
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

    // If password is provided, validate it
    if (formData.password && formData.password.trim() !== '') {
      if (formData.password.length < 8) {
        setFormError('Password must be at least 8 characters long');
        return;
      }
      if (!/[a-z]/.test(formData.password)) {
        setFormError('Password must contain at least one lowercase letter');
        return;
      }
      if (!/[A-Z]/.test(formData.password)) {
        setFormError('Password must contain at least one uppercase letter');
        return;
      }
      if (!/[0-9]/.test(formData.password)) {
        setFormError('Password must contain at least one number');
        return;
      }
      if (!/[^a-zA-Z0-9]/.test(formData.password)) {
        setFormError('Password must contain at least one special character');
        return;
      }
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

  const handleUnlock = async (userId) => {
    if (!confirm('Unlock this user account? This will reset failed login attempts and allow them to log in again.')) return;

    try {
      const response = await fetch(`/custom/api/users.php?action=unlock&id=${userId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to unlock account');
      }

      await fetchUsers();
      alert('Account unlocked successfully');

    } catch (err) {
      console.error('Error unlocking account:', err);
      alert('Failed to unlock account: ' + err.message);
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
    // Ensure supervisorId is a string for consistent comparison
    const idAsString = String(supervisorId);

    setFormData(prev => {
      const currentIds = prev.supervisor_ids || [];
      const isSelected = currentIds.includes(idAsString);

      return {
        ...prev,
        supervisor_ids: isSelected
          ? currentIds.filter(id => id !== idAsString)
          : [...currentIds, idAsString]
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
        <ErrorMessage className="text-center">Error: {error}</ErrorMessage>
        <div className="text-center mt-4">

          <PrimaryButton
            onClick={fetchUsers}
          >
            Retry
          </PrimaryButton>

        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">User Management</h2>
          <p className="text-gray-600 mt-1">Manage system users and providers</p>
        </div>
        <button
          onClick={handleAdd}
          className="btn-solid btn-solid-green btn-icon"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, username, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-lg"
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setStatusFilter('active')}
          className={`filter-btn-enhanced ${
            statusFilter === 'active'
              ? 'filter-btn-active-base bg-green-500'
              : 'filter-btn-inactive'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setStatusFilter('inactive')}
          className={`filter-btn-enhanced ${
            statusFilter === 'inactive'
              ? 'filter-btn-active-base bg-red-500'
              : 'filter-btn-inactive'
          }`}
        >
          Inactive
        </button>
        <button
          onClick={() => setStatusFilter('all')}
          className={`filter-btn-enhanced ${
            statusFilter === 'all'
              ? 'filter-btn-active-base bg-blue-500'
              : 'filter-btn-inactive'
          }`}
        >
          All Users
        </button>
      </div>

      {/* User Count */}
      {filteredUsers.length > 0 && (
        <div className="mb-4">
          <p className="text-label">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* User List */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-gray-600 text-lg">No {statusFilter !== 'all' ? statusFilter : ''} users found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map(user => (
            <div
              key={user.id}
              className="card-item"
            >
              {/* Card Header with Name and Status */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-base font-bold text-gray-800 leading-tight">
                    {user.fname} {user.lname}
                  </h4>
                  {user.title && (
                    <p className="text-xs text-gray-600">{user.title}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className={user.active === '1' ? 'badge-solid-success' : 'badge-solid-danger'}>
                    {user.active === '1' ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  {user.is_locked === '1' && (
                    <span className="badge-solid-danger text-xs">
                      LOCKED
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body with User Details */}
              <div className="space-y-0.5 text-sm text-gray-600 mb-2">
                {(user.phonecell || user.phone) && (
                  <div>
                    <span className="font-semibold">Phone:</span> {user.phonecell || user.phone}
                  </div>
                )}
                {user.email && (
                  <div>
                    <span className="font-semibold">Email:</span> {user.email}
                  </div>
                )}
                {/* Role Badges - Only show if at least one is enabled */}
                {(user.is_supervisor === '1' || user.authorized === '1' || user.calendar === '1') && (
                  <div className="flex gap-2 mt-1.5">
                    {user.is_supervisor === '1' && (
                      <span className="badge-outline-warning text-xs">Supervisor</span>
                    )}
                    {user.authorized === '1' && (
                      <span className="badge-outline-success text-xs">Provider</span>
                    )}
                    {user.calendar === '1' && (
                      <span className="badge-outline-info text-xs">Admin</span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer with Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(user)}
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Edit
                </button>
                {user.is_locked === '1' && (
                  <button
                    onClick={() => handleUnlock(user.id)}
                    className="flex-1 px-3 py-1.5 text-sm font-medium text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    Unlock
                  </button>
                )}
                {user.active === '1' && (
                  <DangerButton
                    onClick={() => handleDeactivate(user.id)}
                  >
                    Deactivate
                  </DangerButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <UserFormModal
        isOpen={showAddModal || showEditModal}
        isEdit={showEditModal}
        formData={formData}
        formError={formError}
        saving={saving}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        supervisors={supervisors}
        facilities={facilities}
        onFormChange={handleFormChange}
        onToggleSupervisor={toggleSupervisor}
        onSave={showEditModal ? handleSaveEdit : handleSaveNew}
        onClose={handleCloseModals}
      />
    </div>
  );
}

// Separate modal component to keep main component clean
function UserFormModal({
  isOpen,
  isEdit,
  formData,
  formError,
  saving,
  showPassword,
  setShowPassword,
  supervisors,
  facilities,
  onFormChange,
  onToggleSupervisor,
  onSave,
  onClose
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit User' : 'Add New User'}
      size="lg"
    >
      <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
          {/* Error message */}
          {formError && (
            <div className="error-message">
              {formError}
            </div>
          )}

          <div className="space-y-6">
            {/* Login Credentials */}
            <div className="mb-6">
              <h3 className="section-header-gray">Login Credentials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormLabel>
                    Username <RequiredAsterisk />
                  </FormLabel>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => onFormChange('username', e.target.value)}
                    disabled={isEdit}
                    className="input-field disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <FormLabel>
                    {isEdit ? 'New Password (leave blank to keep current)' : 'Password'} {!isEdit && <RequiredAsterisk />}
                  </FormLabel>
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
              <h3 className="section-header-gray">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormLabel>
                    Legal First Name <RequiredAsterisk />
                  </FormLabel>
                  <input
                    type="text"
                    value={formData.fname}
                    onChange={(e) => onFormChange('fname', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <FormLabel>
                    Middle Name
                  </FormLabel>
                  <input
                    type="text"
                    value={formData.mname}
                    onChange={(e) => onFormChange('mname', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <FormLabel>
                    Legal Last Name <RequiredAsterisk />
                  </FormLabel>
                  <input
                    type="text"
                    value={formData.lname}
                    onChange={(e) => onFormChange('lname', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <FormLabel>
                    Professional Credentials
                  </FormLabel>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => onFormChange('title', e.target.value)}
                    placeholder="MD, LCSW, PhD, etc."
                    className="input-field"
                  />
                </div>
                <div>
                  <FormLabel>
                    Suffix
                  </FormLabel>
                  <input
                    type="text"
                    value={formData.suffix}
                    onChange={(e) => onFormChange('suffix', e.target.value)}
                    placeholder="Jr., Sr., III, etc."
                    className="input-field"
                  />
                </div>
                <div>
                  <FormLabel>
                    State License Number
                  </FormLabel>
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
              <h3 className="section-header-gray">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormLabel>
                    Email <RequiredAsterisk />
                  </FormLabel>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => onFormChange('email', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <FormLabel>
                    Office Phone
                  </FormLabel>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => onFormChange('phone', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <FormLabel>
                    Cell Phone
                  </FormLabel>
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
              <h3 className="section-header-gray">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormLabel>
                    NPI
                  </FormLabel>
                  <input
                    type="text"
                    value={formData.npi}
                    onChange={(e) => onFormChange('npi', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <FormLabel>
                    Federal Tax ID
                  </FormLabel>
                  <input
                    type="text"
                    value={formData.federaltaxid}
                    onChange={(e) => onFormChange('federaltaxid', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <FormLabel>
                    Taxonomy Code
                  </FormLabel>
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
              <h3 className="section-header-gray">Access Control</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.authorized}
                    onChange={(e) => onFormChange('authorized', e.target.checked)}
                    className="checkbox"
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
                    className="checkbox"
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
                    className="checkbox"
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
                    className="checkbox"
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
                    className="checkbox"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active
                  </span>
                </label>
              </div>
            </div>

            {/* Calendar Settings - Only show for providers */}
            {formData.authorized && (
              <div className="mb-6">
                <h3 className="section-header-gray">Calendar Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormLabel>
                      Calendar Color
                    </FormLabel>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.color || '#3B82F6'}
                        onChange={(e) => onFormChange('color', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.color || ''}
                        onChange={(e) => onFormChange('color', e.target.value)}
                        placeholder="#3B82F6"
                        className="input-field flex-1"
                        maxLength={7}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      This color will be used for all appointments on the calendar
                    </p>
                  </div>
                  <div>
                    <FormLabel>Color Preview</FormLabel>
                    <div
                      className="h-10 rounded-lg border border-gray-200 flex items-center px-3 text-sm font-medium text-gray-800"
                      style={{ backgroundColor: `${formData.color || '#3B82F6'}B3` }}
                    >
                      {formData.fname || 'Provider'} {formData.lname?.charAt(0) || 'N'}.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Organization */}
            <div className="mb-6">
              <h3 className="section-header-gray">Organization</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormLabel>
                    Supervisors (select one or more)
                  </FormLabel>
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
                              checked={formData.supervisor_ids.includes(String(sup.id))}
                              onChange={() => onToggleSupervisor(sup.id)}
                              className="checkbox"
                            />
                            <span className="checkbox-label">
                              {sup.fname} {sup.lname} {sup.title && `(${sup.title})`}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <FormLabel>
                    Default Facility
                  </FormLabel>
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
              <FormLabel>
                Notes
              </FormLabel>
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
          <Modal.Footer>
            <SecondaryButton type="button" onClick={onClose} disabled={saving}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create User')}
            </PrimaryButton>
          </Modal.Footer>
        </form>
      </Modal>
  );
}

export default UserManagement;
