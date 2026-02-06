/**
 * ClientService.js
 * Centralized service for all client-related API operations
 *
 * This service wraps the base API functions and provides:
 * - Unified import point for client operations
 * - Error handling and logging
 * - Future: caching, retry logic, data transformations
 */

import {
  searchPatients as apiSearchPatients,
  getClientStats as apiGetClientStats,
  getClients as apiGetClients,
  getClientDetail as apiGetClientDetail,
  createClient as apiCreateClient,
  updateDemographics as apiUpdateDemographics,
  getRelatedPersons as apiGetRelatedPersons,
  saveRelatedPerson as apiSaveRelatedPerson,
  deleteRelatedPerson as apiDeleteRelatedPerson,
  getBilling as apiGetBilling,
  updateInsurance as apiUpdateInsurance,
  getInsuranceCompanies as apiGetInsuranceCompanies
} from '../utils/api';

/**
 * Search for patients/clients by name
 * @param {string} query - Search term
 * @returns {Promise<Array>} Array of matching clients
 */
export const searchClients = async (query) => {
  try {
    const results = await apiSearchPatients(query);
    return results || [];
  } catch (error) {
    console.error('ClientService: Error searching clients:', error);
    throw error;
  }
};

/**
 * Get client statistics (active, inactive, discharged counts)
 * @returns {Promise<Object>} Stats object
 */
export const getClientStats = async () => {
  try {
    const stats = await apiGetClientStats();
    return stats;
  } catch (error) {
    console.error('ClientService: Error fetching client stats:', error);
    throw error;
  }
};

/**
 * Get list of clients filtered by status
 * @param {string} status - Filter: 'active', 'inactive', 'discharged', 'all'
 * @returns {Promise<Array>} Array of clients
 */
export const getClients = async (status = 'all') => {
  try {
    const clients = await apiGetClients(status);
    return clients || [];
  } catch (error) {
    console.error('ClientService: Error fetching clients:', error);
    throw error;
  }
};

/**
 * Get detailed information for a specific client
 * @param {number|string} clientId - Patient ID
 * @returns {Promise<Object>} Client detail object
 */
export const getClientDetail = async (clientId) => {
  try {
    const detail = await apiGetClientDetail(clientId);
    return detail;
  } catch (error) {
    console.error('ClientService: Error fetching client detail:', error);
    throw error;
  }
};

/**
 * Create a new client
 * @param {Object} data - Client data (fname, lname, DOB, etc.)
 * @returns {Promise<Object>} Created client with ID
 */
export const createClient = async (data) => {
  try {
    const result = await apiCreateClient(data);
    return result;
  } catch (error) {
    console.error('ClientService: Error creating client:', error);
    throw error;
  }
};

/**
 * Update client demographics
 * @param {number|string} clientId - Patient ID
 * @param {Object} data - Updated demographic fields
 * @returns {Promise<Object>} Update result
 */
export const updateDemographics = async (clientId, data) => {
  try {
    const result = await apiUpdateDemographics(clientId, data);
    return result;
  } catch (error) {
    console.error('ClientService: Error updating demographics:', error);
    throw error;
  }
};

/**
 * Get related persons (emergency contacts, guardians, etc.)
 * @param {number|string} clientId - Patient ID
 * @returns {Promise<Array>} Array of related persons
 */
export const getRelatedPersons = async (clientId) => {
  try {
    const persons = await apiGetRelatedPersons(clientId);
    return persons || [];
  } catch (error) {
    console.error('ClientService: Error fetching related persons:', error);
    throw error;
  }
};

/**
 * Save a related person (create or update)
 * @param {Object} data - Related person data
 * @returns {Promise<Object>} Save result
 */
export const saveRelatedPerson = async (data) => {
  try {
    const result = await apiSaveRelatedPerson(data);
    return result;
  } catch (error) {
    console.error('ClientService: Error saving related person:', error);
    throw error;
  }
};

/**
 * Delete a related person
 * @param {number|string} relationId - Relation ID
 * @returns {Promise<Object>} Delete result
 */
export const deleteRelatedPerson = async (relationId) => {
  try {
    const result = await apiDeleteRelatedPerson(relationId);
    return result;
  } catch (error) {
    console.error('ClientService: Error deleting related person:', error);
    throw error;
  }
};

/**
 * Get billing information for a client
 * @param {number|string} clientId - Patient ID
 * @returns {Promise<Object>} Billing data
 */
export const getBilling = async (clientId) => {
  try {
    const billing = await apiGetBilling(clientId);
    return billing;
  } catch (error) {
    console.error('ClientService: Error fetching billing:', error);
    throw error;
  }
};

/**
 * Update insurance information
 * @param {number|string} insuranceId - Insurance record ID
 * @param {Object} data - Updated insurance fields
 * @returns {Promise<Object>} Update result
 */
export const updateInsurance = async (insuranceId, data) => {
  try {
    const result = await apiUpdateInsurance(insuranceId, data);
    return result;
  } catch (error) {
    console.error('ClientService: Error updating insurance:', error);
    throw error;
  }
};

/**
 * Get list of insurance companies
 * @returns {Promise<Array>} Array of insurance companies
 */
export const getInsuranceCompanies = async () => {
  try {
    const companies = await apiGetInsuranceCompanies();
    return companies || [];
  } catch (error) {
    console.error('ClientService: Error fetching insurance companies:', error);
    throw error;
  }
};
