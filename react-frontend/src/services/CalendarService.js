/**
 * CalendarService.js
 * Centralized service for calendar and scheduling operations
 *
 * This service handles:
 * - Appointment CRUD operations
 * - Calendar settings
 * - Appointment categories and rooms
 */

import { apiRequest } from '../utils/api';

// ========================================
// APPOINTMENTS
// ========================================

/**
 * Get appointments for calendar view
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {number|string} providerId - Optional provider ID to filter by
 * @returns {Promise<Object>} Appointments data
 */
export async function getAppointments(startDate, endDate, providerId = null) {
  console.log('CalendarService: Fetching appointments from', startDate, 'to', endDate);
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
 * Fetch today's appointments
 * @returns {Promise<Object>} Today's appointments
 */
export async function getTodaysAppointments() {
  const today = new Date().toISOString().split('T')[0];
  return getAppointments(today, today);
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
 * @returns {Promise<Object>} Created appointment
 */
export async function createAppointment(data) {
  console.log('CalendarService: Creating appointment:', data);
  return apiRequest('/custom/api/create_appointment.php', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Update an existing appointment
 * @param {number} appointmentId - The appointment ID to update
 * @param {object} data - Appointment data (same structure as createAppointment)
 * @returns {Promise<Object>} Update result
 */
export async function updateAppointment(appointmentId, data) {
  console.log('CalendarService: Updating appointment:', appointmentId, data);
  return apiRequest('/custom/api/update_appointment.php', {
    method: 'POST',
    body: JSON.stringify({ appointmentId, ...data })
  });
}

/**
 * Delete an appointment or availability block
 * @param {number} appointmentId - The appointment ID to delete
 * @param {object} seriesData - Optional series data for recurring appointments (scope, recurrenceId)
 * @returns {Promise<Object>} Delete result
 */
export async function deleteAppointment(appointmentId, seriesData = null) {
  console.log('CalendarService: Deleting appointment:', appointmentId, seriesData);
  return apiRequest('/custom/api/delete_appointment.php', {
    method: 'POST',
    body: JSON.stringify({ appointmentId, seriesData })
  });
}

// ========================================
// APPOINTMENT CATEGORIES & ROOMS
// ========================================

/**
 * Get appointment categories/types
 * @param {number} type - Optional category type filter
 *   0 = Patient/Client appointments (default)
 *   1 = Provider availability/blocking
 *   2 = Group therapy
 *   3 = Clinic/Facility events
 * @param {string} exclude - Optional categories to exclude
 * @returns {Promise<Array>} Categories list
 */
export async function getAppointmentCategories(type = 0, exclude = null) {
  console.log('CalendarService: Fetching appointment categories (type:', type, ', exclude:', exclude, ')');
  let params = [];
  if (type !== null) params.push(`type=${type}`);
  if (exclude !== null) params.push(`exclude=${exclude}`);
  const queryString = params.length > 0 ? `?${params.join('&')}` : '';
  return apiRequest(`/custom/api/get_appointment_categories.php${queryString}`);
}

/**
 * Get rooms/locations list
 * @returns {Promise<Array>} Rooms list
 */
export async function getRooms() {
  console.log('CalendarService: Fetching rooms list');
  return apiRequest('/custom/api/get_rooms.php');
}

// ========================================
// CALENDAR SETTINGS
// ========================================

/**
 * Get calendar settings (start/end hours, interval)
 * @returns {Promise<Object>} Calendar settings
 */
export async function getCalendarSettings() {
  console.log('CalendarService: Fetching calendar settings');
  return apiRequest('/custom/api/get_calendar_settings.php');
}

/**
 * Update calendar settings
 * @param {Object} settings - Calendar settings object
 * @returns {Promise<Object>} Update result
 */
export async function updateCalendarSettings(settings) {
  console.log('CalendarService: Updating calendar settings:', settings);
  return apiRequest('/custom/api/update_calendar_settings.php', {
    method: 'POST',
    body: JSON.stringify(settings)
  });
}
