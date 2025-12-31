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
import { createAppointment, getAppointmentCategories, searchPatients } from '../../utils/api';

/**
 * Props:
 * - isOpen: boolean - Whether modal is open
 * - onClose: function - Close modal callback
 * - onSave: function - Save appointment callback
 * - initialDate: string - Initial date (YYYY-MM-DD)
 * - initialTime: string - Initial time (HH:MM)
 * - providerId: number - Pre-selected provider ID
 * - providers: array - List of providers
 */
function AppointmentModal({ isOpen, onClose, onSave, initialDate, initialTime, providerId, providers }) {
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
  const [duration, setDuration] = useState(60); // Default 60 minutes
  const [title, setTitle] = useState('');
  const [comments, setComments] = useState('');
  const [room, setRoom] = useState('');

  // Dropdown data
  const [categories, setCategories] = useState([]);
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');

  // Load appointment categories on mount
  useEffect(() => {
    if (isOpen) {
      loadCategories();
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

  const loadCategories = async () => {
    try {
      const response = await getAppointmentCategories();
      setCategories(response.categories || []);

      // Auto-select first category if available
      if (response.categories && response.categories.length > 0) {
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
        apptstatus: '-' // Default status
      };

      console.log('Creating appointment:', appointmentData);
      const response = await createAppointment(appointmentData);

      if (response.success) {
        setSuccess('Appointment created successfully!');

        // Call onSave callback with new appointment
        if (onSave) {
          onSave(response.appointment);
        }

        // Close modal after short delay
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setError(response.message || 'Failed to create appointment');
      }
    } catch (err) {
      console.error('Failed to create appointment:', err);
      setError(err.message || 'Failed to create appointment');
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

  return (
    <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/20">
          <h2 className="text-2xl font-bold text-gray-900">New Appointment</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-300 rounded-lg text-green-700">
            {success}
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
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="5"
                step="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Optional"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
          <div className="flex gap-4 pt-4 border-t border-white/20">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AppointmentModal;
