/**
 * SanctumEMHR - Insurance Providers Management
 * Manage insurance companies/payers for billing
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
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { FormLabel } from '../FormLabel';
import { RequiredAsterisk } from '../RequiredAsterisk';
import { ErrorMessage } from '../ErrorMessage';
import { DangerButton } from '../DangerButton';

const insuranceTypes = [
  { value: 'commercial', label: 'Commercial' },
  { value: 'medicare', label: 'Medicare' },
  { value: 'medicaid', label: 'Medicaid' },
  { value: 'tricare', label: 'TRICARE' },
  { value: 'self_pay', label: 'Self-Pay' },
  { value: 'other', label: 'Other' }
];

const usStates = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

const emptyFormData = {
  id: null,
  name: '',
  payer_id: '',
  phone: '',
  fax: '',
  email: '',
  website: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  zip: '',
  claims_address: '',
  claims_phone: '',
  claims_email: '',
  insurance_type: 'commercial',
  is_active: 1
};

function InsuranceProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showInactive, setShowInactive] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({ ...emptyFormData });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, [showInactive]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const url = showInactive
        ? '/custom/api/insurance_providers.php?include_inactive=true'
        : '/custom/api/insurance_providers.php';

      const response = await fetch(url, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch insurance providers');
      }

      const data = await response.json();
      setProviders(data.providers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({ ...emptyFormData });
    setFormError('');
    setShowAddModal(true);
  };

  const handleEdit = (provider) => {
    setFormData({
      id: provider.id,
      name: provider.name || '',
      payer_id: provider.payer_id || '',
      phone: provider.phone || '',
      fax: provider.fax || '',
      email: provider.email || '',
      website: provider.website || '',
      address_line1: provider.address_line1 || '',
      address_line2: provider.address_line2 || '',
      city: provider.city || '',
      state: provider.state || '',
      zip: provider.zip || '',
      claims_address: provider.claims_address || '',
      claims_phone: provider.claims_phone || '',
      claims_email: provider.claims_email || '',
      insurance_type: provider.insurance_type || 'commercial',
      is_active: provider.is_active
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleSave = async () => {
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Insurance company name is required');
      return;
    }

    try {
      setSaving(true);
      const action = formData.id ? 'update' : 'create';
      const response = await fetch('/custom/api/insurance_providers.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...formData })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save insurance provider');
      }

      await fetchProviders();
      setShowAddModal(false);
      setShowEditModal(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this insurance provider? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/custom/api/insurance_providers.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete insurance provider');
      }

      await fetchProviders();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (provider) => {
    try {
      const response = await fetch('/custom/api/insurance_providers.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: provider.id,
          is_active: provider.is_active ? 0 : 1
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update status');
      }

      await fetchProviders();
    } catch (err) {
      setError(err.message);
    }
  };

  const getTypeLabel = (typeValue) => {
    const type = insuranceTypes.find(t => t.value === typeValue);
    return type ? type.label : typeValue;
  };

  const getTypeColor = (typeValue) => {
    switch (typeValue) {
      case 'medicare': return 'bg-blue-100 text-blue-700';
      case 'medicaid': return 'bg-purple-100 text-purple-700';
      case 'tricare': return 'bg-green-100 text-green-700';
      case 'self_pay': return 'bg-gray-100 text-gray-700';
      case 'commercial': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Filter providers
  const filteredProviders = providers
    .filter(provider => {
      const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (provider.payer_id && provider.payer_id.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter === 'all' || provider.insurance_type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  if (loading) {
    return (
      <div className="glass-card p-8">
        <div className="text-center text-gray-600">Loading insurance providers...</div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Insurance Providers</h2>
          <p className="text-gray-600 mt-1">Manage insurance companies and payers</p>
        </div>

        <PrimaryButton onClick={handleAdd}>
          + Add Insurance Provider
        </PrimaryButton>
      </div>

      {error && (
        <ErrorMessage>
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-800 hover:text-red-900">×</button>
        </ErrorMessage>
      )}

      {/* Filters */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <input
            type="text"
            placeholder="Search by name or payer ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            {insuranceTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="checkbox mr-2"
            />
            <span className="text-sm text-gray-700">Show inactive providers</span>
          </label>
        </div>
      </div>

      {/* Insurance Providers Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Payer ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Location</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProviders.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  No insurance providers found
                </td>
              </tr>
            ) : (
              filteredProviders.map((provider) => (
                <tr key={provider.id} className={`hover:bg-gray-50 ${!provider.is_active ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {provider.name}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-700">
                    {provider.payer_id || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(provider.insurance_type)}`}>
                      {getTypeLabel(provider.insurance_type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {provider.phone || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {provider.city && provider.state
                      ? `${provider.city}, ${provider.state}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(provider)}
                      className={`px-3 py-1 text-xs rounded-full ${
                        provider.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {provider.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleEdit(provider)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <DangerButton onClick={() => handleDelete(provider.id)}>
                      Delete
                    </DangerButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal || showEditModal}
        onClose={() => { setShowAddModal(false); setShowEditModal(false); }}
        title={formData.id ? 'Edit Insurance Provider' : 'Add Insurance Provider'}
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {formError && <ErrorMessage>{formError}</ErrorMessage>}

          {/* Basic Information */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FormLabel>Company Name <RequiredAsterisk /></FormLabel>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Blue Cross Blue Shield"
                />
              </div>

              <div>
                <FormLabel>Payer ID</FormLabel>
                <input
                  type="text"
                  value={formData.payer_id}
                  onChange={(e) => setFormData({ ...formData, payer_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="00060"
                />
                <p className="text-xs text-gray-500 mt-1">EDI Payer ID for electronic claims</p>
              </div>

              <div>
                <FormLabel>Insurance Type</FormLabel>
                <select
                  value={formData.insurance_type}
                  onChange={(e) => setFormData({ ...formData, insurance_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {insuranceTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel>Phone</FormLabel>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(800) 555-1234"
                />
              </div>

              <div>
                <FormLabel>Fax</FormLabel>
                <input
                  type="tel"
                  value={formData.fax}
                  onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(800) 555-1235"
                />
              </div>

              <div>
                <FormLabel>Email</FormLabel>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="provider@insurance.com"
                />
              </div>

              <div>
                <FormLabel>Website</FormLabel>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://www.insurance.com"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FormLabel>Street Address</FormLabel>
                <input
                  type="text"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Insurance Way"
                />
              </div>

              <div className="col-span-2">
                <FormLabel>Address Line 2</FormLabel>
                <input
                  type="text"
                  value={formData.address_line2}
                  onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Suite 100"
                />
              </div>

              <div>
                <FormLabel>City</FormLabel>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FormLabel>State</FormLabel>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">—</option>
                    {usStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <FormLabel>ZIP</FormLabel>
                  <input
                    type="text"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="12345"
                    maxLength={10}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Claims Information */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Claims Submission</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <FormLabel>Claims Mailing Address</FormLabel>
                <textarea
                  value={formData.claims_address}
                  onChange={(e) => setFormData({ ...formData, claims_address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="P.O. Box 12345&#10;Claims Department&#10;City, State ZIP"
                />
              </div>

              <div>
                <FormLabel>Claims Phone</FormLabel>
                <input
                  type="tel"
                  value={formData.claims_phone}
                  onChange={(e) => setFormData({ ...formData, claims_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(800) 555-CLMS"
                />
              </div>

              <div>
                <FormLabel>Claims Email</FormLabel>
                <input
                  type="email"
                  value={formData.claims_email}
                  onChange={(e) => setFormData({ ...formData, claims_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="claims@insurance.com"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active === 1}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
                className="mr-2 checkbox"
              />
              <span className="checkbox-label">Active</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">Inactive providers won't appear in client insurance dropdowns</p>
          </div>
        </div>

        <Modal.Footer>
          <SecondaryButton
            onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
            disabled={saving}
          >
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Insurance Provider'}
          </PrimaryButton>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default InsuranceProviders;
