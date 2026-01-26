/**
 * SanctumEMHR EMHR - Facilities & Counseling Rooms Management
 * Manage practice facilities/locations and counseling rooms
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
import { FormLabel } from '../FormLabel';
import { TabButton } from '../TabButton';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { RequiredAsterisk } from '../RequiredAsterisk';
import { ErrorMessage } from '../ErrorMessage';
import { DangerButton } from '../DangerButton';

function Facilities() {
  // Main tab state - 'facilities' or 'rooms'
  const [mainTab, setMainTab] = useState('facilities');

  return (
    <div className="glass-card p-6">
      {/* Main Tab Navigation */}
      <div className="flex border-b border-gray-300 mb-6">
        <TabButton
          active={mainTab === 'facilities'}
          onClick={() => setMainTab('facilities')}
        >
          Facilities
        </TabButton>
        <TabButton
          active={mainTab === 'rooms'}
          onClick={() => setMainTab('rooms')}
        >
          Counseling Rooms
        </TabButton>
      </div>

      {/* Tab Content */}
      {mainTab === 'facilities' ? (
        <FacilitiesTab />
      ) : (
        <CounselingRoomsTab />
      )}
    </div>
  );
}

// ============================================
// FACILITIES TAB COMPONENT
// ============================================
function FacilitiesTab() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    phone: '',
    fax: '',
    website: '',
    email: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country_code: 'United States',
    mail_street: '',
    mail_city: '',
    mail_state: '',
    mail_zip: '',
    color: '#99FFFF',
    pos_code: '11',
    facility_npi: '',
    federal_ein: '',
    tax_id_type: 'EIN',
    facility_taxonomy: '',
    attn: '',
    info: '',
    billing_location: 0,
    accepts_assignment: 0,
    service_location: 1,
    primary_business_entity: 0,
    inactive: 0
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [addressTab, setAddressTab] = useState('physical');

  // POS Code options (common ones for healthcare)
  const posCodeOptions = [
    { value: '11', label: '11: Office' },
    { value: '02', label: '02: Telehealth' },
    { value: '10', label: '10: Telehealth (Patient Home)' },
    { value: '12', label: '12: Home' },
    { value: '21', label: '21: Inpatient Hospital' },
    { value: '22', label: '22: Outpatient Hospital' },
    { value: '23', label: '23: Emergency Room' },
    { value: '31', label: '31: Skilled Nursing Facility' },
    { value: '32', label: '32: Nursing Facility' },
    { value: '49', label: '49: Independent Clinic' },
    { value: '50', label: '50: Federally Qualified Health Center' },
    { value: '71', label: '71: State/Local Public Health Clinic' },
    { value: '81', label: '81: Independent Laboratory' }
  ];

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const response = await fetch('/custom/api/facilities.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch facilities');
      }

      const data = await response.json();
      setFacilities(data.facilities || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({
      id: null,
      name: '',
      phone: '',
      fax: '',
      website: '',
      email: '',
      street: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country_code: 'United States',
      mail_street: '',
      mailing_address_line2: '',
      mail_city: '',
      mail_state: '',
      mail_zip: '',
      mailing_same_as_physical: '1',
      billing_street: '',
      billing_address_line2: '',
      billing_city: '',
      billing_state: '',
      billing_zip: '',
      billing_same_as_physical: '1',
      color: '#99FFFF',
      pos_code: '11',
      facility_npi: '',
      federal_ein: '',
      tax_id_type: 'EIN',
      facility_taxonomy: '',
      attn: '',
      info: '',
      billing_location: 0,
      accepts_assignment: 0,
      service_location: 1,
      primary_business_entity: 0,
      inactive: 0
    });
    setFormError('');
    setAddressTab('physical');
    setShowAddModal(true);
  };

  const handleEdit = async (facility) => {
    try {
      const response = await fetch(`/custom/api/facilities.php?action=get&id=${facility.id}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load facility details');
      }

      const data = await response.json();
      setFormData({
        ...data,
        billing_location: data.billing_location === '1' || data.billing_location === 1 ? 1 : 0,
        accepts_assignment: data.accepts_assignment === '1' || data.accepts_assignment === 1 ? 1 : 0,
        service_location: data.service_location === '1' || data.service_location === 1 ? 1 : 0,
        primary_business_entity: data.primary_business_entity === '1' || data.primary_business_entity === 1 ? 1 : 0,
        inactive: data.inactive === '1' || data.inactive === 1 ? 1 : 0,
        mailing_same_as_physical: data.mailing_same_as_physical === '1' || data.mailing_same_as_physical === 1 ? '1' : '0',
        billing_same_as_physical: data.billing_same_as_physical === '1' || data.billing_same_as_physical === 1 ? '1' : '0'
      });
      setFormError('');
      setAddressTab('physical');
      setShowEditModal(true);
    } catch (err) {
      alert('Failed to load facility details: ' + err.message);
    }
  };

  const handleSaveNew = async () => {
    if (!formData.name?.trim()) {
      setFormError('Facility name is required');
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      const response = await fetch('/custom/api/facilities.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create facility');
      }

      await fetchFacilities();
      setShowAddModal(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!formData.name?.trim()) {
      setFormError('Facility name is required');
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      const response = await fetch('/custom/api/facilities.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update facility');
      }

      await fetchFacilities();
      setShowEditModal(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (facilityId) => {
    if (!confirm('Are you sure you want to deactivate this facility?')) {
      return;
    }

    try {
      const response = await fetch(`/custom/api/facilities.php?id=${facilityId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate facility');
      }

      await fetchFacilities();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setFormError('');
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field) => {
    setFormData(prev => ({ ...prev, [field]: prev[field] ? 0 : 1 }));
  };

  const filteredFacilities = facilities.filter(facility => {
    // Status filter
    const isActive = facility.inactive === '0' || facility.inactive === 0;
    if (statusFilter === 'active' && !isActive) return false;
    if (statusFilter === 'inactive' && isActive) return false;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        facility.name?.toLowerCase().includes(searchLower) ||
        facility.city?.toLowerCase().includes(searchLower) ||
        facility.state?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  if (loading) {
    return (
      <div className="text-center text-gray-700 py-8">Loading facilities...</div>
    );
  }

  if (error) {
    return (
      <div>
        <ErrorMessage className="text-center">Error: {error}</ErrorMessage>
        <div className="text-center mt-4">
          <PrimaryButton onClick={fetchFacilities}>
            Retry
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Facilities</h2>
          <p className="text-gray-600 mt-1">Manage practice locations and facilities</p>
        </div>
        <button
          onClick={handleAdd}
          className="btn-solid btn-solid-green btn-icon"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Facility
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, city, or state..."
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
          All Facilities
        </button>
      </div>

      {/* Facility Count */}
      {filteredFacilities.length > 0 && (
        <div className="mb-4">
          <p className="text-label">
            {filteredFacilities.length} {statusFilter !== 'all' ? statusFilter : ''} facilit{filteredFacilities.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
      )}

      {/* Facility List */}
      {filteredFacilities.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-gray-600 text-lg">No {statusFilter !== 'all' ? statusFilter : ''} facilities found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFacilities.map(facility => (
            <div
              key={facility.id}
              className="card-item"
            >
              {/* Card Header with Name and Status */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-base font-bold text-gray-800 leading-tight">
                    {facility.name}
                  </h4>
                </div>
                <span className={(facility.inactive === '0' || facility.inactive === 0) ? 'badge-solid-success' : 'badge-solid-danger'}>
                  {(facility.inactive === '0' || facility.inactive === 0) ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              {/* Card Body with Facility Details */}
              <div className="space-y-0.5 text-sm text-gray-600 mb-2">
                {facility.street && (
                  <div>
                    <span className="font-semibold">Address:</span> {facility.street}, {facility.city}, {facility.state} {facility.postal_code}
                  </div>
                )}
                {facility.phone && (
                  <div>
                    <span className="font-semibold">Phone:</span> {facility.phone}
                  </div>
                )}
                {facility.fax && (
                  <div>
                    <span className="font-semibold">Fax:</span> {facility.fax}
                  </div>
                )}
                {/* Role Badges */}
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {(facility.billing_location === '1' || facility.billing_location === 1) && (
                    <span className="badge-outline-info text-xs">Billing</span>
                  )}
                  {(facility.service_location === '1' || facility.service_location === 1) && (
                    <span className="badge-outline-success text-xs">Service</span>
                  )}
                  {(facility.primary_business_entity === '1' || facility.primary_business_entity === 1) && (
                    <span className="badge-outline-warning text-xs">Primary</span>
                  )}
                </div>
              </div>

              {/* Card Footer with Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(facility)}
                  className="flex-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Edit
                </button>
                {(facility.inactive === '0' || facility.inactive === 0) && (
                  <DangerButton
                    onClick={() => handleDeactivate(facility.id)}
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
      <FacilityFormModal
        isOpen={showAddModal || showEditModal}
        isEdit={showEditModal}
        formData={formData}
        formError={formError}
        saving={saving}
        addressTab={addressTab}
        setAddressTab={setAddressTab}
        posCodeOptions={posCodeOptions}
        onFormChange={handleFormChange}
        onToggle={handleToggle}
        onSave={showEditModal ? handleSaveEdit : handleSaveNew}
        onClose={handleCloseModals}
      />
    </>
  );
}

// ============================================
// COUNSELING ROOMS TAB COMPONENT
// ============================================
function CounselingRoomsTab() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    option_id: '',
    title: '',
    sort_order: 0,
    is_default: 0,
    notes: ''
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/custom/api/get_rooms.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }

      const data = await response.json();
      setRooms(data.rooms || []);
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
      sort_order: rooms.length + 1,
      is_default: 0,
      notes: ''
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleEdit = (room) => {
    setFormData({
      option_id: room.value || room.option_id,
      title: room.label || room.title,
      sort_order: room.sort_order || 0,
      is_default: room.is_default || 0,
      notes: room.notes || ''
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!formData.option_id?.trim()) {
      setFormError('Room ID is required');
      return;
    }
    if (!formData.title?.trim()) {
      setFormError('Room name is required');
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      const method = showEditModal ? 'PUT' : 'POST';
      const response = await fetch('/custom/api/rooms.php', {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          list_id: 'rooms'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${showEditModal ? 'update' : 'create'} room`);
      }

      await fetchRooms();
      setShowAddModal(false);
      setShowEditModal(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (optionId) => {
    if (!confirm('Are you sure you want to delete this room?')) {
      return;
    }

    try {
      const response = await fetch(`/custom/api/rooms.php?option_id=${optionId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete room');
      }

      await fetchRooms();
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
      <div className="text-center text-gray-700 py-8">Loading rooms...</div>
    );
  }

  if (error) {
    return (
      <div>
        <ErrorMessage className="text-center">Error: {error}</ErrorMessage>
        <div className="text-center mt-4">
          <PrimaryButton onClick={fetchRooms}>
            Retry
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Counseling Rooms</h2>
          <p className="text-gray-600 mt-1">Manage rooms/offices for appointment scheduling</p>
        </div>
        <PrimaryButton onClick={handleAdd}>
          + Add Room
        </PrimaryButton>
      </div>

      {error && (
        <ErrorMessage>{error}</ErrorMessage>
      )}

      {/* Room List */}
      {rooms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No rooms configured</p>
          <p className="text-gray-500 text-sm mt-1">Click "+ Add Room" to create your first counseling room</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Room ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Room Name</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Sort Order</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Default</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Notes</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rooms.map((room, index) => (
                <tr key={room.value || room.option_id || index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-semibold text-gray-900">
                    {room.value || room.option_id}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {room.label || room.title}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-center">
                    {room.sort_order || 0}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {room.is_default === 1 || room.is_default === '1' ? (
                      <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">Yes</span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                    {room.notes || '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleEdit(room)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <DangerButton
                      onClick={() => handleDelete(room.value || room.option_id)}
                    >
                      Delete
                    </DangerButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Room Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={handleCloseModals}
        title={showEditModal ? 'Edit Room' : 'Add Room'}
        size="sm"
      >
        <div className="space-y-4">
          {formError && <ErrorMessage>{formError}</ErrorMessage>}

          <div>
            <FormLabel>Room ID <RequiredAsterisk /></FormLabel>
            <input
              type="text"
              value={formData.option_id}
              onChange={(e) => setFormData({ ...formData, option_id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              className="input-field"
              placeholder="office1"
              disabled={showEditModal}
            />
            <p className="text-xs text-gray-500 mt-1">Unique identifier (no spaces)</p>
          </div>

          <div>
            <FormLabel>Room Name <RequiredAsterisk /></FormLabel>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input-field"
              placeholder="Office 1"
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
              <FormLabel>Default Room</FormLabel>
              <label className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={formData.is_default === 1}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked ? 1 : 0 })}
                  className="checkbox mr-2"
                />
                <span className="checkbox-label">Set as default</span>
              </label>
            </div>
          </div>

          <div>
            <FormLabel>Notes</FormLabel>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field"
              rows={2}
              placeholder="Optional notes about this room..."
            />
          </div>

          <Modal.Footer>
            <SecondaryButton onClick={handleCloseModals} disabled={saving}>
              Cancel
            </SecondaryButton>
            <PrimaryButton onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : (showEditModal ? 'Save Changes' : 'Add Room')}
            </PrimaryButton>
          </Modal.Footer>
        </div>
      </Modal>
    </>
  );
}

// ============================================
// FACILITY FORM MODAL COMPONENT
// ============================================
function FacilityFormModal({
  isOpen,
  isEdit,
  formData,
  formError,
  saving,
  addressTab,
  setAddressTab,
  posCodeOptions,
  onFormChange,
  onToggle,
  onSave,
  onClose
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Facility' : 'Add New Facility'}
      size="lg"
    >
      <div>
          {formError && (
            <div className="error-message mb-4">
              {formError}
            </div>
          )}

          {/* Facility Name */}
          <div className="mb-4">
            <FormLabel>
              Facility Name <RequiredAsterisk />
            </FormLabel>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => onFormChange('name', e.target.value)}
              className="input-field"
              placeholder="Enter facility name"
            />
          </div>

          {/* Address Tabs */}
          <div className="mb-4">
            <div className="flex border-b border-gray-300 mb-4">
                  <TabButton
                    active={addressTab === 'physical'}
                    onClick={() => setAddressTab('physical')}
                  >
                    Physical Address
                  </TabButton>

                  <TabButton
                    active={addressTab === 'mailing'}
                    onClick={() => setAddressTab('mailing')}
                  >
                    Mailing Address
                  </TabButton>

                  <TabButton
                    active={addressTab === 'billing'}
                    onClick={() => setAddressTab('billing')}
                  >
                    Billing Address
                  </TabButton>
            </div>
            {/* Address Fields */}
            {addressTab === 'physical' ? (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <FormLabel>Street Address Line 1</FormLabel>
                  <input
                    type="text"
                    value={formData.street || ''}
                    onChange={(e) => onFormChange('street', e.target.value)}
                    className="input-field"
                    placeholder="123 Main Street"
                  />
                </div>
                <div>
                  <FormLabel>Street Address Line 2</FormLabel>
                  <input
                    type="text"
                    value={formData.address_line2 || ''}
                    onChange={(e) => onFormChange('address_line2', e.target.value)}
                    className="input-field"
                    placeholder="Suite 100"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <FormLabel>City</FormLabel>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => onFormChange('city', e.target.value)}
                      className="input-field"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <FormLabel>State</FormLabel>
                    <input
                      type="text"
                      value={formData.state || ''}
                      onChange={(e) => onFormChange('state', e.target.value)}
                      className="input-field"
                      placeholder="WI"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <FormLabel>Zip Code</FormLabel>
                    <input
                      type="text"
                      value={formData.postal_code || ''}
                      onChange={(e) => onFormChange('postal_code', e.target.value)}
                      className="input-field"
                      placeholder="53092"
                    />
                  </div>
                </div>
              </div>
            ) : addressTab === 'mailing' ? (
              <div className="grid grid-cols-1 gap-4">
                <label className="flex items-center gap-3 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={formData.mailing_same_as_physical === '1'}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked) {
                        onFormChange('mailing_same_as_physical', '1');
                        onFormChange('mail_street', formData.street || '');
                        onFormChange('mailing_address_line2', formData.address_line2 || '');
                        onFormChange('mail_city', formData.city || '');
                        onFormChange('mail_state', formData.state || '');
                        onFormChange('mail_zip', formData.postal_code || '');
                      } else {
                        onFormChange('mailing_same_as_physical', '0');
                      }
                    }}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="text-label">Same as Physical Address</span>
                </label>
                <div>
                  <FormLabel>Mailing Address Line 1</FormLabel>
                  <input
                    type="text"
                    value={formData.mail_street || ''}
                    onChange={(e) => onFormChange('mail_street', e.target.value)}
                    className="input-field"
                    placeholder="Enter mailing street address"
                    disabled={formData.mailing_same_as_physical === '1'}
                  />
                </div>
                <div>
                  <FormLabel>Mailing Address Line 2</FormLabel>
                  <input
                    type="text"
                    value={formData.mailing_address_line2 || ''}
                    onChange={(e) => onFormChange('mailing_address_line2', e.target.value)}
                    className="input-field"
                    placeholder="Suite, Apt, etc."
                    disabled={formData.mailing_same_as_physical === '1'}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <FormLabel>City</FormLabel>
                    <input
                      type="text"
                      value={formData.mail_city || ''}
                      onChange={(e) => onFormChange('mail_city', e.target.value)}
                      className="input-field"
                      placeholder="City"
                      disabled={formData.mailing_same_as_physical === '1'}
                    />
                  </div>
                  <div>
                    <FormLabel>State</FormLabel>
                    <input
                      type="text"
                      value={formData.mail_state || ''}
                      onChange={(e) => onFormChange('mail_state', e.target.value)}
                      className="input-field"
                      placeholder="WI"
                      maxLength={2}
                      disabled={formData.mailing_same_as_physical === '1'}
                    />
                  </div>
                  <div>
                    <FormLabel>Zip Code</FormLabel>
                    <input
                      type="text"
                      value={formData.mail_zip || ''}
                      onChange={(e) => onFormChange('mail_zip', e.target.value)}
                      className="input-field"
                      placeholder="53092"
                      disabled={formData.mailing_same_as_physical === '1'}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <label className="flex items-center gap-3 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={formData.billing_same_as_physical === '1'}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked) {
                        onFormChange('billing_same_as_physical', '1');
                        onFormChange('billing_street', formData.street || '');
                        onFormChange('billing_address_line2', formData.address_line2 || '');
                        onFormChange('billing_city', formData.city || '');
                        onFormChange('billing_state', formData.state || '');
                        onFormChange('billing_zip', formData.postal_code || '');
                      } else {
                        onFormChange('billing_same_as_physical', '0');
                      }
                    }}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                  <span className="text-label">Same as Physical Address</span>
                </label>
                <div>
                  <FormLabel>Billing Address Line 1</FormLabel>
                  <input
                    type="text"
                    value={formData.billing_street || ''}
                    onChange={(e) => onFormChange('billing_street', e.target.value)}
                    className="input-field"
                    placeholder="Enter billing street address"
                    disabled={formData.billing_same_as_physical === '1'}
                  />
                </div>
                <div>
                  <FormLabel>Billing Address Line 2</FormLabel>
                  <input
                    type="text"
                    value={formData.billing_address_line2 || ''}
                    onChange={(e) => onFormChange('billing_address_line2', e.target.value)}
                    className="input-field"
                    placeholder="Suite, Apt, etc."
                    disabled={formData.billing_same_as_physical === '1'}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <FormLabel>City</FormLabel>
                    <input
                      type="text"
                      value={formData.billing_city || ''}
                      onChange={(e) => onFormChange('billing_city', e.target.value)}
                      className="input-field"
                      placeholder="City"
                      disabled={formData.billing_same_as_physical === '1'}
                    />
                  </div>
                  <div>
                    <FormLabel>State</FormLabel>
                    <input
                      type="text"
                      value={formData.billing_state || ''}
                      onChange={(e) => onFormChange('billing_state', e.target.value)}
                      className="input-field"
                      placeholder="WI"
                      maxLength={2}
                      disabled={formData.billing_same_as_physical === '1'}
                    />
                  </div>
                  <div>
                    <FormLabel>Zip Code</FormLabel>
                    <input
                      type="text"
                      value={formData.billing_zip || ''}
                      onChange={(e) => onFormChange('billing_zip', e.target.value)}
                      className="input-field"
                      placeholder="53092"
                      disabled={formData.billing_same_as_physical === '1'}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <FormLabel>Phone</FormLabel>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => onFormChange('phone', e.target.value)}
                className="input-field"
                placeholder="262-345-7229"
              />
            </div>
            <div>
              <FormLabel>Fax</FormLabel>
              <input
                type="tel"
                value={formData.fax || ''}
                onChange={(e) => onFormChange('fax', e.target.value)}
                className="input-field"
                placeholder="262-345-7229"
              />
            </div>
            <div>
              <FormLabel>Website</FormLabel>
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => onFormChange('website', e.target.value)}
                className="input-field"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <FormLabel>Email</FormLabel>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => onFormChange('email', e.target.value)}
                className="input-field"
                placeholder="contact@example.com"
              />
            </div>
          </div>

          {/* Administrative Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <FormLabel>Color</FormLabel>
              <input
                type="color"
                value={formData.color || '#99FFFF'}
                onChange={(e) => onFormChange('color', e.target.value)}
                className="input-field h-10"
              />
            </div>
            <div>
              <FormLabel>POS Code</FormLabel>
              <select
                value={formData.pos_code || '11'}
                onChange={(e) => onFormChange('pos_code', e.target.value)}
                className="input-field"
              >
                {posCodeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FormLabel>Facility NPI</FormLabel>
              <input
                type="text"
                value={formData.facility_npi || ''}
                onChange={(e) => onFormChange('facility_npi', e.target.value)}
                className="input-field"
                placeholder="1811342058"
              />
            </div>
            <div>
              <FormLabel>Tax ID</FormLabel>
              <div className="flex gap-2 items-center">
                <select
                  value={formData.tax_id_type || 'EIN'}
                  onChange={(e) => onFormChange('tax_id_type', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  style={{ width: '90px' }}
                >
                  <option value="EIN">EIN</option>
                  <option value="SSN">SSN</option>
                </select>
                <input
                  type="text"
                  value={formData.federal_ein || ''}
                  onChange={(e) => onFormChange('federal_ein', e.target.value)}
                  className="input-field flex-1"
                  placeholder="566611885"
                />
              </div>
            </div>
            <div>
              <FormLabel>Facility Taxonomy</FormLabel>
              <input
                type="text"
                value={formData.facility_taxonomy || ''}
                onChange={(e) => onFormChange('facility_taxonomy', e.target.value)}
                className="input-field"
                placeholder="101YP2500X"
              />
            </div>
            <div>
              <FormLabel>Attn</FormLabel>
              <input
                type="text"
                value={formData.attn || ''}
                onChange={(e) => onFormChange('attn', e.target.value)}
                className="input-field"
                placeholder="Kenneth J Nelan"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.billing_location === 1}
                onChange={() => onToggle('billing_location')}
                className="w-5 h-5 rounded border-gray-300"
              />
              <span className="text-label">Billing Location</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.accepts_assignment === 1}
                onChange={() => onToggle('accepts_assignment')}
                className="w-5 h-5 rounded border-gray-300"
              />
              <span className="text-label">Accepts Assignment</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.service_location === 1}
                onChange={() => onToggle('service_location')}
                className="w-5 h-5 rounded border-gray-300"
              />
              <span className="text-label">Service Location</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.primary_business_entity === 1}
                onChange={() => onToggle('primary_business_entity')}
                className="w-5 h-5 rounded border-gray-300"
              />
              <span className="text-label">Primary Business Entity</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.inactive === 1}
                onChange={() => onToggle('inactive')}
                className="w-5 h-5 rounded border-gray-300"
              />
              <span className="text-label">Facility Inactive</span>
            </label>
          </div>

          {/* Info Textarea */}
          <div className="mb-4">
            <FormLabel>Info</FormLabel>
            <textarea
              value={formData.info || ''}
              onChange={(e) => onFormChange('info', e.target.value)}
              className="input-field"
              rows={4}
              placeholder="Additional information about this facility..."
            />
          </div>

          <p className="text-sm text-gray-600"><span className="text-red-600">*</span> Required</p>

          <Modal.Footer>
            <SecondaryButton onClick={onClose} disabled={saving}>
              Cancel
            </SecondaryButton>
            <PrimaryButton onClick={onSave} disabled={saving}>
              {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Facility')}
            </PrimaryButton>
          </Modal.Footer>
        </div>
      </Modal>
  );
}

export default Facilities;
