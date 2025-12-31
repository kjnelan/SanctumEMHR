// API utility for making authenticated requests to OpenEMR

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

  if (!response.ok) {
    if (response.status === 401) {
      // Session expired or not authenticated → logout
      if (!options.noRedirect) {
        localStorage.removeItem('user');
        window.location.href = '/app/';
      }
      throw new Error('Authentication required');
    }
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
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
 * Get all clinical notes for a patient
 * @param {string} patientId - The patient ID
 */
export async function getClinicalNotes(patientId) {
  console.log('Fetching clinical notes for patient ID:', patientId);
  return apiRequest(`/custom/api/clinical_notes.php?patient_id=${patientId}`);
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
 */
export async function getAppointmentCategories() {
  console.log('Fetching appointment categories');
  return apiRequest('/custom/api/get_appointment_categories.php');
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
