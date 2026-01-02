/**
 * Mindline EMHR
 * AppointmentModal - Modal component for creating appointments
 * Features patient search, provider selection, date/time pickers
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React, { useState, useEffect } from 'react';
import { createAppointment, updateAppointment, getAppointmentCategories, searchPatients, getRooms } from '../../utils/api';

/**
 * Props:
 * - isOpen: boolean - Whether modal is open
 * - onClose: function - Close modal callback
 * - onSave: function - Save appointment callback
 * - initialDate: string - Initial date (YYYY-MM-DD)
 * - initialTime: string - Initial time (HH:MM)
 * - providerId: number - Pre-selected provider ID
 * - providers: array - List of providers
 * - appointment: object - Existing appointment to edit (optional)
 */
function AppointmentModal({ isOpen, onClose, onSave, initialDate, initialTime, providerId, providers, appointment }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form fields
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(providerId || '');
  const [categoryId, setCategoryId] = useState('');
  const [eventDate, setEventDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(initialTime || '09:00');
  const [duration, setDuration] = useState(50); // Default 50 minutes
  const [title, setTitle] = useState('');
  const [comments, setComments] = useState('');
  const [room, setRoom] = useState('');

  // Dropdown data
  const [categories, setCategories] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');

  // Load appointment categories and rooms on mount
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadRooms();
    }
  }, [isOpen]);

  // Update provider when prop changes
  useEffect(() => {
    if (providerId) {
      setSelectedProvider(providerId);
    }
  }, [providerId]);

  // Update date/time when props change
  useEffect(() => {
    if (initialDate) setEventDate(initialDate);
    if (initialTime) setStartTime(initialTime);
  }, [initialDate, initialTime]);

  // Populate form when editing existing appointment
  useEffect(() => {
    if (appointment && isOpen) {
      setPatientId(appointment.patientId || '');
      setPatientName(appointment.patientName || '');
      setPatientSearchQuery(appointment.patientName || '');
      setSelectedProvider(appointment.providerId || '');
      setCategoryId(appointment.categoryId || '');
      setEventDate(appointment.eventDate || '');
      setStartTime(appointment.startTime ? appointment.startTime.substring(0, 5) : ''); // HH:MM format
      setDuration(appointment.duration || 50);
      setTitle(appointment.title || '');
      setComments(appointment.comments || '');
      setRoom(appointment.room || '');
    }
  }, [appointment, isOpen]);

  const loadCategories = async () => {
    try {
      const response = await getAppointmentCategories();
      setCategories(response.categories || []);

      // Auto-select first category if available AND we're not editing an existing appointment
      if (response.categories && response.categories.length > 0 && !appointment) {
        setCategoryId(response.categories[0].id);
        // Set default duration from category
        if (response.categories[0].defaultDuration > 0) {
          setDuration(response.categories[0].defaultDuration / 60); // Convert seconds to minutes
        }
      }
    } catch (err) {
      console.error('Failed to load appointment categories:', err);
      setError('Failed to load appointment types');
    }
  };

  const loadRooms = async () => {
    try {
      const response = await getRooms();
      setRooms(response.rooms || []);
    } catch (err) {
      console.error('Failed to load rooms:', err);
      // Don't set error - rooms are optional
    }
  };

  // Handle patient search
  const handlePatientSearch = async (query) => {
    setPatientSearchQuery(query);

    if (query.length < 2) {
      setPatientSearchResults([]);
      setShowPatientDropdown(false);
      return;
    }

    try {
      const results = await searchPatients(query);
      setPatientSearchResults(results || []);
      setShowPatientDropdown(true);
    } catch (err) {
      console.error('Patient search failed:', err);
      setPatientSearchResults([]);
    }
  };

  // Select patient from search results
  const selectPatient = (patient) => {
    setPatientId(patient.pid);
    setPatientName(`${patient.fname} ${patient.lname}`);
    setPatientSearchQuery(`${patient.fname} ${patient.lname}`);
    setShowPatientDropdown(false);
  };

  // Handle category change - update duration if category has default
  const handleCategoryChange = (catId) => {
    setCategoryId(catId);
    const category = categories.find(c => c.id === parseInt(catId));
    if (category && category.defaultDuration > 0) {
      setDuration(category.defaultDuration / 60); // Convert seconds to minutes
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (!patientId) {
      setError('Please select a patient');
      setLoading(false);
      return;
    }

    if (!selectedProvider) {
      setError('Please select a provider');
      setLoading(false);
      return;
    }

    if (!categoryId) {
      setError('Please select an appointment type');
      setLoading(false);
      return;
    }

    try {
      // Format time for API (HH:MM:SS)
      const formattedTime = startTime.includes(':') ? `${startTime}:00` : `${startTime}:00:00`;

      const appointmentData = {
        patientId: parseInt(patientId),
        providerId: parseInt(selectedProvider),
        categoryId: parseInt(categoryId),
        eventDate: eventDate,
        startTime: formattedTime,
        duration: parseInt(duration),
        title: title || patientName, // Use patient name as default title
        comments: comments,
        room: room,
        apptstatus: appointment ? appointment.apptstatus : '-' // Preserve status when editing, default for new
      };

      console.log(appointment ? 'Updating appointment:' : 'Creating appointment:', appointmentData);

      const response = appointment
        ? await updateAppointment(appointment.id, appointmentData)
        : await createAppointment(appointmentData);

      if (response.success) {
        setSuccess(appointment ? 'Appointment updated successfully!' : 'Appointment created successfully!');

        // Call onSave callback with appointment
        if (onSave) {
          onSave(response.appointment);
        }

        // Close modal after short delay
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setError(response.message || `Failed to ${appointment ? 'update' : 'create'} appointment`);
      }
    } catch (err) {
      console.error(`Failed to ${appointment ? 'update' : 'create'} appointment:`, err);
      setError(err.message || `Failed to ${appointment ? 'update' : 'create'} appointment`);
    } finally {
      setLoading(false);
    }
  };

  // Reset form and close modal
  const handleClose = () => {
    setPatientId('');
    setPatientName('');
    setPatientSearchQuery('');
    setCategoryId('');
    setTitle('');
    setComments('');
    setRoom('');
    setError(null);
    setSuccess(null);
    setPatientSearchResults([]);
    setShowPatientDropdown(false);
    onClose();
  };

  if (!isOpen) return null;

  // Duration presets in minutes
  const durationPresets = [15, 30, 50, 90];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="flex min-h-screen items-start justify-center p-4 pt-8">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity"
          onClick={handleClose}
          aria-hidden="true"
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 border border-gray-200 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 px-8 pt-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {appointment ? 'Edit Appointment' : 'New Appointment'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {appointment ? 'Update appointment details' : 'Schedule a new appointment'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/80 rounded-xl transition-all hover:scale-110"
            disabled={loading}
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <div className="px-8 pb-8">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg text-green-700 flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Search */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={patientSearchQuery}
              onChange={(e) => handlePatientSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />

            {/* Patient Search Results Dropdown */}
            {showPatientDropdown && patientSearchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {patientSearchResults.map((patient) => (
                  <button
                    key={patient.pid}
                    type="button"
                    onClick={() => selectPatient(patient)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">
                      {patient.fname} {patient.lname}
                    </div>
                    <div className="text-sm text-gray-600">
                      DOB: {patient.DOB} • PID: {patient.pid}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {patientName && (
              <div className="mt-2 text-sm text-green-600">
                Selected: {patientName}
              </div>
            )}
          </div>

          {/* Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Provider</option>
              {providers.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          {/* Appointment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment Type <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Type</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time - Side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Duration and Room - Side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              {/* Duration preset buttons */}
              <div className="flex flex-wrap gap-2 mb-3">
                {durationPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDuration(preset)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      duration === preset
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {preset}m
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="5"
                step="5"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Select Location (Optional)</option>
                {rooms.map((roomOption) => (
                  <option key={roomOption.id} value={roomOption.value}>
                    {roomOption.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Defaults to client name if left blank"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              placeholder="Optional notes about this appointment"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 mt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all hover:shadow-md"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (appointment ? 'Updating...' : 'Creating...') : (appointment ? 'Update Appointment' : 'Create Appointment')}
            </button>
          </div>
        </form>
      </div>
        </div>
      </div>
    </div>
  );
}

export default AppointmentModal;
