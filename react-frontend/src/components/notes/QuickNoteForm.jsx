/**
 * Mindline EMHR
 * QuickNoteForm - Lightweight form for no-show and cancellation notes
 * Skips the full editor for simple documentation
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React, { useState } from 'react';
import { createNote, signNote } from '../../utils/api';

/**
 * Props:
 * - noteType: string - 'noshow' or 'cancel'
 * - patientId: number - Patient ID
 * - appointmentId: number - Optional appointment ID
 * - serviceDate: string - Service date (YYYY-MM-DD)
 * - onSave: function - Callback after save
 * - onCancel: function - Callback to cancel
 */
function QuickNoteForm({ noteType, patientId, appointmentId = null, serviceDate, onSave, onCancel }) {
  const [reason, setReason] = useState('');
  const [attemptedContact, setAttemptedContact] = useState(false);
  const [contactMethod, setContactMethod] = useState('');
  const [contactResult, setContactResult] = useState('');
  const [billable, setBillable] = useState(false);
  const [signImmediately, setSignImmediately] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isNoShow = noteType === 'noshow';
  const isCancel = noteType === 'cancel';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Build note content
      let noteContent = '';

      if (isNoShow) {
        noteContent = `CLIENT DID NOT ATTEND SCHEDULED APPOINTMENT\n\n`;
        if (reason) noteContent += `Reason (if known): ${reason}\n\n`;
        if (attemptedContact) {
          noteContent += `Contact Attempted: Yes\n`;
          noteContent += `Method: ${contactMethod}\n`;
          noteContent += `Result: ${contactResult}\n\n`;
        } else {
          noteContent += `Contact Attempted: No\n\n`;
        }
        noteContent += `Plan: ${billable ? 'Billable no-show fee applies.' : 'No-show fee waived.'} Will follow up to reschedule.`;
      } else if (isCancel) {
        noteContent = `APPOINTMENT CANCELLED\n\n`;
        if (reason) noteContent += `Reason: ${reason}\n\n`;
        noteContent += `Plan: Will reschedule as needed.`;
      }

      // Create note
      const noteData = {
        patientId,
        appointmentId,
        noteType: noteType,
        serviceDate,
        templateType: 'quick',
        plan: noteContent,
        status: signImmediately ? 'signed' : 'draft'
      };

      const result = await createNote(noteData);

      // If sign immediately, sign the note
      if (signImmediately && result.noteId) {
        await signNote(result.noteId);
      }

      if (onSave) {
        onSave(result);
      }
    } catch (err) {
      console.error('Error saving quick note:', err);
      setError(err.message || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="card-main">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            {isNoShow ? '❌ No-Show Note' : '🚫 Cancellation Note'}
          </h2>
          <p className="text-gray-600">
            Quick documentation for {isNoShow ? 'missed appointment' : 'cancelled session'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reason */}
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">
                {isNoShow ? 'Reason (if known)' : 'Reason for Cancellation'}
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="3"
                placeholder={isNoShow ? 'e.g., Client called to report illness' : 'e.g., Family emergency'}
              />
            </label>
          </div>

          {/* No-show specific fields */}
          {isNoShow && (
            <>
              {/* Attempted Contact */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <label className="flex items-center gap-3 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attemptedContact}
                    onChange={(e) => setAttemptedContact(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="font-semibold text-gray-800">
                    Attempted to contact client
                  </span>
                </label>

                {attemptedContact && (
                  <div className="space-y-3 ml-8">
                    <div>
                      <label className="block">
                        <span className="text-sm font-semibold text-gray-700 mb-1 block">
                          Contact Method
                        </span>
                        <select
                          value={contactMethod}
                          onChange={(e) => setContactMethod(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select method...</option>
                          <option value="Phone">Phone</option>
                          <option value="Email">Email</option>
                          <option value="Text/SMS">Text/SMS</option>
                          <option value="Patient Portal">Patient Portal</option>
                        </select>
                      </label>
                    </div>

                    <div>
                      <label className="block">
                        <span className="text-sm font-semibold text-gray-700 mb-1 block">
                          Result
                        </span>
                        <select
                          value={contactResult}
                          onChange={(e) => setContactResult(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select result...</option>
                          <option value="Left voicemail">Left voicemail</option>
                          <option value="Spoke with client">Spoke with client</option>
                          <option value="No answer">No answer</option>
                          <option value="Message sent">Message sent</option>
                          <option value="Awaiting response">Awaiting response</option>
                        </select>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Billable */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={billable}
                    onChange={(e) => setBillable(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="font-semibold text-gray-800">
                    Apply no-show fee (billable)
                  </span>
                </label>
              </div>
            </>
          )}

          {/* Sign immediately */}
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={signImmediately}
                onChange={(e) => setSignImmediately(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="font-semibold text-gray-800">
                Sign and lock note immediately
              </span>
            </label>
            <p className="text-xs text-gray-600 ml-8 mt-1">
              Recommended for simple administrative notes
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuickNoteForm;
