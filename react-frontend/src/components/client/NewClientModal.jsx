import React, { useState } from 'react';
import { createClient } from '../../utils/api';
import { FormLabel } from '../FormLabel';
import { RequiredAsterisk } from '../RequiredAsterisk';

function NewClientModal({ onClose, onClientCreated }) {
  const [formData, setFormData] = useState({
    fname: '',
    mname: '',
    lname: '',
    DOB: '',
    sex: '',
    ss: '',
    street: '',
    city: '',
    state: '',
    postal_code: '',
    phone_cell: '',
    phone_home: '',
    email: '',
    care_team_status: 'active'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.fname || !formData.lname) {
        throw new Error('First name and last name are required');
      }

      if (!formData.DOB) {
        throw new Error('Date of birth is required');
      }

      if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new Error('Invalid email format');
      }

      // Call API to create client
      const result = await createClient(formData);

      // Call callback with new client ID
      if (onClientCreated && result.patient_id) {
        onClientCreated(result.patient_id);
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create client');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container modal-lg">
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-2xl font-bold text-gray-800">New Client</h2>
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
        <form onSubmit={handleSubmit} className="modal-body">
          {/* Error message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Personal Information */}
          <div className="mb-6">
            <h3 className="section-header-gray">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FormLabel>
                  First Name <RequiredAsterisk />
                </FormLabel>
                <input
                  type="text"
                  required
                  value={formData.fname}
                  onChange={(e) => handleChange('fname', e.target.value)}
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
                  onChange={(e) => handleChange('mname', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <FormLabel>
                  Last Name <RequiredAsterisk />
                </FormLabel>
                <input
                  type="text"
                  required
                  value={formData.lname}
                  onChange={(e) => handleChange('lname', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <FormLabel>
                  Date of Birth <RequiredAsterisk />
                </FormLabel>
                <input
                  type="date"
                  required
                  value={formData.DOB}
                  onChange={(e) => handleChange('DOB', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <FormLabel>
                  Sex
                </FormLabel>
                <select
                  value={formData.sex}
                  onChange={(e) => handleChange('sex', e.target.value)}
                  className="input-field"
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <FormLabel>
                  Social Security Number
                </FormLabel>
                <input
                  type="text"
                  value={formData.ss}
                  onChange={(e) => handleChange('ss', e.target.value)}
                  placeholder="XXX-XX-XXXX"
                  maxLength="11"
                  className="input-field"
                />
              </div>

              <div>
                <FormLabel>
                  Status
                </FormLabel>
                <select
                  value={formData.care_team_status}
                  onChange={(e) => handleChange('care_team_status', e.target.value)}
                  className="input-field"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="discharged">Discharged</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <h3 className="section-header-gray">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <FormLabel>
                  Street Address
                </FormLabel>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => handleChange('street', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <FormLabel>
                  City
                </FormLabel>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <FormLabel>
                  State
                </FormLabel>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  maxLength="2"
                  placeholder="CA"
                  className="input-field"
                />
              </div>

              <div>
                <FormLabel>
                  Postal Code
                </FormLabel>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <FormLabel>
                  Mobile Phone
                </FormLabel>
                <input
                  type="tel"
                  value={formData.phone_cell}
                  onChange={(e) => handleChange('phone_cell', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <FormLabel>
                  Home Phone
                </FormLabel>
                <input
                  type="tel"
                  value={formData.phone_home}
                  onChange={(e) => handleChange('phone_home', e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="md:col-span-2">
                <FormLabel>
                  Email
                </FormLabel>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="btn-action btn-cancel btn-compact disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-action btn-primary btn-compact disabled:opacity-50"
            >
              {isSaving ? 'Creating Client...' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewClientModal;
