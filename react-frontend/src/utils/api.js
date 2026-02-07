/**
 * SanctumEMHR EMHR
 * API utility for making authenticated requests
 * Session-based authentication with automatic redirect on 401
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 *
 * NOTE: Domain-specific API functions have been moved to dedicated services:
 * - AuthService.js: Authentication (getUserDetails, getCurrentUser, logout)
 * - CalendarService.js: Scheduling (getAppointments, createAppointment, etc.)
 * - ClientService.js: Client management (searchClients, getClientDetail, etc.)
 * - NoteService.js: Clinical notes (createNote, signNote, etc.)
 */

/**
 * Make an authenticated API request using session cookies
 * This is the core utility used by all service modules
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

// ========================================
// SHARED UTILITIES
// These are used across multiple domains and don't belong to a single service
// ========================================

/**
 * Get dropdown options from OpenEMR's list_options table
 * @param {string} listId - The list_id to fetch (e.g., 'sex', 'gender_identity', 'marital_status')
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
 * Get supervisees for a given supervisor
 */
export async function getSupervisees(supervisorId) {
  console.log('Fetching supervisees for supervisor:', supervisorId);
  return apiRequest(`/custom/api/get_supervisees.php?supervisor_id=${supervisorId}`);
}

/**
 * Get detailed encounter information
 * @param {string} encounterId - The encounter ID
 */
export async function getEncounterDetail(encounterId) {
  console.log('Fetching encounter detail for ID:', encounterId);
  return apiRequest(`/custom/api/encounter_detail.php?encounter_id=${encounterId}`);
}
