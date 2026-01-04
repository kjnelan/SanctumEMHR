/**
 * Mindline EMHR
 * NoteEditor - Main clinical note editor with auto-save
 * Supports BIRP, PIRP, and other note templates
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createNote, updateNote, autosaveNote, signNote, getNote, getDraft, getClinicalSettings } from '../../utils/api';
import BIRPTemplate from './BIRPTemplate';
import PIRPTemplate from './PIRPTemplate';
import MSETemplate from './MSETemplate';
import IntakeTemplate from './IntakeTemplate';
import DischargeTemplate from './DischargeTemplate';
import CrisisTemplate from './CrisisTemplate';
import RiskAssessmentTemplate from './RiskAssessmentTemplate';
import AdministrativeTemplate from './AdministrativeTemplate';
import QuickNoteForm from './QuickNoteForm';

/**
 * Map note type to template type
 */
const getNoteTemplateType = (noteType) => {
  const mapping = {
    'progress': 'BIRP',           // Progress notes use BIRP by default
    'intake': 'Intake',           // Intake Assessment
    'crisis': 'Crisis',           // Crisis Note
    'discharge': 'Discharge',     // Discharge Summary
    'mse': 'MSE',                 // Mental Status Exam
    'risk_assessment': 'RiskAssessment',  // Risk Assessment
    'admin': 'Administrative',    // Administrative Note
    'noshow': null,               // Uses QuickNoteForm
    'cancel': null                // Uses QuickNoteForm
  };

  return mapping[noteType] || 'BIRP'; // Default to BIRP if unknown
};

/**
 * Props:
 * - noteId: number - Existing note ID (for editing)
 * - patientId: number - Patient ID (required for new notes)
 * - appointmentId: number - Optional appointment ID
 * - noteType: string - Note type (from selector)
 * - onClose: function - Callback to close editor
 * - onSave: function - Callback after save
 */
