import { useState, useEffect } from 'react';
import { portalGetProfile, portalUpdateProfile } from '../../services/PortalService';
import PortalLayout from './PortalLayout';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC'
];

function PortalProfile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await portalGetProfile();
        setProfile(data.profile);
        setFormData(data.profile);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await portalUpdateProfile(formData);
      setProfile({ ...profile, ...formData });
      setEditing(false);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile);
    setEditing(false);
    setError('');
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderField = (label, value) => (
    <div className="form-field">
      <div className="form-field-label">{label}</div>
      <div className="form-field-value">{value || '-'}</div>
    </div>
  );

  const renderEditField = (label, field, type = 'text', options = null) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">{label}</label>
      {options ? (
        <select
          value={formData[field] || ''}
          onChange={(e) => handleChange(field, e.target.value)}
          className="input-md"
        >
          <option value="">Select...</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={formData[field] || ''}
          onChange={(e) => handleChange(field, e.target.value)}
          className="input-md"
        />
      )}
    </div>
  );

  return (
    <PortalLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
          <p className="text-gray-600 mt-1">View and update your personal information.</p>
        </div>
        {!editing && !loading && (
          <button onClick={() => setEditing(true)} className="btn-action btn-sm btn-primary">
            Edit Profile
          </button>
        )}
      </div>

      {success && <div className="success-message mb-4">{success}</div>}
      {error && <div className="error-message mb-4">{error}</div>}

      {loading ? (
        <div className="sanctum-glass-main p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 mx-auto" style={{ border: '2px solid rgba(107, 154, 196, 0.3)', borderTopColor: 'rgba(107, 154, 196, 0.9)' }}></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Personal Info (read-only) */}
          <div className="sanctum-glass-main p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h2>
            <p className="text-xs text-gray-500 mb-4">Contact your provider to update your name or date of birth.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField('First Name', profile.firstName)}
              {renderField('Middle Name', profile.middleName)}
              {renderField('Last Name', profile.lastName)}
              {renderField('Date of Birth', profile.dateOfBirth)}
              {renderField('Sex', profile.sex)}
              {renderField('Provider', profile.providerName)}
              {renderField('Facility', profile.facilityName)}
            </div>
          </div>

          {/* Contact Info (editable) */}
          <div className="sanctum-glass-main p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h2>
            {editing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderEditField('Preferred Name', 'preferredName')}
                {renderEditField('Email', 'email', 'email')}
                {renderEditField('Mobile Phone', 'phoneMobile', 'tel')}
                {renderEditField('Home Phone', 'phoneHome', 'tel')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField('Preferred Name', profile.preferredName)}
                {renderField('Email', profile.email)}
                {renderField('Mobile Phone', profile.phoneMobile)}
                {renderField('Home Phone', profile.phoneHome)}
              </div>
            )}
          </div>

          {/* Address (editable) */}
          <div className="sanctum-glass-main p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Address</h2>
            {editing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderEditField('Address Line 1', 'addressLine1')}
                {renderEditField('Address Line 2', 'addressLine2')}
                {renderEditField('City', 'city')}
                {renderEditField('State', 'state', 'text', US_STATES)}
                {renderEditField('ZIP Code', 'zip')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField('Address Line 1', profile.addressLine1)}
                {renderField('Address Line 2', profile.addressLine2)}
                {renderField('City', profile.city)}
                {renderField('State', profile.state)}
                {renderField('ZIP Code', profile.zip)}
              </div>
            )}
          </div>

          {/* Emergency Contact (editable) */}
          <div className="sanctum-glass-main p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Emergency Contact</h2>
            {editing ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderEditField('Name', 'emergencyContactName')}
                {renderEditField('Relationship', 'emergencyContactRelation')}
                {renderEditField('Phone', 'emergencyContactPhone', 'tel')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Name', profile.emergencyContactName)}
                {renderField('Relationship', profile.emergencyContactRelation)}
                {renderField('Phone', profile.emergencyContactPhone)}
              </div>
            )}
          </div>

          {/* Edit Actions */}
          {editing && (
            <div className="flex justify-end gap-3">
              <button onClick={handleCancel} className="btn-action btn-sm btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-action btn-sm btn-primary disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      )}
    </PortalLayout>
  );
}

export default PortalProfile;
