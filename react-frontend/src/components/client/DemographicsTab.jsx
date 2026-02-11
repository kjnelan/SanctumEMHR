import React, { useState, useEffect } from 'react';
import { updateDemographics, getRelatedPersons, saveRelatedPerson, deleteRelatedPerson } from '../../services/ClientService';
import { getListOptions, getProviders } from '../../utils/api';
import { portalAdminEnable, portalAdminResetPassword, portalAdminRevoke } from '../../services/PortalService';
import useReferenceLists from '../../hooks/useReferenceLists';
import { RequiredAsterisk } from '../shared/RequiredAsterisk';

function DemographicsTab({ data, onDataUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [providers, setProviders] = useState([]);
  const [guardians, setGuardians] = useState([]);
  const [showGuardianModal, setShowGuardianModal] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState(null);

  // Fetch reference lists for dropdowns
  const { data: referenceLists, loading: listsLoading } = useReferenceLists([
    'sexual-orientation',
    'gender-identity',
    'marital-status',
    'client-status',
    'ethnicity',
    'race'
  ]);

  // Load reference lists into dropdown options when they're available
  useEffect(() => {
    if (!listsLoading && referenceLists) {
      setDropdownOptions({
        ...dropdownOptions,
        sexual_orientation: referenceLists['sexual-orientation'] || [],
        gender_identity: referenceLists['gender-identity'] || [],
        marital_status: referenceLists['marital-status'] || [],
        status: referenceLists['client-status'] || [],
        ethnicity: referenceLists['ethnicity'] || [],
        race: referenceLists['race'] || []
      });
    }
  }, [referenceLists, listsLoading]);

  // Load other dropdown options (sex, state, etc.) from old system
  useEffect(() => {
    const loadOtherOptions = async () => {
      try {
        // Fetch remaining options that aren't in reference lists yet
        const [sexOptions, stateOptions, paymentTypeOptions] = await Promise.all([
          getListOptions('sex'),
          getListOptions('state'),
          getListOptions('payment_type')
        ]);

        setDropdownOptions(prev => ({
          ...prev,
          sex: sexOptions.options || [],
          state: stateOptions.options || [],
          payment_type: paymentTypeOptions.options || []
        }));
      } catch (err) {
        console.error('Failed to load dropdown options:', err);
      }
    };

    const loadProviders = async () => {
      try {
        const response = await getProviders();
        setProviders(response.providers || []);
      } catch (err) {
        console.error('Failed to load providers:', err);
      }
    };

    loadOtherOptions();
    loadProviders();
  }, []);

  // Load guardians for minors
  useEffect(() => {
    const loadGuardians = async () => {
      if (data && data.client && data.client.age < 18) {
        try {
          const response = await getRelatedPersons(data.client.pid);
          setGuardians(response.related_persons || []);
        } catch (err) {
          console.error('Failed to load guardians:', err);
        }
      }
    };

    loadGuardians();
  }, [data]);

  // Format date for display (e.g., "Mar 15, 1985")
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split(/[-T]/);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (!data) {
    return (
      <div className="empty-state">
        Loading demographic data...
      </div>
    );
  }

  const { client } = data;

  const handleEdit = () => {
    // Initialize form data with current client data
    // Only include fields that exist in the SanctumEMHR database schema
    setFormData({
      // Personal Information
      fname: client.fname || '',
      mname: client.mname || '',
      lname: client.lname || '',
      preferred_name: client.preferred_name || '',
      DOB: client.DOB || '',
      sex: client.sex || '',
      gender_identity: client.gender_identity || '',
      sexual_orientation: client.sexual_orientation || '',
      marital_status: client.marital_status || '',
      ethnicity: client.ethnicity || '',
      race: client.race || '',
      ss: client.ss || '',

      // Contact Information
      street: client.street || '',
      street_line_2: client.street_line_2 || '',
      city: client.city || '',
      state: client.state || '',
      postal_code: client.postal_code || '',
      county: client.county || '',
      contact_relationship: client.contact_relationship || '',
      phone_contact: client.phone_contact || '',
      phone_home: client.phone_home || '',
      phone_cell: client.phone_cell || '',
      phone_biz: client.phone_biz || '',
      email: client.email || '',

      // Client Status
      status: client.status || client.care_team_status || 'active',

      // Payment Type
      payment_type: client.payment_type || 'insurance',
      custom_session_fee: client.custom_session_fee || '',

      // Clinician Information
      provider_id: client.provider_id || client.providerID || '',

      // Portal Settings
      portal_access: client.portal_access || '',
      portal_username: client.portal_username || ''
    });
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
    setError(null);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.fname || !formData.lname) {
        throw new Error('First name and last name are required');
      }

      if (!formData.email) {
        throw new Error('Trusted Email is required');
      }

      if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new Error('Invalid email format');
      }

      if (!formData.phone_cell) {
        throw new Error('Mobile Phone is required');
      }

      if (!formData.status) {
        throw new Error('Client Status is required');
      }

      if (!formData.payment_type) {
        throw new Error('Payment Type is required');
      }

      // Call API to update demographics
      await updateDemographics(client.pid, formData);

      // Refresh the data
      if (onDataUpdate) {
        await onDataUpdate();
      }

      setIsEditing(false);
      setFormData({});
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Guardian management handlers
  const handleAddGuardian = () => {
    setEditingGuardian(null);
    setShowGuardianModal(true);
  };

  const handleEditGuardian = (guardian) => {
    setEditingGuardian(guardian);
    setShowGuardianModal(true);
  };

  const handleDeleteGuardian = async (guardian) => {
    if (!window.confirm(`Are you sure you want to remove ${guardian.first_name} ${guardian.last_name} as a guardian?`)) {
      return;
    }

    try {
      await deleteRelatedPerson(guardian.relation_id);
      // Reload guardians
      const response = await getRelatedPersons(client.pid);
      setGuardians(response.related_persons || []);
    } catch (err) {
      setError(err.message || 'Failed to delete guardian');
    }
  };

  const handleSaveGuardian = async (guardianData) => {
    try {
      await saveRelatedPerson({
        client_id: client.pid,
        person_id: editingGuardian?.id,
        ...guardianData
      });
      // Reload guardians
      const response = await getRelatedPersons(client.pid);
      setGuardians(response.related_persons || []);
      setShowGuardianModal(false);
      setEditingGuardian(null);
    } catch (err) {
      throw new Error(err.message || 'Failed to save guardian');
    }
  };

  const renderField = (label, value, fieldName, type = 'text', options = null, required = false) => {
    const labelClass = required ? "form-field-label required-field-label" : "form-field-label";

    if (isEditing && fieldName) {
      if (options) {
        // Render select dropdown
        return (
          <div className="form-field">
            <div className={labelClass}>{label}{required && <RequiredAsterisk />}</div>
            <select
              value={formData[fieldName] || ''}
              onChange={(e) => handleChange(fieldName, e.target.value)}
              className="input-md"
              required={required}
            >
              {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        );
      } else {
        // Render text input
        return (
          <div className="form-field">
            <div className={labelClass}>{label}{required && <RequiredAsterisk />}</div>
            <input
              type={type}
              value={formData[fieldName] || ''}
              onChange={(e) => handleChange(fieldName, e.target.value)}
              className="input-md"
              required={required}
            />
          </div>
        );
      }
    } else {
      // Render read-only view
      // If options are provided, look up the label for the value
      let displayValue = value || '';
      if (options && value) {
        const matchingOption = options.find(opt => opt.value === value);
        if (matchingOption) {
          displayValue = matchingOption.label;
        }
      }
      return (
        <div className="form-field">
          <div className="form-field-label">{label}</div>
          <div className="form-field-value">{displayValue}</div>
        </div>
      );
    }
  };

  return (
    <div>
      {/* Edit/Save/Cancel buttons */}
      <div className="flex justify-end mb-4 space-x-2">
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="btn-solid btn-solid-blue"
          >
            Edit Demographics
          </button>
        ) : (
          <>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="btn-solid btn-solid-gray disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-solid btn-solid-green disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message mb-4">
          {error}
        </div>
      )}

      {/* Required fields legend - shown when editing */}
      {isEditing && (
        <div className="mb-4 px-4 py-2 bg-purple-50 border-l-4 border-purple-700 rounded">
          <p className="text-sm text-purple-900">
            <span className="required-field-label">*</span> Required fields are marked with an asterisk and displayed in <span className="required-field-label">purple</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Personal Information Section */}
          <div className="card-main">
            <h2 className="card-header">Personal Information</h2>
            <div className="card-inner">
              <div className="grid grid-cols-2 gap-3">
                {isEditing ? (
                  <>
                    {renderField('First Name', formData.fname, 'fname', 'text', null, true)}
                    {renderField('Middle Name', formData.mname, 'mname')}
                    {renderField('Last Name', formData.lname, 'lname', 'text', null, true)}
                    {renderField('Preferred Name', formData.preferred_name, 'preferred_name')}
                    {renderField('DOB', formData.DOB, 'DOB', 'date')}
                    {renderField('Legal Sex (For billing purposes ONLY)', formData.sex, 'sex', 'text',
                      dropdownOptions.sex && dropdownOptions.sex.length > 0
                        ? [{ value: '', label: 'Select...' }, ...dropdownOptions.sex]
                        : [{ value: '', label: 'Select...' }, { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }]
                    )}
                    {renderField('Gender Identity', formData.gender_identity, 'gender_identity', 'text',
                      dropdownOptions.gender_identity && dropdownOptions.gender_identity.length > 0
                        ? [{ value: '', label: 'Select...' }, ...dropdownOptions.gender_identity]
                        : null
                    )}
                    {renderField('Sexual Orientation', formData.sexual_orientation, 'sexual_orientation', 'text',
                      dropdownOptions.sexual_orientation && dropdownOptions.sexual_orientation.length > 0
                        ? [{ value: '', label: 'Select...' }, ...dropdownOptions.sexual_orientation]
                        : null
                    )}
                    {renderField('Marital Status', formData.marital_status, 'marital_status', 'text',
                      dropdownOptions.marital_status && dropdownOptions.marital_status.length > 0
                        ? [{ value: '', label: 'Select...' }, ...dropdownOptions.marital_status]
                        : null
                    )}
                    {renderField('Ethnicity', formData.ethnicity, 'ethnicity', 'text',
                      dropdownOptions.ethnicity && dropdownOptions.ethnicity.length > 0
                        ? [{ value: '', label: 'Select...' }, ...dropdownOptions.ethnicity]
                        : null
                    )}
                    {renderField('Race', formData.race, 'race', 'text',
                      dropdownOptions.race && dropdownOptions.race.length > 0
                        ? [{ value: '', label: 'Select...' }, ...dropdownOptions.race]
                        : null
                    )}
                    <div className="form-field">
                      <div className="form-field-label">S.S.</div>
                      <input
                        type="text"
                        value={formData.ss || ''}
                        onChange={(e) => handleChange('ss', e.target.value)}
                        placeholder="XXX-XX-XXXX"
                        maxLength="11"
                        className="input-md"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {renderField('First Name', client.fname)}
                    {renderField('Middle Name', client.mname)}
                    {renderField('Last Name', client.lname)}
                    {renderField('Preferred Name', client.preferred_name)}
                    {renderField('DOB', formatDate(client.DOB))}
                    {renderField('Legal Sex (For billing purposes ONLY)', client.sex, null, 'text',
                      [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }, { value: 'unknown', label: 'Unknown' }]
                    )}
                    {renderField('Gender Identity', client.gender_identity_text || client.gender_identity)}
                    {renderField('Sexual Orientation', client.sexual_orientation_text || client.sexual_orientation)}
                    {renderField('Marital Status', client.marital_status_text || client.marital_status)}
                    {renderField('Ethnicity', client.ethnicity_text || client.ethnicity)}
                    {renderField('Race', client.race_text || client.race)}
                    <div className="form-field">
                      <div className="form-field-label">S.S.</div>
                      <div className="form-field-value">{client.ss ? '***-**-' + client.ss.slice(-4) : ''}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Guardian Information Section - Only for minors */}
          {client.age < 18 && (
            <div className="card-main">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-header">Guardian Information</h2>
                <button
                  onClick={handleAddGuardian}
                  className="btn-solid btn-solid-green btn-sm"
                >
                  + Add Guardian
                </button>
              </div>
              <div className="card-inner">
                {guardians.length === 0 ? (
                  <div className="empty-state">
                    No guardians added yet. Click "Add Guardian" to add one.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {guardians.map((guardian, index) => (
                      <div key={guardian.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="item-title">
                            {guardian.first_name} {guardian.middle_name} {guardian.last_name}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditGuardian(guardian)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteGuardian(guardian)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="field-label">Relationship:</span> {guardian.role}
                          </div>
                          {guardian.phone && (
                            <div>
                              <span className="field-label">Phone:</span> {guardian.phone}
                            </div>
                          )}
                          {guardian.email && (
                            <div className="col-span-2">
                              <span className="field-label">Email:</span> {guardian.email}
                            </div>
                          )}
                          {guardian.street && (
                            <div className="col-span-2">
                              <span className="field-label">Address:</span> {guardian.street}
                              {guardian.city && `, ${guardian.city}`}
                              {guardian.state && `, ${guardian.state}`}
                              {guardian.postal_code && ` ${guardian.postal_code}`}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Information Section */}
          <div className="card-main">
            <h2 className="card-header">Contact Information</h2>
            <div className="card-inner">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  {renderField('Address', client.street, 'street')}
                </div>
                {renderField('Address Line 2', client.street_line_2, 'street_line_2')}
                {renderField('City', client.city, 'city')}
                {renderField('State', client.state, 'state', 'text',
                  dropdownOptions.state && dropdownOptions.state.length > 0
                    ? [{ value: '', label: 'Select...' }, ...dropdownOptions.state]
                    : null
                )}
                {renderField('Postal Code', client.postal_code, 'postal_code')}
                {renderField('County', client.county, 'county')}
                {renderField('Emergency Contact', client.contact_relationship, 'contact_relationship')}
                {renderField('Emergency Phone', client.phone_contact, 'phone_contact', 'tel')}
                {renderField('Home Phone', client.phone_home, 'phone_home', 'tel')}
                {renderField('Mobile Phone', client.phone_cell, 'phone_cell', 'tel', null, true)}
                {renderField('Work Phone', client.phone_biz, 'phone_biz', 'tel')}
                {renderField('Trusted Email', client.email, 'email', 'email', null, true)}
                {!isEditing && client.additional_addresses && (
                  <div className="col-span-2 form-field">
                    <div className="form-field-label">Additional Addresses</div>
                    <div className="form-field-value">{client.additional_addresses}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Client Status Section */}
          <div className="card-main">
            <h2 className="card-header">Client Status</h2>
            <div className="card-inner">
              {isEditing ? (
                <div className="space-y-3">
                  {renderField('Client Status', formData.status, 'status', 'text',
                    [
                      { value: '', label: 'Select...' },
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                      { value: 'discharged', label: 'Discharged' },
                      { value: 'deceased', label: 'Deceased' }
                    ],
                    true
                  )}
                  {renderField('Payment Type', formData.payment_type, 'payment_type', 'text',
                    [
                      { value: '', label: 'Select...' },
                      { value: 'insurance', label: 'Insurance' },
                      { value: 'self-pay', label: 'Self-Pay' },
                      { value: 'pro-bono', label: 'Pro Bono' }
                    ],
                    true
                  )}
                  {formData.payment_type === 'self-pay' && (
                    renderField('Custom Session Fee ($)', formData.custom_session_fee, 'custom_session_fee', 'number', null, {
                      step: '0.01',
                      placeholder: '120.00'
                    })
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {renderField('Client Status', client.status, null, 'text',
                    [
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                      { value: 'discharged', label: 'Discharged' },
                      { value: 'deceased', label: 'Deceased' }
                    ]
                  )}
                  {renderField('Payment Type', client.payment_type, null, 'text',
                    [
                      { value: 'insurance', label: 'Insurance' },
                      { value: 'self-pay', label: 'Self-Pay' },
                      { value: 'pro-bono', label: 'Pro Bono' }
                    ]
                  )}
                  {client.payment_type === 'self-pay' && client.custom_session_fee && (
                    <div className="form-field">
                      <div className="form-field-label">Custom Session Fee</div>
                      <div className="form-field-value">${parseFloat(client.custom_session_fee).toFixed(2)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>


          {/* Portal Settings Section */}
          <PortalSettingsCard
            clientId={client.pid}
            portalAccess={client.portal_access}
            portalUsername={client.portal_username}
            onUpdate={onDataUpdate}
          />

        </div>
      </div>

      {/* Guardian Modal */}
      {showGuardianModal && (
        <GuardianModal
          guardian={editingGuardian}
          stateOptions={dropdownOptions.state || []}
          onSave={handleSaveGuardian}
          onCancel={() => {
            setShowGuardianModal(false);
            setEditingGuardian(null);
          }}
        />
      )}
    </div>
  );
}

// Guardian Modal Component
function GuardianModal({ guardian, stateOptions, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    first_name: guardian?.first_name || '',
    middle_name: guardian?.middle_name || '',
    last_name: guardian?.last_name || '',
    role: guardian?.role || '',
    phone: guardian?.phone || '',
    email: guardian?.email || '',
    street: guardian?.street || '',
    city: guardian?.city || '',
    state: guardian?.state || '',
    postal_code: guardian?.postal_code || '',
    notes: guardian?.notes || ''
  });
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      // Validate required fields
      if (!formData.first_name || !formData.last_name || !formData.role) {
        throw new Error('First name, last name, and relationship are required');
      }

      if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new Error('Invalid email format');
      }

      await onSave(formData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <h2 className="card-header text-2xl">
            {guardian ? 'Edit Guardian' : 'Add Guardian'}
          </h2>

          {error && (
            <div className="error-message mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-field">
                <label className="form-field-label">First Name *</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  className="input-md"
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-field-label">Middle Name</label>
                <input
                  type="text"
                  value={formData.middle_name}
                  onChange={(e) => handleChange('middle_name', e.target.value)}
                  className="input-md"
                />
              </div>

              <div className="form-field">
                <label className="form-field-label">Last Name *</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  className="input-md"
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-field-label">Relationship *</label>
                <select
                  value={formData.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  className="input-md"
                  required
                >
                  <option value="">Select...</option>
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Grandmother">Grandmother</option>
                  <option value="Grandfather">Grandfather</option>
                  <option value="Aunt">Aunt</option>
                  <option value="Uncle">Uncle</option>
                  <option value="Foster Parent">Foster Parent</option>
                  <option value="Legal Guardian">Legal Guardian</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-field-label">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="input-md"
                />
              </div>

              <div className="form-field">
                <label className="form-field-label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="input-md"
                />
              </div>

              <div className="col-span-2 form-field">
                <label className="form-field-label">Street Address</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => handleChange('street', e.target.value)}
                  className="input-md"
                />
              </div>

              <div className="form-field">
                <label className="form-field-label">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="input-md"
                />
              </div>

              <div className="form-field">
                <label className="form-field-label">State</label>
                <select
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="input-md"
                >
                  <option value="">Select...</option>
                  {stateOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label className="form-field-label">Postal Code</label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                  className="input-md"
                />
              </div>

              <div className="col-span-2 form-field">
                <label className="form-field-label">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  className="input-md"
                  rows="3"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="btn-solid btn-solid-gray"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn-solid btn-solid-green"
              >
                {isSaving ? 'Saving...' : 'Save Guardian'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Portal Settings Card - Manages client portal access from staff side
function PortalSettingsCard({ clientId, portalAccess, portalUsername, onUpdate }) {
  const [showSetup, setShowSetup] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [username, setUsername] = useState(portalUsername || '');
  const [tempPassword, setTempPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isEnabled = portalAccess === 'YES' || portalAccess === '1' || portalAccess === 1;

  const handleEnable = async () => {
    if (!username.trim() || !tempPassword.trim()) {
      setError('Username and temporary password are required');
      return;
    }
    if (tempPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await portalAdminEnable(clientId, username.trim(), tempPassword);
      setSuccess('Portal access enabled. Client can log in at /mycare with the credentials provided.');
      setShowSetup(false);
      setTempPassword('');
      if (onUpdate) onUpdate();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!tempPassword.trim() || tempPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await portalAdminResetPassword(clientId, tempPassword);
      setSuccess('Portal password has been reset. Client will be required to change it on next login.');
      setShowReset(false);
      setTempPassword('');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm('Are you sure you want to revoke portal access for this client? They will no longer be able to log in.')) return;
    setLoading(true);
    setError('');
    try {
      await portalAdminRevoke(clientId);
      setSuccess('Portal access has been revoked.');
      if (onUpdate) onUpdate();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-main">
      <h2 className="card-header">Client Portal</h2>

      {success && <div className="success-message">{success}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="card-inner">
        {isEnabled ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="badge-sm badge-light-success">Portal Enabled</span>
                <p className="text-sm text-gray-600 mt-2">Username: <span className="font-mono font-semibold">{portalUsername}</span></p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setShowReset(true); setShowSetup(false); setError(''); setTempPassword(''); }}
                className="btn-solid btn-solid-blue text-xs px-3 py-1.5"
                disabled={loading}
              >
                Reset Password
              </button>
              <button
                onClick={handleRevoke}
                className="btn-solid btn-solid-gray text-xs px-3 py-1.5"
                disabled={loading}
              >
                Revoke Access
              </button>
            </div>

            {showReset && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">Set New Temporary Password</p>
                <input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="Temporary password (min 8 chars)"
                  className="input-md mb-2"
                />
                <p className="text-xs text-gray-500 mb-2">Client will be required to change this on next login.</p>
                <div className="flex gap-2">
                  <button onClick={handleResetPassword} disabled={loading} className="btn-solid btn-solid-blue text-xs px-3 py-1.5">
                    {loading ? 'Saving...' : 'Reset Password'}
                  </button>
                  <button onClick={() => setShowReset(false)} className="btn-solid btn-solid-gray text-xs px-3 py-1.5">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="badge-sm badge-light-neutral">Portal Not Enabled</span>
              <p className="text-sm text-gray-500 mt-2">Enable portal access to allow this client to view appointments and update their profile online.</p>
            </div>

            {!showSetup ? (
              <button
                onClick={() => { setShowSetup(true); setError(''); }}
                className="btn-solid btn-solid-green text-xs px-3 py-1.5"
              >
                Enable Portal Access
              </button>
            ) : (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">Set Up Portal Credentials</p>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Portal Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. jsmith or client's email"
                      className="input-md"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Temporary Password</label>
                    <input
                      type="text"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="input-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">Client will be required to change this on first login.</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleEnable} disabled={loading} className="btn-solid btn-solid-green text-xs px-3 py-1.5">
                    {loading ? 'Enabling...' : 'Enable Access'}
                  </button>
                  <button onClick={() => setShowSetup(false)} className="btn-solid btn-solid-gray text-xs px-3 py-1.5">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DemographicsTab;
