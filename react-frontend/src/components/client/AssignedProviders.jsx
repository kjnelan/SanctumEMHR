/**
 * SanctumEMHR
 * AssignedProviders - Component for managing multiple provider assignments per client
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
import { DangerButton } from '../DangerButton';
import { FormLabel } from '../FormLabel';
import { RequiredAsterisk } from '../shared/RequiredAsterisk';
import { ErrorMessage } from '../ErrorMessage';

const ROLE_LABELS = {
  primary_clinician: 'Primary Clinician',
  clinician: 'Clinician',
  social_worker: 'Social Worker',
  supervisor: 'Supervisor',
  intern: 'Intern'
};

const ROLE_COLORS = {
  primary_clinician: 'bg-blue-100 text-blue-700',
  clinician: 'bg-green-100 text-green-700',
  social_worker: 'bg-purple-100 text-purple-700',
  supervisor: 'bg-orange-100 text-orange-700',
  intern: 'bg-gray-100 text-gray-700'
};

function AssignedProviders({ clientId, isAdmin, providers = [] }) {
  const [assignedProviders, setAssignedProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    provider_id: '',
    role: 'clinician',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (clientId) {
      loadAssignedProviders();
    }
  }, [clientId]);

  const loadAssignedProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/custom/api/client_providers.php?client_id=${clientId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to load assigned providers');
      }

      const data = await response.json();
      setAssignedProviders(data.providers || []);
    } catch (err) {
      console.error('Failed to load assigned providers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProvider = async () => {
    if (!addFormData.provider_id) {
      setError('Please select a provider');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/custom/api/client_providers.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          client_id: clientId,
          provider_id: parseInt(addFormData.provider_id),
          role: addFormData.role,
          notes: addFormData.notes || null
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to add provider');
      }

      await loadAssignedProviders();
      setShowAddModal(false);
      setAddFormData({ provider_id: '', role: 'clinician', notes: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveProvider = async (assignmentId, providerName) => {
    if (!confirm(`Remove ${providerName} from this client's care team?`)) {
      return;
    }

    try {
      const response = await fetch('/custom/api/client_providers.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove',
          assignment_id: assignmentId
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to remove provider');
      }

      await loadAssignedProviders();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangeRole = async (assignmentId, newRole) => {
    try {
      const response = await fetch('/custom/api/client_providers.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_role',
          assignment_id: assignmentId,
          role: newRole
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update role');
      }

      await loadAssignedProviders();
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter out already assigned providers from the dropdown
  const availableProviders = providers.filter(
    p => !assignedProviders.some(ap => ap.provider_id === p.value)
  );

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading care team...</div>;
  }

  return (
    <div>
      {error && (
        <ErrorMessage className="mb-4">{error}</ErrorMessage>
      )}

      {/* Assigned Providers List */}
      <div className="space-y-2">
        {assignedProviders.length === 0 ? (
          <div className="text-gray-500 text-sm italic">No providers assigned</div>
        ) : (
          assignedProviders.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div>
                  <div className="font-medium text-gray-900">
                    {assignment.provider_name}
                    {assignment.credentials && (
                      <span className="text-gray-500 text-sm ml-1">
                        , {assignment.credentials}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {isAdmin ? (
                      <select
                        value={assignment.role}
                        onChange={(e) => handleChangeRole(assignment.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border-0 cursor-pointer ${ROLE_COLORS[assignment.role] || 'bg-gray-100'}`}
                      >
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded-full ${ROLE_COLORS[assignment.role] || 'bg-gray-100'}`}>
                        {ROLE_LABELS[assignment.role] || assignment.role}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      since {new Date(assignment.assigned_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <button
                  onClick={() => handleRemoveProvider(assignment.id, assignment.provider_name)}
                  className="text-red-600 hover:text-red-800 text-sm"
                  title="Remove from care team"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Provider Button (Admin only) */}
      {isAdmin && (
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Provider
        </button>
      )}

      {/* Add Provider Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Provider to Care Team"
        size="md"
      >
        <div className="space-y-4">
          {error && <ErrorMessage>{error}</ErrorMessage>}

          <div>
            <FormLabel>Provider <RequiredAsterisk /></FormLabel>
            <select
              value={addFormData.provider_id}
              onChange={(e) => setAddFormData({ ...addFormData, provider_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a provider...</option>
              {availableProviders.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FormLabel>Role <RequiredAsterisk /></FormLabel>
            <select
              value={addFormData.role}
              onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <FormLabel>Notes (Optional)</FormLabel>
            <textarea
              value={addFormData.notes}
              onChange={(e) => setAddFormData({ ...addFormData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Reason for assignment, special instructions, etc."
            />
          </div>

          <Modal.Footer>
            <SecondaryButton
              onClick={() => setShowAddModal(false)}
              disabled={saving}
            >
              Cancel
            </SecondaryButton>
            <PrimaryButton
              onClick={handleAddProvider}
              disabled={saving || !addFormData.provider_id}
            >
              {saving ? 'Adding...' : 'Add to Care Team'}
            </PrimaryButton>
          </Modal.Footer>
        </div>
      </Modal>
    </div>
  );
}

export default AssignedProviders;
