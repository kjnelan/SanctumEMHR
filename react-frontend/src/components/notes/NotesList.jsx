/**
 * SanctumEMHR EMHR
 * NotesList - Display list of clinical notes for a patient
 * Supports filtering by type, status, date range
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React, { useState, useEffect } from 'react';
import { getPatientNotes } from '../../utils/api';
import { ErrorInline } from '../ErrorInline';

/**
 * Props:
 * - patientId: number - Patient ID
 * - onNoteClick: function(noteId, isDraft) - Callback when note is clicked
 * - onCreateNote: function - Callback to create new note
 */
function NotesList({ patientId, onNoteClick, onCreateNote }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    note_type: null,
    status: null,
    start_date: null,
    end_date: null
  });

  useEffect(() => {
    loadNotes();
  }, [patientId, filters]);

  const loadNotes = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getPatientNotes(patientId, filters);
      setNotes(data.notes || []);
    } catch (err) {
      console.error('Error loading notes:', err);
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getNoteIcon = (noteType) => {
    const icons = {
      progress: '📝',
      intake: '👋',
      crisis: '⚠️',
      discharge: '✅',
      mse: '🧠',
      admin: '📋',
      noshow: '❌',
      cancel: '🚫'
    };
    return icons[noteType] || '📄';
  };

  const getNoteTypeLabel = (noteType) => {
    const labels = {
      progress: 'Progress',
      intake: 'Intake',
      crisis: 'Crisis',
      discharge: 'Discharge',
      mse: 'Mental Status',
      admin: 'Administrative',
      noshow: 'No-Show',
      cancel: 'Cancellation'
    };
    return labels[noteType] || noteType;
  };

  const getStatusBadge = (note) => {
    if (note.is_locked || note.status === 'signed') {
      return <span className="badge-sm badge-light-success">Signed</span>;
    }
    if (note.status === 'draft') {
      return <span className="badge-sm badge-light-warning">Draft</span>;
    }
    if (note.supervisor_review_required && note.supervisor_review_status === 'pending') {
      return <span className="badge-sm badge-light-info">Pending Review</span>;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-600">Loading notes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <ErrorInline>Error loading notes: {error}</ErrorInline>
        <button onClick={loadNotes} className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Left Sidebar - Filters */}
      <div className="w-64 flex-shrink-0">
        <div className="card-main sticky top-6">
          <h3 className="font-semibold text-gray-800 mb-4">Filter Notes</h3>

          <div className="space-y-4">
            {/* Note Type Filter */}
            <div>
              <label className="block">
                <span className="text-xs font-semibold text-gray-600 mb-2 block">Note Type</span>
                <select
                  value={filters.note_type || ''}
                  onChange={(e) => setFilters({ ...filters, note_type: e.target.value || null })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Types</option>
                  <option value="progress">Progress</option>
                  <option value="intake">Intake</option>
                  <option value="crisis">Crisis</option>
                  <option value="discharge">Discharge</option>
                  <option value="mse">Mental Status</option>
                  <option value="admin">Administrative</option>
                </select>
              </label>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block">
                <span className="text-xs font-semibold text-gray-600 mb-2 block">Status</span>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value || null })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Drafts</option>
                  <option value="signed">Signed</option>
                </select>
              </label>
            </div>

            {/* Date Range */}
            <div>
              <label className="block">
                <span className="text-xs font-semibold text-gray-600 mb-2 block">From Date</span>
                <input
                  type="date"
                  value={filters.start_date || ''}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value || null })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </label>
            </div>

            <div>
              <label className="block">
                <span className="text-xs font-semibold text-gray-600 mb-2 block">To Date</span>
                <input
                  type="date"
                  value={filters.end_date || ''}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value || null })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          Clinical Notes
          <span className="ml-2 text-sm font-normal text-gray-600">
            ({notes.length} {notes.length === 1 ? 'note' : 'notes'})
          </span>
        </h2>
        {onCreateNote && (
          <button onClick={onCreateNote} className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg">
            + New Note
          </button>
        )}
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="card-main text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-lg text-gray-600 mb-2">No clinical notes found</p>
          <p className="text-sm text-gray-500">
            {filters.note_type || filters.status ? 'Try adjusting your filters' : 'Create your first note to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const isDraft = note.status === 'draft';
            return (
            <div
              key={note.id}
              onClick={() => onNoteClick && onNoteClick(note.id, isDraft, note.note_type)}
              className="card-main hover:shadow-2xl hover:scale-[1.01] hover:border-blue-400 cursor-pointer transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Note Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getNoteIcon(note.note_type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">
                          {getNoteTypeLabel(note.note_type)} Note
                        </span>
                        {getStatusBadge(note)}
                        {note.is_addendum && (
                          <span className="badge-sm badge-light-info">Addendum</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        Service Date: {formatDate(note.service_date)} • {note.provider_name || 'Unknown provider'}
                      </div>
                    </div>
                  </div>

                  {/* Note Preview */}
                  {note.behavior_problem && (
                    <div className="text-sm text-gray-700 line-clamp-2 mt-2">
                      {note.behavior_problem.substring(0, 150)}...
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex gap-4 text-xs text-gray-500 mt-2">
                    <span>Created: {formatDateTime(note.created_at)}</span>
                    {note.signed_at && (
                      <span>Signed: {formatDateTime(note.signed_at)}</span>
                    )}
                    {note.addenda && note.addenda.length > 0 && (
                      <span className="text-blue-600 font-medium">
                        {note.addenda.length} {note.addenda.length === 1 ? 'addendum' : 'addenda'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action */}
                <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md">
                  {isDraft ? 'Edit' : 'View'}
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}

export default NotesList;
