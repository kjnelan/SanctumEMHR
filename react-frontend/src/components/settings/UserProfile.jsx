/**
 * SanctumEMHR EMHR
 * UserProfile - Personal profile settings for clinicians
 * Shows supervisor(s) read-only at top, editable personal info below
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PrimaryButton } from '../PrimaryButton';
import { FormLabel } from '../FormLabel';
import { RequiredAsterisk } from '../RequiredAsterisk';
import { ErrorMessage } from '../ErrorMessage';

function UserProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [supervisors, setSupervisors] = useState([]);

  const [formData, setFormData] = useState({
    fname: '',
    mname: '',
    lname: '',
    title: '',
    suffix: '',
    email: '',
    phone: '',
    phonecell: '',
    state_license_number: '',
    npi: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user's full profile
      const response = await fetch(`/custom/api/users.php?action=get&id=${user.id}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const result = await response.json();
      const userData = result.user;

      if (userData) {
        setFormData({
          fname: userData.fname || '',
          mname: userData.mname || '',
          lname: userData.lname || '',
          title: userData.title || '',
          suffix: userData.suffix || '',
          email: userData.email || '',
          phone: userData.phone || '',
          phonecell: userData.phonecell || '',
          state_license_number: userData.state_license_number || '',
          npi: userData.npi || ''
        });
      }

      // Fetch supervisors for this user
      const supervisorsResponse = await fetch(`/custom/api/users.php?action=user_supervisors&id=${user.id}`, {
        credentials: 'include'
      });

      if (supervisorsResponse.ok) {
        const supervisorsResult = await supervisorsResponse.json();
        setSupervisors(supervisorsResult.supervisors || []);
      }

    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Basic validation
    if (!formData.fname || !formData.lname || !formData.email) {
      setError('First name, last name, and email are required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/custom/api/users.php?action=update_profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: user.id,
          ...formData
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save profile');
      }

      setSuccess('Profile updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="glass-card p-8">
        <div className="text-center text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Supervisor Section - Read Only */}
      {supervisors.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            My Supervisor{supervisors.length > 1 ? 's' : ''}
          </h3>
          <div className="space-y-3">
            {supervisors.map(sup => (
              <div
                key={sup.id}
                className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {sup.fname?.charAt(0)}{sup.lname?.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">
                    {sup.fname} {sup.lname}
                    {sup.title && <span className="text-gray-600 font-normal ml-1">({sup.title})</span>}
                  </div>
                  {sup.email && (
                    <div className="text-sm text-gray-600">{sup.email}</div>
                  )}
                  {(sup.phone || sup.phonecell) && (
                    <div className="text-sm text-gray-600">{sup.phonecell || sup.phone}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Personal Information */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>

        {error && <ErrorMessage className="mb-4">{error}</ErrorMessage>}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FormLabel>First Name <RequiredAsterisk /></FormLabel>
            <input
              type="text"
              value={formData.fname}
              onChange={(e) => handleChange('fname', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <FormLabel>Middle Name</FormLabel>
            <input
              type="text"
              value={formData.mname}
              onChange={(e) => handleChange('mname', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <FormLabel>Last Name <RequiredAsterisk /></FormLabel>
            <input
              type="text"
              value={formData.lname}
              onChange={(e) => handleChange('lname', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <FormLabel>Professional Credentials</FormLabel>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="LCSW, PhD, LPC, etc."
              className="input-field"
            />
          </div>
          <div>
            <FormLabel>Suffix</FormLabel>
            <input
              type="text"
              value={formData.suffix}
              onChange={(e) => handleChange('suffix', e.target.value)}
              placeholder="Jr., Sr., III, etc."
              className="input-field"
            />
          </div>
          <div>
            <FormLabel>State License Number</FormLabel>
            <input
              type="text"
              value={formData.state_license_number}
              onChange={(e) => handleChange('state_license_number', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FormLabel>Email <RequiredAsterisk /></FormLabel>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <FormLabel>Office Phone</FormLabel>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <FormLabel>Cell Phone</FormLabel>
            <input
              type="tel"
              value={formData.phonecell}
              onChange={(e) => handleChange('phonecell', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Professional Information - Read Only for non-admins */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Professional Information</h3>
        <p className="text-sm text-gray-500 mb-4">Contact your administrator to update NPI or billing information.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FormLabel>NPI</FormLabel>
            <input
              type="text"
              value={formData.npi}
              disabled
              className="input-field bg-gray-100 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <PrimaryButton onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </PrimaryButton>
      </div>
    </div>
  );
}

export default UserProfile;
