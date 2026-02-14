import React, { useState } from 'react';
import NoteEditor from '../notes/NoteEditor';
import NoteViewer from '../notes/NoteViewer';
import { PrimaryButton } from '../PrimaryButton';
import { portalAdminEnable, portalAdminResetPassword, portalAdminRevoke } from '../../services/PortalService';

function AdminNotesTab({ data }) {
  const [editingFinancial, setEditingFinancial] = useState(false);
  const [financialData, setFinancialData] = useState({});
  const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'view'
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  if (!data) {
    return (
      <div className="text-gray-700 text-center py-8">
        Loading admin notes...
      </div>
    );
  }

  const { client } = data;

  const handleEditFinancial = () => {
    setFinancialData({
      homeless_status: client.homeless_status || '',
      financial_review_date: client.financial_review_date || '',
      family_size: client.family_size || '',
      monthly_income: client.monthly_income || ''
    });
    setEditingFinancial(true);
  };

  const handleSaveFinancial = async () => {
    // TODO: Implement save to backend
    console.log('Saving financial data:', financialData);
    alert('Financial data save not yet implemented - needs API endpoint');
    setEditingFinancial(false);
  };

  const handleCancelFinancial = () => {
    setEditingFinancial(false);
    setFinancialData({});
  };

  const handleCreateAdminNote = () => {
    setView('create');
  };

  const handleNoteSaved = () => {
    setView('list');
    setSelectedNoteId(null);
  };

  const handleClose = () => {
    setView('list');
    setSelectedNoteId(null);
  };

  // If creating/editing/viewing a note, show the note editor/viewer
  if (view === 'create') {
    return (
      <NoteEditor
        clientId={client.pid}
        noteType="admin"
        onSave={handleNoteSaved}
        onClose={handleClose}
      />
    );
  }

  if (view === 'edit') {
    return (
      <NoteEditor
        noteId={selectedNoteId}
        clientId={client.pid}
        noteType="admin"
        onSave={handleNoteSaved}
        onClose={handleClose}
      />
    );
  }

  if (view === 'view') {
    return (
      <NoteViewer
        noteId={selectedNoteId}
        onClose={handleClose}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Client Portal Section */}
        <PortalSettingsCard
          clientId={client.pid}
          portalAccess={client.portal_access}
          portalUsername={client.portal_username}
        />

        {/* Financial & Housing Status Section */}
        <div className="card-main">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Financial & Housing Status</h2>
            {!editingFinancial && (
              <button
                onClick={handleEditFinancial}
                className="px-4 py-2 text-sm font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
              >
                ✏️ Edit
              </button>
            )}
          </div>
          <div className="card-inner">
            <div className="grid grid-cols-2 gap-3">
              <div className="form-field">
                <div className="form-field-label">Homeless</div>
                {editingFinancial ? (
                  <select
                    value={financialData.homeless_status}
                    onChange={(e) => setFinancialData({...financialData, homeless_status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="At Risk">At Risk</option>
                  </select>
                ) : (
                  <div className="form-field-value">{client.homeless_status || ''}</div>
                )}
              </div>
              <div className="form-field">
                <div className="form-field-label">Financial Review</div>
                {editingFinancial ? (
                  <input
                    type="date"
                    value={financialData.financial_review_date}
                    onChange={(e) => setFinancialData({...financialData, financial_review_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="form-field-value">
                    {client.financial_review_date ? new Date(client.financial_review_date).toLocaleDateString() : ''}
                  </div>
                )}
              </div>
              <div className="form-field">
                <div className="form-field-label">Family Size</div>
                {editingFinancial ? (
                  <input
                    type="number"
                    value={financialData.family_size}
                    onChange={(e) => setFinancialData({...financialData, family_size: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="form-field-value">{client.family_size || ''}</div>
                )}
              </div>
              <div className="form-field">
                <div className="form-field-label">Monthly Income</div>
                {editingFinancial ? (
                  <input
                    type="number"
                    value={financialData.monthly_income}
                    onChange={(e) => setFinancialData({...financialData, monthly_income: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                ) : (
                  <div className="form-field-value">{client.monthly_income ? `$${client.monthly_income}` : ''}</div>
                )}
              </div>
            </div>
            {editingFinancial && (
              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                <PrimaryButton onClick={handleSaveFinancial}>
                  💾 Save Changes
                </PrimaryButton>
                <button
                  onClick={handleCancelFinancial}
                  className="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Administrative Notes */}
      <div className="space-y-6">
        <div className="card-main">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Administrative Notes</h2>
            <PrimaryButton onClick={handleCreateAdminNote}>
              + New Admin Note
            </PrimaryButton>
          </div>
          <div className="text-gray-600 text-sm">
            Create administrative notes for this client's record
          </div>
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

export default AdminNotesTab;
