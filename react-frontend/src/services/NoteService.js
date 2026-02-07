/**
 * NoteService.js
 * Centralized service for all clinical note-related API operations
 *
 * This service wraps the base API functions and provides:
 * - Unified import point for note operations
 * - Error handling and logging
 * - Future: caching, retry logic, data transformations
 */

import {
  getClinicalNotes as apiGetClinicalNotes,
  createNote as apiCreateNote,
  getPatientNotes as apiGetPatientNotes,
  getNote as apiGetNote,
  updateNote as apiUpdateNote,
  autosaveNote as apiAutosaveNote,
  signNote as apiSignNote,
  deleteNote as apiDeleteNote,
  getInterventions as apiGetInterventions,
  getTreatmentGoals as apiGetTreatmentGoals,
  getDraft as apiGetDraft,
  createAddendum as apiCreateAddendum,
  getClinicalSettings as apiGetClinicalSettings,
  searchCodes as apiSearchCodes,
  getPatientDiagnoses as apiGetPatientDiagnoses
} from '../utils/api';

// ========================================
// CLINICAL NOTES CRUD
// ========================================

/**
 * Get all clinical notes for a patient (legacy format)
 * @param {number|string} patientId - Patient ID
 * @returns {Promise<Object>} Notes response
 */
export const getClinicalNotes = async (patientId) => {
  try {
    const result = await apiGetClinicalNotes(patientId);
    return result;
  } catch (error) {
    console.error('NoteService: Error fetching clinical notes:', error);
    throw error;
  }
};

/**
 * Create a new clinical note
 * @param {Object} data - Note data (patientId, noteType, templateType, serviceDate, etc.)
 * @returns {Promise<Object>} Created note with ID and UUID
 */
export const createNote = async (data) => {
  try {
    const result = await apiCreateNote(data);
    return result;
  } catch (error) {
    console.error('NoteService: Error creating note:', error);
    throw error;
  }
};

/**
 * Get all clinical notes for a patient (new system with filters)
 * @param {number|string} patientId - Patient ID
 * @param {Object} filters - Optional filters (note_type, status, start_date, end_date)
 * @returns {Promise<Object>} Notes response
 */
export const getPatientNotes = async (patientId, filters = {}) => {
  try {
    const result = await apiGetPatientNotes(patientId, filters);
    return result;
  } catch (error) {
    console.error('NoteService: Error fetching patient notes:', error);
    throw error;
  }
};

/**
 * Get a specific clinical note by ID or UUID
 * @param {number|string} identifier - Note ID or UUID
 * @param {boolean} isUuid - Whether identifier is UUID (default: false)
 * @returns {Promise<Object>} Note data
 */
export const getNote = async (identifier, isUuid = false) => {
  try {
    const result = await apiGetNote(identifier, isUuid);
    return result;
  } catch (error) {
    console.error('NoteService: Error fetching note:', error);
    throw error;
  }
};

/**
 * Update a clinical note
 * @param {number} noteId - Note ID
 * @param {Object} data - Note data to update
 * @returns {Promise<Object>} Update result
 */
export const updateNote = async (noteId, data) => {
  try {
    const result = await apiUpdateNote(noteId, data);
    return result;
  } catch (error) {
    console.error('NoteService: Error updating note:', error);
    throw error;
  }
};

/**
 * Auto-save note draft (silent operation)
 * @param {Object} data - Draft data
 * @returns {Promise<Object>} Autosave result
 */
export const autosaveNote = async (data) => {
  try {
    const result = await apiAutosaveNote(data);
    return result;
  } catch (error) {
    // Don't log autosave errors to console (too noisy)
    throw error;
  }
};

/**
 * Sign and lock a clinical note
 * @param {number} noteId - Note ID
 * @param {Object} signatureData - Optional signature details
 * @returns {Promise<Object>} Sign result
 */
export const signNote = async (noteId, signatureData = null) => {
  try {
    const result = await apiSignNote(noteId, signatureData);
    return result;
  } catch (error) {
    console.error('NoteService: Error signing note:', error);
    throw error;
  }
};

/**
 * Delete an unsigned note
 * @param {number} noteId - Note ID to delete
 * @returns {Promise<Object>} Delete result
 */
export const deleteNote = async (noteId) => {
  try {
    const result = await apiDeleteNote(noteId);
    return result;
  } catch (error) {
    console.error('NoteService: Error deleting note:', error);
    throw error;
  }
};

// ========================================
// DRAFTS
// ========================================

/**
 * Get saved draft for a note
 * @param {Object} params - Query params (note_id, appointment_id, or patient_id)
 * @returns {Promise<Object>} Draft data
 */
export const getDraft = async (params) => {
  try {
    const result = await apiGetDraft(params);
    return result;
  } catch (error) {
    console.error('NoteService: Error fetching draft:', error);
    throw error;
  }
};

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
export const createAddendum = async (parentNoteId, addendumReason, addendumContent) => {
  try {
    const result = await apiCreateAddendum(parentNoteId, addendumReason, addendumContent);
    return result;
  } catch (error) {
    console.error('NoteService: Error creating addendum:', error);
    throw error;
  }
};

// ========================================
// INTERVENTIONS & TREATMENT GOALS
// ========================================

/**
 * Get intervention library
 * @param {Object} filters - Optional filters (tier, modality, include_inactive)
 * @returns {Promise<Array>} Interventions list
 */
export const getInterventions = async (filters = {}) => {
  try {
    const result = await apiGetInterventions(filters);
    return result;
  } catch (error) {
    console.error('NoteService: Error fetching interventions:', error);
    throw error;
  }
};

/**
 * Get treatment goals for a patient
 * @param {number|string} patientId - Patient ID
 * @param {Object} filters - Optional filters (status, include_all)
 * @returns {Promise<Array>} Treatment goals list
 */
export const getTreatmentGoals = async (patientId, filters = {}) => {
  try {
    const result = await apiGetTreatmentGoals(patientId, filters);
    return result;
  } catch (error) {
    console.error('NoteService: Error fetching treatment goals:', error);
    throw error;
  }
};

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
export const searchCodes = async (searchTerm, codeType = 'ICD10', limit = 50) => {
  try {
    const result = await apiSearchCodes(searchTerm, codeType, limit);
    return result;
  } catch (error) {
    console.error('NoteService: Error searching codes:', error);
    throw error;
  }
};

/**
 * Get patient diagnoses (active and/or historical)
 * @param {number|string} patientId - Patient ID
 * @param {Object} options - Query options (activeAsOf, includeRetired)
 * @returns {Promise<Array>} Patient diagnoses
 */
export const getPatientDiagnoses = async (patientId, options = {}) => {
  try {
    const result = await apiGetPatientDiagnoses(patientId, options);
    return result;
  } catch (error) {
    console.error('NoteService: Error fetching patient diagnoses:', error);
    throw error;
  }
};

// ========================================
// SETTINGS
// ========================================

/**
 * Get clinical documentation system settings
 * @returns {Promise<Object>} Clinical settings
 */
export const getClinicalSettings = async () => {
  try {
    const result = await apiGetClinicalSettings();
    return result;
  } catch (error) {
    console.error('NoteService: Error fetching clinical settings:', error);
    throw error;
  }
};
