/**
 * NoteService.js
 * Centralized service for all clinical note-related API operations
 *
 * This service handles:
 * - Clinical note CRUD operations
 * - Drafts and autosave
 * - Note signing and addenda
 * - Interventions and treatment goals
 * - Diagnosis codes
 */

import { apiRequest } from '../utils/api';

// ========================================
// CLINICAL NOTES CRUD
// ========================================

/**
 * Get all clinical notes for a patient (legacy format)
 * @param {number|string} patientId - Patient ID
 * @returns {Promise<Object>} Notes response
 */
export async function getClinicalNotes(patientId) {
  console.log('NoteService: Fetching clinical notes for patient ID:', patientId);
  return apiRequest(`/custom/api/clinical_notes.php?patient_id=${patientId}`);
}

/**
 * Create a new clinical note
 * @param {Object} data - Note data (patientId, noteType, templateType, serviceDate, etc.)
 * @returns {Promise<Object>} Created note with ID and UUID
 */
export async function createNote(data) {
  console.log('NoteService: Creating clinical note:', data);
  return apiRequest('/custom/api/notes/create_note.php', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Get all clinical notes for a patient (new system with filters)
 * @param {number|string} patientId - Patient ID
 * @param {Object} filters - Optional filters (note_type, status, start_date, end_date)
 * @returns {Promise<Object>} Notes response
 */
export async function getPatientNotes(patientId, filters = {}) {
  console.log('NoteService: Fetching patient notes for ID:', patientId);
  const params = new URLSearchParams({ patient_id: patientId });

  if (filters.note_type) params.append('note_type', filters.note_type);
  if (filters.status) params.append('status', filters.status);
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);

  return apiRequest(`/custom/api/notes/get_patient_notes.php?${params.toString()}`);
}

/**
 * Get a specific clinical note by ID or UUID
 * @param {number|string} identifier - Note ID or UUID
 * @param {boolean} isUuid - Whether identifier is UUID (default: false)
 * @returns {Promise<Object>} Note data
 */
export async function getNote(identifier, isUuid = false) {
  console.log('NoteService: Fetching note:', identifier);
  const param = isUuid ? `note_uuid=${identifier}` : `note_id=${identifier}`;
  return apiRequest(`/custom/api/notes/get_note.php?${param}`);
}

/**
 * Update a clinical note
 * @param {number} noteId - Note ID
 * @param {Object} data - Note data to update
 * @returns {Promise<Object>} Update result
 */
export async function updateNote(noteId, data) {
  console.log('NoteService: Updating note:', noteId);
  return apiRequest('/custom/api/notes/update_note.php', {
    method: 'POST',
    body: JSON.stringify({ noteId, ...data })
  });
}

/**
 * Auto-save note draft (silent operation)
 * @param {Object} data - Draft data
 * @returns {Promise<Object>} Autosave result
 */
export async function autosaveNote(data) {
  // Don't log to console for auto-save (too frequent)
  return apiRequest('/custom/api/notes/autosave_note.php', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Sign and lock a clinical note
 * @param {number} noteId - Note ID
 * @param {Object} signatureData - Optional signature details
 * @returns {Promise<Object>} Sign result
 */
export async function signNote(noteId, signatureData = null) {
  console.log('NoteService: Signing note:', noteId);
  return apiRequest('/custom/api/notes/sign_note.php', {
    method: 'POST',
    body: JSON.stringify({ noteId, signatureData })
  });
}

/**
 * Delete an unsigned note
 * @param {number} noteId - Note ID to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteNote(noteId) {
  console.log('NoteService: Deleting note:', noteId);
  return apiRequest('/custom/api/notes/delete_note.php', {
    method: 'DELETE',
    body: JSON.stringify({ note_id: noteId })
  });
}

// ========================================
// DRAFTS
// ========================================

/**
 * Get saved draft for a note
 * @param {Object} params - Query params (note_id, appointment_id, or patient_id)
 * @returns {Promise<Object>} Draft data
 */
export async function getDraft(params) {
  console.log('NoteService: Fetching draft:', params);
  const queryParams = new URLSearchParams();

  if (params.note_id) queryParams.append('note_id', params.note_id);
  if (params.appointment_id) queryParams.append('appointment_id', params.appointment_id);
  if (params.patient_id) queryParams.append('patient_id', params.patient_id);

  return apiRequest(`/custom/api/notes/get_draft.php?${queryParams.toString()}`);
}

// ========================================
// ADDENDA
// ========================================

/**
 * Create an addendum to a signed note
 * @param {number} parentNoteId - Parent note ID
 * @param {string} addendumReason - Reason for addendum
 * @param {string} addendumContent - Addendum content
 * @returns {Promise<Object>} Created addendum
 */
export async function createAddendum(parentNoteId, addendumReason, addendumContent) {
  console.log('NoteService: Creating addendum for note:', parentNoteId);
  return apiRequest('/custom/api/notes/create_addendum.php', {
    method: 'POST',
    body: JSON.stringify({ parentNoteId, addendumReason, addendumContent })
  });
}

// ========================================
// INTERVENTIONS & TREATMENT GOALS
// ========================================

/**
 * Get intervention library
 * @param {Object} filters - Optional filters (tier, modality, include_inactive)
 * @returns {Promise<Array>} Interventions list
 */
export async function getInterventions(filters = {}) {
  console.log('NoteService: Fetching interventions');
  const params = new URLSearchParams();

  if (filters.tier) params.append('tier', filters.tier);
  if (filters.modality) params.append('modality', filters.modality);
  if (filters.include_inactive) params.append('include_inactive', filters.include_inactive);

  const query = params.toString();
  return apiRequest(`/custom/api/notes/get_interventions.php${query ? '?' + query : ''}`);
}

/**
 * Get treatment goals for a patient
 * @param {number|string} patientId - Patient ID
 * @param {Object} filters - Optional filters (status, include_all)
 * @returns {Promise<Array>} Treatment goals list
 */
export async function getTreatmentGoals(patientId, filters = {}) {
  console.log('NoteService: Fetching treatment goals for patient:', patientId);
  const params = new URLSearchParams({ patient_id: patientId });

  if (filters.status) params.append('status', filters.status);
  if (filters.include_all) params.append('include_all', filters.include_all);

  return apiRequest(`/custom/api/notes/get_treatment_goals.php?${params.toString()}`);
}

// ========================================
// DIAGNOSIS & CODES
// ========================================

/**
 * Search diagnosis/procedure codes (ICD-10, CPT, etc.)
 * @param {string} searchTerm - Search term for code or description
 * @param {string} codeType - Code type (ICD10, CPT4, etc.)
 * @param {number} limit - Maximum results to return
 * @returns {Promise<Array>} Matching codes
 */
export async function searchCodes(searchTerm, codeType = 'ICD10', limit = 50) {
  console.log('NoteService: Searching codes:', { searchTerm, codeType, limit });
  const params = new URLSearchParams({
    search: searchTerm,
    code_type: codeType,
    limit: limit.toString()
  });

  return apiRequest(`/custom/api/search_codes.php?${params.toString()}`);
}

/**
 * Get patient diagnoses (active and/or historical)
 * @param {number|string} patientId - Patient ID
 * @param {Object} options - Query options (activeAsOf, includeRetired)
 * @returns {Promise<Array>} Patient diagnoses
 */
export async function getPatientDiagnoses(patientId, options = {}) {
  console.log('NoteService: Fetching patient diagnoses:', { patientId, options });
  const params = new URLSearchParams({
    patient_id: patientId.toString()
  });

  if (options.activeAsOf) {
    params.append('active_as_of', options.activeAsOf);
  }
  if (options.includeRetired !== undefined) {
    params.append('include_retired', options.includeRetired ? '1' : '0');
  }

  return apiRequest(`/custom/api/get_patient_diagnoses.php?${params.toString()}`);
}

// ========================================
// SETTINGS
// ========================================

/**
 * Get clinical documentation system settings
 * @returns {Promise<Object>} Clinical settings
 */
export async function getClinicalSettings() {
  console.log('NoteService: Fetching clinical settings');
  return apiRequest('/custom/api/notes/get_clinical_settings.php');
}
