/**
 * ClientService.js
 * Centralized service for all client-related API operations
 *
 * This service handles:
 * - Client search and listing
 * - Demographics management
 * - Related persons (guardians, emergency contacts)
 * - Billing and insurance
 */

import { apiRequest } from '../utils/api';

// ========================================
// CLIENT SEARCH & LISTING
// ========================================

/**
 * Search for patients/clients by name
 * @param {string} query - Search term (name, DOB, etc.)
 * @returns {Promise<Array>} Array of matching clients
 */
export async function searchClients(query) {
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

  return apiRequest(`/custom/api/patient_search.php?${searchParams.toString()}`);
}

/**
 * Get client statistics (active, inactive, discharged counts)
 * @returns {Promise<Object>} Stats object
 */
export async function getClientStats() {
  return apiRequest('/custom/api/client_stats.php');
}

/**
 * Get client demographics breakdown
 * @returns {Promise<Object>} Demographics data
 */
export async function getClientDemographics() {
  return apiRequest('/custom/api/client_demographics.php');
}

/**
 * Get list of clients filtered by status
 * @param {string} status - Filter: 'active', 'inactive', 'discharged', 'all'
 * @returns {Promise<Array>} Array of clients
 */
export async function getClients(status = 'all') {
  const params = status !== 'all' ? `?status=${status}` : '';
  return apiRequest(`/custom/api/client_list.php${params}`);
}

/**
 * Get detailed client information
 * Handles access denied responses with accessInfo for UI display
 * @param {string} clientId - The patient ID
 * @returns {Promise<Object>} Client detail object
 */
export async function getClientDetail(clientId) {
  console.log('ClientService: Fetching client detail for ID:', clientId);

  const response = await fetch(`/custom/api/client_detail.php?id=${clientId}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  // Handle 403 (access denied) specially - return the accessInfo for UI display
  if (response.status === 403 && data.accessDenied) {
    return {
      accessDenied: true,
      accessInfo: data.accessInfo
    };
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/app/';
      throw new Error('Authentication required');
    }
    throw new Error(data.message || data.error || `API request failed: ${response.statusText}`);
  }

  return data;
}

// ========================================
// CLIENT CRUD
// ========================================

/**
 * Create a new client/patient
 * @param {Object} data - The client data (fname, lname, DOB, etc.)
 * @returns {Promise<Object>} Created client with ID
 */
export async function createClient(data) {
  console.log('ClientService: Creating new client:', data.fname, data.lname);
  return apiRequest('/custom/api/create_client.php', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Update client demographics
 * @param {string} patientId - The patient ID
 * @param {Object} data - The demographic data to update
 * @returns {Promise<Object>} Update result
 */
export async function updateDemographics(patientId, data) {
  console.log('ClientService: Updating demographics for patient ID:', patientId);
  return apiRequest('/custom/api/update_demographics.php', {
    method: 'POST',
    body: JSON.stringify({
      patient_id: patientId,
      ...data
    })
  });
}

// ========================================
// RELATED PERSONS (GUARDIANS, CONTACTS)
// ========================================

/**
 * Get all related persons (guardians) for a patient
 * @param {number} patientId - The patient ID
 * @returns {Promise<Array>} Array of related persons
 */
export async function getRelatedPersons(patientId) {
  console.log('ClientService: Fetching related persons for patient:', patientId);
  return apiRequest(`/custom/api/get_related_persons.php?patient_id=${patientId}`);
}

/**
 * Save a related person (guardian) for a patient
 * @param {Object} data - The related person data including patient_id, first_name, last_name, role, etc.
 * @returns {Promise<Object>} Save result
 */
export async function saveRelatedPerson(data) {
  console.log('ClientService: Saving related person:', data);
  return apiRequest('/custom/api/save_related_person.php', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Delete a related person (guardian) relationship
 * @param {number} relationId - The contact_relation ID to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteRelatedPerson(relationId) {
  console.log('ClientService: Deleting related person relation:', relationId);
  return apiRequest('/custom/api/delete_related_person.php', {
    method: 'POST',
    body: JSON.stringify({ relation_id: relationId })
  });
}

// ========================================
// BILLING & INSURANCE
// ========================================

/**
 * Get all billing information for a patient
 * @param {string} patientId - The patient ID
 * @returns {Promise<Object>} Billing data
 */
export async function getBilling(patientId) {
  console.log('ClientService: Fetching billing for patient ID:', patientId);
  return apiRequest(`/custom/api/billing.php?patient_id=${patientId}`);
}

/**
 * Update insurance data for a patient
 * @param {number} insuranceId - The insurance record ID
 * @param {Object} data - The insurance data to update
 * @returns {Promise<Object>} Update result
 */
export async function updateInsurance(insuranceId, data) {
  console.log('ClientService: Updating insurance ID:', insuranceId);
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
 * @returns {Promise<Array>} Array of insurance companies
 */
export async function getInsuranceCompanies() {
  console.log('ClientService: Fetching insurance companies list');
  return apiRequest('/custom/api/get_insurance_companies.php');
}
