/**
 * Mindline EMHR
 * API utility for making authenticated requests
 * Session-based authentication with automatic redirect on 401
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

const API_BASE = '/apis/default';
const FHIR_BASE = '/fhir';

/**
 * Make an authenticated API request using session cookies
 */
export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(endpoint, {
    ...options,
    credentials: 'include', // Include session cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Parse JSON response regardless of status
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      // Session expired or not authenticated → logout
      if (!options.noRedirect) {
        localStorage.removeItem('user');
        window.location.href = '/app/';
      }
      throw new Error('Authentication required');
    }
    // Throw error with message from API response
    throw new Error(data.message || data.error || `API request failed: ${response.statusText}`);
  }

  return data;
}

/**
 * Get current user info from localStorage
 * (populated during login)
 */
export function getCurrentUser() {
  const userJson = localStorage.getItem('user');
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}

/**
 * Fetch today's appointments
 */
export async function getTodaysAppointments() {
  const today = new Date().toISOString().split('T')[0];
  return apiRequest(`${API_BASE}/api/appointment?date=${today}`);
}

/**
 * Fetch patient/client count
 */
export async function getPatientCount() {
  return apiRequest(`${API_BASE}/api/patient?_count=true`);
}

/**
 * Fetch user details from session endpoint
 */
export async function getUserDetails() {
  try {
    const response = await apiRequest('/custom/api/session_user.php', { noRedirect: true });
    console.log('Session user response:', response);

    if (response && response.username) {
      // Update localStorage with latest user info
      localStorage.setItem('user', JSON.stringify(response));

      return {
        id: response.id || null,
        fname: response.fname || '',
        lname: response.lname || '',
        fullName: response.fullName,
        admin: response.admin || false,
        username: response.username || null
      };
    }
  } catch (error) {
    console.log('Session user fetch failed:', error.message);
  }

  return null;
}

/**
 * Search for patients/clients using session-based authentication
 * @param {string} query - Search query (name, DOB, etc.)
 */
export async function searchPatients(query) {
  if (!query || query.trim() === '') {
    return [];
  }

  // Split search query into name parts
  const parts = query.trim().split(/\s+/);
  const searchParams = new URLSearchParams();

  if (parts.length === 1) {
    // Single word - search both fname and lname
    searchParams.append('fname', parts[0]);
  } else if (parts.length >= 2) {
    // Multiple words - assume first is fname, last is lname
    searchParams.append('fname', parts[0]);
    searchParams.append('lname', parts[parts.length - 1]);
  }

  // Use custom session-based patient search endpoint
  return apiRequest(`/custom/api/patient_search.php?${searchParams.toString()}`);
}

/**
 * Get client/patient statistics
 */
export async function getClientStats() {
  return apiRequest('/custom/api/client_stats.php');
}

/**
 * Get client demographics breakdown
 */
export async function getClientDemographics() {
  return apiRequest('/custom/api/client_demographics.php');
}

/**
 * Get list of all clients with optional status filter
 * @param {string} status - Filter by status: 'all', 'active', 'inactive', 'discharged'
 */
export async function getClients(status = 'all') {
  const params = status !== 'all' ? `?status=${status}` : '';
  return apiRequest(`/custom/api/client_list.php${params}`);
}

/**
 * Get detailed client information
 * @param {string} clientId - The patient ID
 */
export async function getClientDetail(clientId) {
  console.log('Fetching client detail for ID:', clientId);
  return apiRequest(`/custom/api/client_detail.php?id=${clientId}`);
}

/**
 * Get detailed encounter information
 * @param {string} encounterId - The encounter ID
 */
export async function getEncounterDetail(encounterId) {
  console.log('Fetching encounter detail for ID:', encounterId);
  return apiRequest(`/custom/api/encounter_detail.php?encounter_id=${encounterId}`);
}

/**
 * Get all clinical notes for a patient (OLD - OpenEMR forms)
 * @param {string} patientId - The patient ID
 */
