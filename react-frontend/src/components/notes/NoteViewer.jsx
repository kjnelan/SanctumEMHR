/**
 * Mindline EMHR
 * NoteViewer - Read-only display of clinical notes
 * Shows signed/locked notes with addenda
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React, { useState, useEffect } from 'react';
import { getNote } from '../../utils/api';

/**
 * Props:
 * - noteId: number - Note ID to display
 * - onClose: function - Callback to close viewer
 * - onEdit: function - Callback to edit note (if draft)
 * - onAddendum: function - Callback to add addendum (if locked)
 */
function NoteViewer({ noteId, onClose, onEdit, onAddendum }) {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNote();
  }, [noteId]);

  const loadNote = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getNote(noteId);
      setNote(data.note);
    } catch (err) {
      console.error('Error loading note:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    // Parse date without timezone conversion (fixes "tomorrow" bug)
    const [year, month, day] = dateStr.split(/[-T]/);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center p-12">
          <div className="text-gray-600">Loading note...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="card-main text-center p-12">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!note) {
    return null;
  }

  const isLocked = note.is_locked || note.status === 'signed';
  const isDraft = note.status === 'draft';

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-800">
            {note.note_type === 'progress' && '📝 Progress Note'}
            {note.note_type === 'intake' && '👋 Intake Assessment'}
            {note.note_type === 'crisis' && '⚠️ Crisis Note'}
            {note.note_type === 'discharge' && '✅ Discharge Summary'}
            {note.note_type === 'mse' && '🧠 Mental Status Exam'}
            {note.note_type === 'admin' && '📋 Administrative Note'}
          </h1>

          <div className="flex items-center gap-2">
            {isLocked && (
              <span className="badge-sm badge-light-success">🔒 Signed & Locked</span>
            )}
            {isDraft && (
              <span className="badge-sm badge-light-warning">Draft</span>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600 font-semibold">Service Date:</span>
            <div className="text-gray-800">{formatDate(note.service_date)}</div>
          </div>
          <div>
            <span className="text-gray-600 font-semibold">Provider:</span>
            <div className="text-gray-800">{note.provider_name || 'Unknown'}</div>
          </div>
          <div>
            <span className="text-gray-600 font-semibold">Created:</span>
            <div className="text-gray-800">{formatDateTime(note.created_at)}</div>
          </div>
          {note.signed_at && (
            <div>
              <span className="text-gray-600 font-semibold">Signed:</span>
              <div className="text-gray-800">{formatDateTime(note.signed_at)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Note Content */}
      <div className="space-y-6">
        {/* BIRP Template Display */}
        {note.template_type === 'BIRP' && (
          <>
            {/* Behavior */}
            {note.behavior_problem && (
              <div className="card-main">
                <h3 className="font-semibold text-gray-800 mb-3">
                  <span className="text-blue-600 mr-2">B</span>
                  Behavior / Observations
                </h3>
                <div className="text-gray-700 whitespace-pre-wrap">{note.behavior_problem}</div>
                {note.client_presentation && note.client_presentation.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {note.client_presentation.map((tag, idx) => (
                      <span key={idx} className="badge-sm badge-light-info">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Intervention */}
            {(note.intervention || (note.interventions_selected && note.interventions_selected.length > 0)) && (
              <div className="card-main">
                <h3 className="font-semibold text-gray-800 mb-3">
                  <span className="text-blue-600 mr-2">I</span>
                  Interventions Used
                </h3>
                {note.intervention && (
                  <div className="text-gray-700 whitespace-pre-wrap mb-3">{note.intervention}</div>
                )}
                {note.interventions_selected && note.interventions_selected.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-gray-600 mb-2">Selected Interventions:</div>
                    <div className="flex flex-wrap gap-2">
                      {note.interventions_selected.map((intervention, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {intervention}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Response */}
            {note.response && (
              <div className="card-main">
                <h3 className="font-semibold text-gray-800 mb-3">
                  <span className="text-blue-600 mr-2">R</span>
                  Client Response
                </h3>
                <div className="text-gray-700 whitespace-pre-wrap">{note.response}</div>
              </div>
            )}

            {/* Plan */}
            {note.plan && (
              <div className="card-main">
                <h3 className="font-semibold text-gray-800 mb-3">
                  <span className="text-blue-600 mr-2">P</span>
                  Plan / Next Steps
                </h3>
                <div className="text-gray-700 whitespace-pre-wrap">{note.plan}</div>
              </div>
            )}
          </>
        )}

        {/* Risk Assessment */}
        {note.risk_present && note.risk_assessment && (
          <div className="card-main bg-orange-50 border-2 border-orange-300">
            <h3 className="font-semibold text-orange-800 mb-3">
              ⚠️ Risk Assessment
            </h3>
            <div className="text-gray-800 whitespace-pre-wrap">{note.risk_assessment}</div>
          </div>
        )}

        {/* Addenda */}
        {note.addenda && note.addenda.length > 0 && (
          <div className="card-main bg-blue-50 border-2 border-blue-300">
            <h3 className="font-semibold text-blue-800 mb-3">
              📎 Addenda ({note.addenda.length})
            </h3>
            <div className="space-y-3">
              {note.addenda.map((addendum, idx) => (
                <div key={addendum.id} className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">
                      Addendum {idx + 1}
                    </span>
                    <span className="text-xs text-gray-600">
                      {formatDateTime(addendum.created_at)} • {addendum.provider_name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-semibold">Reason:</span> {addendum.addendum_reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signature Block */}
        {isLocked && (
          <div className="card-main bg-green-50 border-2 border-green-300">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div className="flex-1">
                <div className="font-semibold text-green-800">Digitally Signed</div>
                <div className="text-sm text-gray-700">
                  {note.signed_by_name} • {formatDateTime(note.signed_at)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
        <button onClick={onClose} className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all shadow-lg">
          Close
        </button>

        {isDraft && onEdit && (
          <button onClick={() => onEdit(note.id)} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg">
            Edit Draft
          </button>
        )}

        {isLocked && onAddendum && (
          <button onClick={() => onAddendum(note.id)} className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg">
            Add Addendum
          </button>
        )}
      </div>
    </div>
  );
}

export default NoteViewer;
