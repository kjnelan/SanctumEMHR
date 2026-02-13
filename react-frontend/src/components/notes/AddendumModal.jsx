import React, { useState } from 'react';
import { Modal } from '../Modal';
import { PrimaryButton } from '../PrimaryButton';
import { SecondaryButton } from '../SecondaryButton';
import { ErrorMessage } from '../ErrorMessage';
import { createAddendum } from '../../services/NoteService';

/**
 * AddendumModal Component
 *
 * Modal for creating addenda to signed clinical notes.
 * Addenda are amendments that preserve the original note's integrity
 * while allowing additional clinical information to be documented.
 *
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Callback when modal is closed
 * @param {number} noteId - ID of the parent note
 * @param {function} onSuccess - Callback when addendum is created successfully
 */
function AddendumModal({ isOpen, onClose, noteId, onSuccess }) {
  const [formData, setFormData] = useState({
    reason: '',
    content: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.reason.trim()) {
      setError('Reason is required');
      return;
    }
    if (formData.reason.trim().length < 5) {
      setError('Reason must be at least 5 characters');
      return;
    }
    if (!formData.content.trim()) {
      setError('Addendum content is required');
      return;
    }
    if (formData.content.trim().length < 10) {
      setError('Addendum content must be at least 10 characters');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createAddendum(noteId, formData.reason.trim(), formData.content.trim());

      // Reset form
      setFormData({ reason: '', content: '' });

      // Notify parent component
      onSuccess();
    } catch (err) {
      console.error('Error creating addendum:', err);
      setError(err.message || 'Failed to create addendum. Please try again.');
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setFormData({ reason: '', content: '' });
      setError(null);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Addendum to Clinical Note"
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {error && <ErrorMessage className="mb-4">{error}</ErrorMessage>}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for Addendum <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="input-field w-full"
            placeholder="e.g., Additional clinical information received"
            disabled={saving}
            autoFocus
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">
            Brief explanation of why this addendum is needed (minimum 5 characters)
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Addendum Content <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="input-field w-full"
            rows={10}
            placeholder="Enter the additional clinical information or clarification..."
            disabled={saving}
          />
          <p className="text-xs text-gray-500 mt-1">
            This addendum will be permanently attached to the signed clinical note (minimum 10 characters)
          </p>
        </div>

        <Modal.Footer>
          <SecondaryButton type="button" onClick={handleClose} disabled={saving}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={saving}>
            {saving ? 'Creating Addendum...' : 'Create Addendum'}
          </PrimaryButton>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

export default AddendumModal;
