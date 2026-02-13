/**
 * ReportService.js
 * Centralized service for reporting and analytics API operations
 *
 * This service handles:
 * - Appointment statistics
 * - Clinical notes statistics
 * - Provider productivity
 * - Client flow analytics
 */

import { apiRequest } from '../utils/api';

/**
 * Get all report data
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} All report data
 */
export async function getAllReports(startDate, endDate) {
  console.log('ReportService: Fetching all reports from', startDate, 'to', endDate);
  const params = new URLSearchParams({
    action: 'all',
    start_date: startDate,
    end_date: endDate
  });
  return apiRequest(`/custom/api/reports.php?${params.toString()}`);
}

/**
 * Get appointment statistics
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Appointment statistics
 */
export async function getAppointmentStats(startDate, endDate) {
  console.log('ReportService: Fetching appointment stats');
  const params = new URLSearchParams({
    action: 'appointments',
    start_date: startDate,
    end_date: endDate
  });
  return apiRequest(`/custom/api/reports.php?${params.toString()}`);
}

/**
 * Get clinical notes statistics
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Notes statistics
 */
export async function getNoteStats(startDate, endDate) {
  console.log('ReportService: Fetching note stats');
  const params = new URLSearchParams({
    action: 'notes',
    start_date: startDate,
    end_date: endDate
  });
  return apiRequest(`/custom/api/reports.php?${params.toString()}`);
}

/**
 * Get provider productivity data
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Provider productivity data
 */
export async function getProviderProductivity(startDate, endDate) {
  console.log('ReportService: Fetching provider productivity');
  const params = new URLSearchParams({
    action: 'productivity',
    start_date: startDate,
    end_date: endDate
  });
  return apiRequest(`/custom/api/reports.php?${params.toString()}`);
}

/**
 * Get client flow statistics
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} Client flow data
 */
export async function getClientFlowStats(startDate, endDate) {
  console.log('ReportService: Fetching client flow stats');
  const params = new URLSearchParams({
    action: 'clientFlow',
    start_date: startDate,
    end_date: endDate
  });
  return apiRequest(`/custom/api/reports.php?${params.toString()}`);
}

/**
 * Get client demographics breakdown (Age, Gender, Race, Ethnicity)
 * @returns {Promise<Object>} Demographics data
 */
export async function getClientDemographics() {
  console.log('ReportService: Fetching demographic breakdown');
  return apiRequest('/custom/api/client_demographics.php');
}
