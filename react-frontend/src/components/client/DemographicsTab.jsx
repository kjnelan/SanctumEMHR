import React, { useState, useEffect } from 'react';
import { updateDemographics, getListOptions, getProviders, getRelatedPersons, saveRelatedPerson, deleteRelatedPerson } from '../../utils/api';
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
    'ethnicity'
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
        ethnicity: referenceLists['ethnicity'] || []
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
      if (data && data.patient && data.patient.age < 18) {
        try {
          const response = await getRelatedPersons(data.patient.pid);
          setGuardians(response.related_persons || []);
        } catch (err) {
          console.error('Failed to load guardians:', err);
        }
      }
    };

    loadGuardians();
  }, [data]);

  if (!data) {
    return (
      <div className="empty-state">
        Loading demographic data...
      </div>
    );
  }

  const { patient } = data;

  const handleEdit = () => {
    // Initialize form data with current patient data
    // Only include fields that exist in the SanctumEMHR database schema
    setFormData({
      // Personal Information
      fname: patient.fname || '',
      mname: patient.mname || '',
      lname: patient.lname || '',
      preferred_name: patient.preferred_name || '',
      DOB: patient.DOB || '',
      sex: patient.sex || '',
      gender_identity: patient.gender_identity || '',
      sexual_orientation: patient.sexual_orientation || '',
      marital_status: patient.marital_status || '',
      ethnicity: patient.ethnicity || '',
      ss: patient.ss || '',

      // Contact Information
      street: patient.street || '',
      street_line_2: patient.street_line_2 || '',
      city: patient.city || '',
      state: patient.state || '',
      postal_code: patient.postal_code || '',
      county: patient.county || '',
      contact_relationship: patient.contact_relationship || '',
      phone_contact: patient.phone_contact || '',
      phone_home: patient.phone_home || '',
      phone_cell: patient.phone_cell || '',
      phone_biz: patient.phone_biz || '',
      email: patient.email || '',

      // Client Status
      status: patient.status || patient.care_team_status || 'active',

      // Payment Type
      payment_type: patient.payment_type || 'insurance',
      custom_session_fee: patient.custom_session_fee || '',

      // Clinician Information
      provider_id: patient.provider_id || patient.providerID || '',

      // Portal Settings
      allow_patient_portal: patient.allow_patient_portal || '',
      cmsportal_login: patient.cmsportal_login || ''
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
      await updateDemographics(patient.pid, formData);

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
      const response = await getRelatedPersons(patient.pid);
      setGuardians(response.related_persons || []);
    } catch (err) {
      setError(err.message || 'Failed to delete guardian');
    }
  };

  const handleSaveGuardian = async (guardianData) => {
    try {
      await saveRelatedPerson({
        patient_id: patient.pid,
        person_id: editingGuardian?.id,
        ...guardianData
      });
      // Reload guardians
      const response = await getRelatedPersons(patient.pid);
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
                    <div className="form-field">
                      <div className="form-field-label">Legal Name</div>
                      <div className="form-field-value">{patient.fname} {patient.mname && patient.mname + ' '}{patient.lname}</div>
                    </div>
                    {renderField('Preferred Name', patient.preferred_name)}
                    {renderField('DOB', patient.DOB)}
                    {renderField('Birth Sex', patient.birth_sex)}
                    {renderField('Gender Identity', patient.gender_identity, null, 'text',
                      dropdownOptions.gender_identity && dropdownOptions.gender_identity.length > 0
                        ? [{ value: '', label: 'Select...' }, ...dropdownOptions.gender_identity]
                        : null
                    )}
                    {renderField('Legal Sex (For billing)', patient.sex)}
                    {renderField('Sexual Orientation', patient.sexual_orientation, null, 'text',
                      dropdownOptions.sexual_orientation && dropdownOptions.sexual_orientation.length > 0
                        ? [{ value: '', label: 'Select...' }, ...dropdownOptions.sexual_orientation]
                        : null
                    )}
                    <div className="form-field">
                      <div className="form-field-label">S.S.</div>
                      <div className="form-field-value">{patient.ss ? '***-**-' + patient.ss.slice(-4) : ''}</div>
                    </div>
                    {renderField('Marital Status', patient.marital_status, null, 'text',
                      dropdownOptions.marital_status && dropdownOptions.marital_status.length > 0
                        ? [{ value: '', label: 'Select...' }, ...dropdownOptions.marital_status]
                        : null
                    )}
                    {renderField('Ethnicity', patient.ethnicity, null, 'text',
                      dropdownOptions.ethnicity && dropdownOptions.ethnicity.length > 0
                        ? [{ value: '', label: 'Select...' }, ...dropdownOptions.ethnicity]
                        : null
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Guardian Information Section - Only for minors */}
          {patient.age < 18 && (
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
                  {renderField('Address', patient.street, 'street')}
                </div>
                {renderField('Address Line 2', patient.street_line_2, 'street_line_2')}
                {renderField('City', patient.city, 'city')}
                {renderField('State', patient.state, 'state', 'text',
                  dropdownOptions.state && dropdownOptions.state.length > 0
                    ? [{ value: '', label: 'Select...' }, ...dropdownOptions.state]
                    : null
                )}
                {renderField('Postal Code', patient.postal_code, 'postal_code')}
                {renderField('County', patient.county, 'county')}
                {renderField('Emergency Contact', patient.contact_relationship, 'contact_relationship')}
                {renderField('Emergency Phone', patient.phone_contact, 'phone_contact', 'tel')}
                {renderField('Home Phone', patient.phone_home, 'phone_home', 'tel')}
                {renderField('Mobile Phone', patient.phone_cell, 'phone_cell', 'tel', null, true)}
                {renderField('Work Phone', patient.phone_biz, 'phone_biz', 'tel')}
                {renderField('Trusted Email', patient.email, 'email', 'email', null, true)}
                {!isEditing && patient.additional_addresses && (
                  <div className="col-span-2 form-field">
                    <div className="form-field-label">Additional Addresses</div>
                    <div className="form-field-value">{patient.additional_addresses}</div>
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
                  {renderField('Client Status', patient.status, null, 'text',
                    [
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                      { value: 'discharged', label: 'Discharged' },
                      { value: 'deceased', label: 'Deceased' }
                    ]
                  )}
                  {renderField('Payment Type', patient.payment_type, null, 'text',
                    [
                      { value: 'insurance', label: 'Insurance' },
                      { value: 'self-pay', label: 'Self-Pay' },
                      { value: 'pro-bono', label: 'Pro Bono' }
                    ]
                  )}
                  {patient.payment_type === 'self-pay' && patient.custom_session_fee && (
                    <div className="form-field">
                      <div className="form-field-label">Custom Session Fee</div>
                      <div className="form-field-value">${parseFloat(patient.custom_session_fee).toFixed(2)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>


          {/* Portal Settings Section */}
          <div className="card-main">
            <h2 className="card-header">Portal Settings</h2>
            <div className="card-inner">
              <div className="grid grid-cols-2 gap-3">
                {isEditing ? (
                  <>
                    {renderField('Allow Client Portal', formData.allow_patient_portal, 'allow_patient_portal', 'text', [
                      { value: '', label: 'Select...' },
                      { value: 'NO', label: 'NO' },
                      { value: 'YES', label: 'YES' }
                    ])}
                    {renderField('CMS Portal Login', formData.cmsportal_login, 'cmsportal_login')}
                  </>
                ) : (
                  <>
                    {renderField('Allow Client Portal', patient.allow_patient_portal)}
                    {renderField('CMS Portal Login', patient.cmsportal_login)}
                  </>
                )}
              </div>
            </div>
          </div>

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

export default DemographicsTab;