function NoteEditor({ noteId = null, patientId, appointmentId = null, noteType, onClose, onSave }) {
  const mappedTemplateType = getNoteTemplateType(noteType);

  const [note, setNote] = useState({
    patientId,
    appointmentId,
    noteType,
    templateType: mappedTemplateType,
    serviceDate: new Date().toISOString().split('T')[0],
    behaviorProblem: '',
    intervention: '',
    response: '',
    plan: '',
    riskPresent: false,
    riskAssessment: '',
    interventionsSelected: [],
    clientPresentation: [],
    goalsAddressed: [],
    status: 'draft'
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(null);

  const autoSaveTimer = useRef(null);
  const noteIdRef = useRef(noteId);

  // Load existing note or draft
  useEffect(() => {
    loadNoteData();
    loadSettings();
  }, [noteId, appointmentId, patientId]);

  // Auto-save every 3 seconds after changes
  useEffect(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(() => {
      triggerAutoSave();
    }, 3000);

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [note]);

  const loadNoteData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (noteId) {
        // Load existing note
        const data = await getNote(noteId);
        setNote({ ...note, ...data.note });
        noteIdRef.current = noteId;
      } else {
        // Try to load draft
        const draftParams = {};
        if (appointmentId) draftParams.appointment_id = appointmentId;
        else if (patientId) draftParams.patient_id = patientId;

        try {
          const draftData = await getDraft(draftParams);
          if (draftData.draft) {
            const draftContent = draftData.draft.draft_content;
            // Only restore if note type matches
            if (draftContent.noteType === noteType) {
              setNote({ ...note, ...draftContent });
              console.log('Restored draft from server');
            } else {
              console.log('Server draft note type mismatch, skipping restore. Expected:', noteType, 'Got:', draftContent.noteType);
            }
          }
        } catch (err) {
          // No draft found - that's okay
          console.log('No draft found, starting fresh');
        }

        // Also check localStorage for instant recovery
        const localDraft = localStorage.getItem(`note_draft_${patientId}_${appointmentId || 'new'}_${noteType}`);
        if (localDraft) {
          try {
            const parsed = JSON.parse(localDraft);
            // Only restore if note type matches
            if (parsed.noteType === noteType) {
              setNote({ ...note, ...parsed });
              console.log('Restored draft from localStorage');
            } else {
              console.log('Draft note type mismatch, skipping restore');
              // Clear the mismatched draft
              localStorage.removeItem(`note_draft_${patientId}_${appointmentId || 'new'}_${noteType}`);
            }
          } catch (err) {
            console.error('Failed to parse localStorage draft');
          }
        }
      }
    } catch (err) {
      console.error('Error loading note:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await getClinicalSettings();
      setSettings(data.settings);

      // Apply default template if not set
      if (!note.templateType && data.settings.default_note_template) {
        setNote(prev => ({ ...prev, templateType: data.settings.default_note_template }));
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const triggerAutoSave = useCallback(async () => {
    // Don't auto-save if note is locked or signed
    if (note.status === 'signed' || note.is_locked) {
      return;
    }

    setAutoSaving(true);

    try {
      // Save to localStorage immediately (instant recovery)
      localStorage.setItem(
        `note_draft_${patientId}_${appointmentId || 'new'}_${note.noteType}`,
        JSON.stringify(note)
      );

      // Save to server
      const draftData = {
        noteId: noteIdRef.current,
        patientId: note.patientId,
        appointmentId: note.appointmentId,
        noteType: note.noteType,
        serviceDate: note.serviceDate,
        draftContent: note
      };

      await autosaveNote(draftData);
      setLastSaved(new Date());
    } catch (err) {
      console.error('Auto-save failed:', err);
      // Don't show error to user for auto-save failures
    } finally {
      setAutoSaving(false);
    }
  }, [note, patientId, appointmentId]);

  const handleFieldChange = (field, value) => {
    setNote(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setError(null);

    try {
      if (noteIdRef.current) {
        // Update existing note
        await updateNote(noteIdRef.current, note);
      } else {
        // Create new note
        const result = await createNote(note);
        noteIdRef.current = result.noteId;
      }

      setLastSaved(new Date());

      if (onSave) {
        onSave({ noteId: noteIdRef.current, status: 'draft' });
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSign = async () => {
    setSaving(true);
    setError(null);

    try {
      // First save the note if it doesn't exist yet
      if (!noteIdRef.current) {
        const result = await createNote({ ...note, status: 'draft' });
        noteIdRef.current = result.noteId;
      } else {
        await updateNote(noteIdRef.current, note);
      }

      // Then sign it
      await signNote(noteIdRef.current);

      // Clear localStorage draft
      localStorage.removeItem(`note_draft_${patientId}_${appointmentId || 'new'}_${note.noteType}`);

      if (onSave) {
        onSave({ noteId: noteIdRef.current, status: 'signed' });
      }

      if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error('Error signing note:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    }
  };

  // Quick notes bypass full editor
  if (noteType === 'noshow' || noteType === 'cancel') {
    return (
      <QuickNoteForm
        noteType={noteType}
        patientId={patientId}
        appointmentId={appointmentId}
        serviceDate={note.serviceDate}
        onSave={onSave}
        onCancel={onClose}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-600">Loading note...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-semibold text-gray-800">
            {noteType === 'progress' && '📝 Progress Note'}
            {noteType === 'intake' && '👋 Intake Assessment'}
            {noteType === 'crisis' && '⚠️ Crisis Note'}
            {noteType === 'discharge' && '✅ Discharge Summary'}
            {noteType === 'mse' && '🧠 Mental Status Exam'}
            {noteType === 'risk_assessment' && '🛡️ Risk Assessment'}
            {noteType === 'admin' && '📋 Administrative Note'}
          </h1>

          {/* Auto-save indicator */}
          <div className="flex items-center gap-3">
            {autoSaving && (
              <span className="text-sm text-blue-600">Saving...</span>
            )}
            {lastSaved && !autoSaving && (
              <span className="text-sm text-gray-600">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Service Date */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Service Date:</span>
            <input
              type="date"
              value={note.serviceDate}
              onChange={(e) => handleFieldChange('serviceDate', e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Template */}
      <div className="mb-6">
        {note.templateType === 'BIRP' && (
          <BIRPTemplate
            note={note}
            onChange={handleFieldChange}
            patientId={patientId}
            autoSave={triggerAutoSave}
          />
        )}
        {note.templateType === 'PIRP' && (
          <PIRPTemplate
            note={note}
            onChange={handleFieldChange}
            patientId={patientId}
            autoSave={triggerAutoSave}
          />
        )}
        {note.templateType === 'MSE' && (
          <MSETemplate
            note={note}
            onChange={handleFieldChange}
            autoSave={triggerAutoSave}
          />
        )}
        {note.templateType === 'Intake' && (
          <IntakeTemplate
            note={note}
            onChange={handleFieldChange}
            autoSave={triggerAutoSave}
          />
        )}
        {note.templateType === 'Discharge' && (
          <DischargeTemplate
            note={note}
            onChange={handleFieldChange}
            autoSave={triggerAutoSave}
          />
        )}
        {note.templateType === 'Crisis' && (
          <CrisisTemplate
            note={note}
            onChange={handleFieldChange}
            autoSave={triggerAutoSave}
          />
        )}
        {note.templateType === 'RiskAssessment' && (
          <RiskAssessmentTemplate
            note={note}
            onChange={handleFieldChange}
            autoSave={triggerAutoSave}
          />
        )}
        {note.templateType === 'Administrative' && (
          <AdministrativeTemplate
            note={note}
            onChange={handleFieldChange}
            autoSave={triggerAutoSave}
          />
        )}
      </div>

      {/* Actions */}
      <div className="sticky bottom-6 mt-8">
        <div className="card-main shadow-2xl">
          <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving || autoSaving}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            onClick={handleSign}
            disabled={saving || autoSaving}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Signing...' : '✓ Sign & Lock Note'}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NoteEditor;