export async function getClinicalNotes(patientId) {
  console.log('Fetching clinical notes for patient ID:', patientId);
  return apiRequest(`/custom/api/clinical_notes.php?patient_id=${patientId}`);
}

// ========================================
// PHASE 4: CLINICAL NOTES API (New System)
// ========================================

/**
 * Create a new clinical note
 * @param {object} data - Note data
 */
export async function createNote(data) {
  console.log('Creating clinical note:', data);
  return apiRequest('/custom/api/notes/create_note.php', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Get all clinical notes for a patient (new system)
 * @param {number} patientId - Patient ID
 * @param {object} filters - Optional filters (note_type, status, start_date, end_date)
 */
export async function getPatientNotes(patientId, filters = {}) {
  console.log('Fetching patient notes for ID:', patientId);
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
 */
export async function getNote(identifier, isUuid = false) {
  console.log('Fetching note:', identifier);
  const param = isUuid ? `note_uuid=${identifier}` : `note_id=${identifier}`;
  return apiRequest(`/custom/api/notes/get_note.php?${param}`);
}

/**
 * Update a clinical note
 * @param {number} noteId - Note ID
 * @param {object} data - Note data to update
 */
export async function updateNote(noteId, data) {
  console.log('Updating note:', noteId);
  return apiRequest('/custom/api/notes/update_note.php', {
    method: 'POST',
    body: JSON.stringify({ noteId, ...data })
  });
}

/**
 * Auto-save note draft
 * @param {object} data - Draft data
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
 * @param {object} signatureData - Optional signature details
 */
export async function signNote(noteId, signatureData = null) {
  console.log('Signing note:', noteId);
  return apiRequest('/custom/api/notes/sign_note.php', {
    method: 'POST',
    body: JSON.stringify({ noteId, signatureData })
  });
}

/**
 * Delete note (unsigned notes only)
 * @param {number} noteId - Note ID to delete
 */
export async function deleteNote(noteId) {
  console.log('Deleting note:', noteId);
  return apiRequest('/custom/api/notes/delete_note.php', {
    method: 'DELETE',
    body: JSON.stringify({ note_id: noteId })
  });
}

/**
 * Get intervention library
 * @param {object} filters - Optional filters (tier, modality, include_inactive)
 */
export async function getInterventions(filters = {}) {
  console.log('Fetching interventions');
  const params = new URLSearchParams();

  if (filters.tier) params.append('tier', filters.tier);
  if (filters.modality) params.append('modality', filters.modality);
  if (filters.include_inactive) params.append('include_inactive', filters.include_inactive);

  const query = params.toString();
  return apiRequest(`/custom/api/notes/get_interventions.php${query ? '?' + query : ''}`);
}

/**
 * Get treatment goals for a patient
 * @param {number} patientId - Patient ID
 * @param {object} filters - Optional filters (status, include_all)
 */
export async function getTreatmentGoals(patientId, filters = {}) {
  console.log('Fetching treatment goals for patient:', patientId);
  const params = new URLSearchParams({ patient_id: patientId });

  if (filters.status) params.append('status', filters.status);
  if (filters.include_all) params.append('include_all', filters.include_all);

  return apiRequest(`/custom/api/notes/get_treatment_goals.php?${params.toString()}`);
}

/**
 * Search diagnosis/procedure codes (ICD-10, CPT, etc.)
 * @param {string} searchTerm - Search term for code or description
 * @param {string} codeType - Code type (ICD10, CPT4, etc.)
 * @param {number} limit - Maximum results to return
 */
export async function searchCodes(searchTerm, codeType = 'ICD10', limit = 50) {
  console.log('Searching codes:', { searchTerm, codeType, limit });
  const params = new URLSearchParams({
    search: searchTerm,
    code_type: codeType,
    limit: limit.toString()
  });

  return apiRequest(`/custom/api/search_codes.php?${params.toString()}`);
}

/**
 * Get saved draft for a note
 * @param {object} params - Query params (note_id, appointment_id, or patient_id)
 */
export async function getDraft(params) {
  console.log('Fetching draft:', params);
  const queryParams = new URLSearchParams();

  if (params.note_id) queryParams.append('note_id', params.note_id);
  if (params.appointment_id) queryParams.append('appointment_id', params.appointment_id);
  if (params.patient_id) queryParams.append('patient_id', params.patient_id);

  return apiRequest(`/custom/api/notes/get_draft.php?${queryParams.toString()}`);
}

/**
 * Create an addendum to a locked note
 * @param {number} parentNoteId - Parent note ID
 * @param {string} addendumReason - Reason for addendum
 * @param {string} addendumContent - Addendum content
 */
export async function createAddendum(parentNoteId, addendumReason, addendumContent) {
  console.log('Creating addendum for note:', parentNoteId);
  return apiRequest('/custom/api/notes/create_addendum.php', {
    method: 'POST',
    body: JSON.stringify({ parentNoteId, addendumReason, addendumContent })
  });
}

/**
 * Get clinical documentation system settings
 */
export async function getClinicalSettings() {
  console.log('Fetching clinical settings');
  return apiRequest('/custom/api/notes/get_clinical_settings.php');
}

/**
 * Get all billing information for a patient
 * @param {string} patientId - The patient ID
 */
export async function getBilling(patientId) {
  console.log('Fetching billing for patient ID:', patientId);
  return apiRequest(`/custom/api/billing.php?patient_id=${patientId}`);
}

/**
 * Update patient demographics
 * @param {string} patientId - The patient ID
 * @param {object} data - The demographic data to update
 */
export async function updateDemographics(patientId, data) {
  console.log('Updating demographics for patient ID:', patientId);
  return apiRequest('/custom/api/update_demographics.php', {
    method: 'POST',
    body: JSON.stringify({
      patient_id: patientId,
      ...data
    })
  });
}

/**
 * Create a new client/patient
 * @param {object} data - The client data
 */
export async function createClient(data) {
  console.log('Creating new client:', data.fname, data.lname);
  return apiRequest('/custom/api/create_client.php', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Get dropdown options from OpenEMR's list_options table
 * @param {string} listId - The list_id to fetch (e.g., 'sex', 'gender_identity', 'sexual_orientation', 'marital_status', 'pt_protect_indica')
 */
export async function getListOptions(listId) {
  console.log('Fetching list options for:', listId);
  return apiRequest(`/custom/api/get_list_options.php?list_id=${listId}`);
}

/**
 * Get list of active providers/clinicians
 */
export async function getProviders() {
  console.log('Fetching providers list');
  return apiRequest('/custom/api/get_providers.php');
}

/**
 * Get all related persons (guardians) for a patient
 * @param {number} patientId - The patient ID
 */
export async function getRelatedPersons(patientId) {
  console.log('Fetching related persons for patient:', patientId);
  return apiRequest(`/custom/api/get_related_persons.php?patient_id=${patientId}`);
}

/**
 * Save a related person (guardian) for a patient
 * @param {object} data - The related person data including patient_id, first_name, last_name, role, etc.
 */
export async function saveRelatedPerson(data) {
  console.log('Saving related person:', data);
  return apiRequest('/custom/api/save_related_person.php', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Delete a related person (guardian) relationship
 * @param {number} relationId - The contact_relation ID to delete
 */
export async function deleteRelatedPerson(relationId) {
  console.log('Deleting related person relation:', relationId);
  return apiRequest('/custom/api/delete_related_person.php', {
    method: 'POST',
    body: JSON.stringify({ relation_id: relationId })
  });
}

/**
 * Update insurance data for a patient
 * @param {number} insuranceId - The insurance record ID
 * @param {object} data - The insurance data to update
 */
export async function updateInsurance(insuranceId, data) {
  console.log('Updating insurance ID:', insuranceId);
  return apiRequest('/custom/api/update_insurance.php', {
    method: 'POST',
    body: JSON.stringify({
      insurance_id: insuranceId,
      ...data
    })
  });
}

/**
 * Get insurance companies list
 */
export async function getInsuranceCompanies() {
  console.log('Fetching insurance companies list');
  return apiRequest('/custom/api/get_insurance_companies.php');
}

/**
 * Get calendar settings (start/end hours, interval)
 */
export async function getCalendarSettings() {
  console.log('Fetching calendar settings');
  return apiRequest('/custom/api/get_calendar_settings.php');
}

/**
 * Update calendar settings
 * @param {Object} settings - Calendar settings object
 */
export async function updateCalendarSettings(settings) {
  console.log('Updating calendar settings:', settings);
  return apiRequest('/custom/api/update_calendar_settings.php', {
    method: 'POST',
    body: JSON.stringify(settings)
  });
}

/**
 * Get appointments for calendar view
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {number|string} providerId - Optional provider ID to filter by
 */
export async function getAppointments(startDate, endDate, providerId = null) {
  console.log('Fetching appointments from', startDate, 'to', endDate);
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate
  });

  if (providerId && providerId !== 'all') {
    params.append('provider_id', providerId);
  }

  return apiRequest(`/custom/api/get_appointments.php?${params.toString()}`);
}

/**
 * Get appointment categories/types
 * @param {number} type - Optional category type filter
 *   0 = Patient/Client appointments (default)
 *   1 = Provider availability/blocking
 *   2 = Group therapy
 *   3 = Clinic/Facility events
 */
export async function getAppointmentCategories(type = 0) {
  console.log('Fetching appointment categories (type:', type, ')');
  const params = type !== null ? `?type=${type}` : '';
  return apiRequest(`/custom/api/get_appointment_categories.php${params}`);
}

/**
 * Get rooms/locations list
 */
export async function getRooms() {
  console.log('Fetching rooms list');
  return apiRequest('/custom/api/get_rooms.php');
}

/**
 * Create a new appointment
 * @param {Object} data - Appointment data
 * @param {number} data.patientId - Patient ID
 * @param {number} data.providerId - Provider ID
 * @param {number} data.categoryId - Appointment category/type ID
 * @param {string} data.eventDate - Appointment date (YYYY-MM-DD)
 * @param {string} data.startTime - Start time (HH:MM:SS)
 * @param {number} data.duration - Duration in minutes
 * @param {string} data.title - Optional appointment title
 * @param {string} data.comments - Optional comments
 * @param {string} data.apptstatus - Optional appointment status
 * @param {string} data.room - Optional room number
 * @param {number} data.facilityId - Optional facility ID
 */
export async function createAppointment(data) {
  console.log('Creating appointment:', data);
  return apiRequest('/custom/api/create_appointment.php', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Update an existing appointment
 * @param {number} appointmentId - The appointment ID to update
 * @param {object} data - Appointment data (same structure as createAppointment)
 */
export async function updateAppointment(appointmentId, data) {
  console.log('Updating appointment:', appointmentId, data);
  return apiRequest('/custom/api/update_appointment.php', {
    method: 'POST',
    body: JSON.stringify({ appointmentId, ...data })
  });
}

/**
 * Delete an appointment or availability block
 * @param {number} appointmentId - The appointment ID to delete
 * @param {object} seriesData - Optional series data for recurring appointments (scope, recurrenceId)
 */
export async function deleteAppointment(appointmentId, seriesData = null) {
  console.log('Deleting appointment:', appointmentId, seriesData);
  return apiRequest('/custom/api/delete_appointment.php', {
    method: 'POST',
    body: JSON.stringify({ appointmentId, seriesData })
  });
}

/**
 * Logout the current user
 */
export async function logout() {
  try {
    await fetch('/custom/api/session_logout.php', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear local storage
    localStorage.removeItem('user');
    // Redirect to login
    window.location.href = '/app/';
  }
}
