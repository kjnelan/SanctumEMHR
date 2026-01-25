/**
 * SanctumEMHR EMHR
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
import { createAppointment, updateAppointment, deleteAppointment, getAppointmentCategories, searchPatients, getRooms, getSupervisees } from '../../utils/api';
import { FormLabel } from '../FormLabel';
import { RequiredAsterisk } from '../RequiredAsterisk';
import { ErrorMessage } from '../ErrorMessage';
import { DangerButton } from '../DangerButton';

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
  const [availabilityConflict, setAvailabilityConflict] = useState(null);
  const [recurrenceConflicts, setRecurrenceConflicts] = useState(null); // { conflicts: [], totalOccurrences: N }

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

  // Billing/CPT fields
  const [cptCodeId, setCptCodeId] = useState('');
  const [selectedCptCode, setSelectedCptCode] = useState(null);
  const [patientPaymentType, setPatientPaymentType] = useState(null);

  // Recurrence fields
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurDays, setRecurDays] = useState({ mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false });
  const [recurInterval, setRecurInterval] = useState('1'); // 1=weekly, 2=bi-weekly, 3=every 3 weeks, 4=every 4 weeks
  const [recurEndType, setRecurEndType] = useState('count'); // 'count' or 'date'
  const [recurCount, setRecurCount] = useState(10);
  const [recurEndDate, setRecurEndDate] = useState('');

  // Series management (for editing existing recurring appointments)
  const [isEditingRecurringSeries, setIsEditingRecurringSeries] = useState(false);
  const [seriesScope, setSeriesScope] = useState('single'); // 'single', 'all', 'future'
  const [currentRecurrenceId, setCurrentRecurrenceId] = useState(null);

  // Dropdown data
  const [categories, setCategories] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [supervisees, setSupervisees] = useState([]);
  const [selectedSupervisees, setSelectedSupervisees] = useState([]);

  // Load appointment categories and rooms on mount
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadRooms();
    }
  }, [isOpen]);

  // Debug: Log categories and rooms when they change
  useEffect(() => {
    console.log('Categories state updated:', categories);
  }, [categories]);

  useEffect(() => {
    console.log('Rooms state updated:', rooms);
  }, [rooms]);

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
      setRoom(appointment.roomId || appointment.room || ''); // Use roomId for editing, fallback to room
      setCptCodeId(appointment.cptCodeId || '');

      // Fetch patient payment type if we have a patient
      if (appointment.patientId) {
        fetch(`/custom/api/get_client.php?pid=${appointment.patientId}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.client) {
              setPatientPaymentType(data.client.payment_type || 'insurance');
            }
          })
          .catch(err => {
            console.error('Failed to fetch patient payment type:', err);
            setPatientPaymentType('insurance');
          });
      }

      // Check if this is part of a recurring series
      if (appointment.isRecurring && appointment.recurrenceId) {
        setIsEditingRecurringSeries(true);
        setCurrentRecurrenceId(appointment.recurrenceId);
        setSeriesScope('single'); // Default to editing just this occurrence
      } else {
        setIsEditingRecurringSeries(false);
        setCurrentRecurrenceId(null);
      }
    }
  }, [appointment, isOpen]);

  const loadCategories = async () => {
    try {
      const response = await getAppointmentCategories();
      console.log('getAppointmentCategories response:', response);
      console.log('Categories array:', response.categories);
      setCategories(response.categories || []);

      // Auto-select first category if available AND we're not editing an existing appointment
      if (response.categories && response.categories.length > 0 && !appointment) {
        console.log('Auto-selecting first category:', response.categories[0]);
        setCategoryId(response.categories[0].id);
        // Set default duration from category (already in minutes from API)
        if (response.categories[0].defaultDuration > 0) {
          setDuration(response.categories[0].defaultDuration);
        }
      } else {
        console.log('No categories to auto-select or editing existing appointment');
      }
    } catch (err) {
      console.error('Failed to load appointment categories:', err);
      setError('Failed to load appointment types');
    }
  };

  const loadRooms = async () => {
    try {
      const response = await getRooms();
      console.log('getRooms response:', response);
      console.log('Rooms array:', response.rooms);
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
  const selectPatient = async (patient) => {
    setPatientId(patient.pid);
    setPatientName(`${patient.fname} ${patient.lname}`);
    setPatientSearchQuery(`${patient.fname} ${patient.lname}`);
    setShowPatientDropdown(false);

    // Fetch patient's payment type for CPT requirement logic
    try {
      const response = await fetch(`/custom/api/get_client.php?pid=${patient.pid}`);
      const data = await response.json();
      if (data.success && data.client) {
        setPatientPaymentType(data.client.payment_type || 'insurance');
      }
    } catch (err) {
      console.error('Failed to fetch patient payment type:', err);
      setPatientPaymentType('insurance'); // Default to insurance if fetch fails
    }
  };

  // Handle category change - update duration and reset CPT selection
  const handleCategoryChange = (catId) => {
    setCategoryId(catId);
    const category = categories.find(c => c.id === parseInt(catId));

    // Reset CPT selection when category changes
    setCptCodeId('');
    setSelectedCptCode(null);

    // Reset patient/supervisee selections when changing category type
    setPatientId('');
    setPatientName('');
    setPatientSearchQuery('');
    setSelectedSupervisees([]);

    // Set default duration from category (already in minutes from API)
    if (category && category.defaultDuration > 0) {
      setDuration(category.defaultDuration);
    }
  };

  // Handle provider change - load supervisees if supervision category
  const handleProviderChange = async (provId) => {
    setSelectedProvider(provId);

    // If this is a supervision appointment and provider is selected, load supervisees
    const category = categories.find(c => c.id === parseInt(categoryId));
    if (category && category.name === 'Supervision' && provId) {
      try {
        const response = await getSupervisees(provId);
        setSupervisees(response.supervisees || []);
      } catch (err) {
        console.error('Failed to load supervisees:', err);
        setSupervisees([]);
      }
    } else {
      setSupervisees([]);
      setSelectedSupervisees([]);
    }
  };

  // Toggle supervisee selection for multi-select
  const toggleSupervisee = (superviseeId) => {
    setSelectedSupervisees(prev => {
      if (prev.includes(superviseeId)) {
        return prev.filter(id => id !== superviseeId);
      } else {
        return [...prev, superviseeId];
      }
    });
  };

  // Handle CPT code selection - auto-fill duration and fee
  const handleCptCodeChange = (cptId) => {
    setCptCodeId(cptId);
    const category = categories.find(c => c.id === parseInt(categoryId));
    if (category && category.linkedCptCodes) {
      const cptCode = category.linkedCptCodes.find(c => c.id === parseInt(cptId));
      setSelectedCptCode(cptCode);

      // Auto-fill duration from CPT code if available
      if (cptCode && cptCode.standardDuration > 0) {
        setDuration(cptCode.standardDuration);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e, overrideAvailability = false) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setAvailabilityConflict(null);

    // Validation - must select appointment type first
    if (!categoryId) {
      setError('Please select an appointment type');
      setLoading(false);
      return;
    }

    const category = categories.find(c => c.id === parseInt(categoryId));
    if (!category) {
      setError('Invalid appointment type');
      setLoading(false);
      return;
    }

    // Validate based on appointment type
    if (category.categoryType === 'client') {
      // Client appointments require patient and provider
      if (!patientId) {
        setError('Please select a client');
        setLoading(false);
        return;
      }
      if (!selectedProvider) {
        setError('Please select a provider');
        setLoading(false);
        return;
      }
    } else if (category.name === 'Supervision') {
      // Supervision requires provider (supervisor) and supervisees
      if (!selectedProvider) {
        setError('Please select a supervisor');
        setLoading(false);
        return;
      }
      if (selectedSupervisees.length === 0) {
        setError('Please select at least one supervisee');
        setLoading(false);
        return;
      }
    } else if (category.name !== 'Staff Meeting') {
      // Other clinic categories require provider (except Staff Meeting)
      if (!selectedProvider) {
        setError('Please select a provider');
        setLoading(false);
        return;
      }
    }

    // Validate CPT code if required (insurance patients with categories that require CPT)
    if (category && category.requiresCptSelection && patientPaymentType === 'insurance' && !cptCodeId) {
      setError('CPT code is required for insurance patients with this appointment type');
      setLoading(false);
      return;
    }

    // Validate recurrence fields if recurring is enabled
    if (isRecurring) {
      const selectedDays = Object.values(recurDays).filter(Boolean).length;
      if (selectedDays === 0) {
        setError('Please select at least one day for recurrence');
        setLoading(false);
        return;
      }
      if (recurEndType === 'date' && !recurEndDate) {
        setError('Please select an end date for recurrence');
        setLoading(false);
        return;
      }
      if (recurEndType === 'count' && (!recurCount || recurCount < 1)) {
        setError('Please enter a valid number of occurrences');
        setLoading(false);
        return;
      }
    }

    try {
      // Format time for API (HH:MM:SS)
      const formattedTime = startTime.includes(':') ? `${startTime}:00` : `${startTime}:00:00`;

      const appointmentData = {
        categoryId: parseInt(categoryId),
        eventDate: eventDate,
        startTime: formattedTime,
        duration: parseInt(duration),
        title: title || patientName || category.name, // Use patient name or category name as default
        comments: comments,
        room: room,
        apptstatus: appointment ? appointment.apptstatus : '-', // Preserve status when editing, default for new
        overrideAvailability: overrideAvailability, // Pass override flag
        // Conditional fields based on appointment type
        ...(patientId && { patientId: parseInt(patientId) }),
        ...(selectedProvider && { providerId: parseInt(selectedProvider) }),
        ...(selectedSupervisees.length > 0 && { superviseeIds: selectedSupervisees }),
        ...(cptCodeId && { cptCodeId: parseInt(cptCodeId) }),
        ...(selectedCptCode?.standardFee && { billingFee: selectedCptCode.standardFee }),
        ...(patientPaymentType && { patientPaymentType: patientPaymentType })
      };

      // Add series management data if editing a recurring series
      if (isEditingRecurringSeries) {
        appointmentData.seriesUpdate = {
          scope: seriesScope, // 'single', 'all', or 'future'
          recurrenceId: currentRecurrenceId
        };
      }

      // Add recurrence data if enabled (for new recurring appointments)
      if (isRecurring && !appointment) {
        appointmentData.recurrence = {
          enabled: true,
          days: recurDays,
          interval: parseInt(recurInterval),
          endType: recurEndType,
          endCount: recurEndType === 'count' ? parseInt(recurCount) : null,
          endDate: recurEndType === 'date' ? recurEndDate : null
        };
      }

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

      // Check if it's a recurrence conflict (409 status with conflicts array)
      if (err.conflicts) {
        setRecurrenceConflicts({
          conflicts: err.conflicts,
          totalOccurrences: err.totalOccurrences,
          conflictCount: err.conflictCount
        });
      }
      // Check if it's an availability conflict
      else if (err.message && err.message.includes('Provider is unavailable')) {
        setAvailabilityConflict(err.message);
      } else {
        setError(err.message || `Failed to ${appointment ? 'update' : 'create'} appointment`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle override confirmation for availability conflicts
  const handleOverride = () => {
    setAvailabilityConflict(null);
    handleSubmit(null, true); // Resubmit with override flag
  };

  // Handle override confirmation for recurrence conflicts
  const handleOverrideRecurrence = () => {
    setRecurrenceConflicts(null);
    handleSubmit(null, true); // Resubmit with override flag
  };

  // Handle delete appointment
  const handleDelete = async () => {
    if (!appointment) return;

    // Build confirmation message based on series scope
    let confirmMessage = `Are you sure you want to delete this appointment for ${patientName}?`;
    if (isEditingRecurringSeries) {
      if (seriesScope === 'all') {
        confirmMessage = `Are you sure you want to delete ALL occurrences in this recurring series for ${patientName}?`;
      } else if (seriesScope === 'future') {
        confirmMessage = `Are you sure you want to delete this and all future occurrences for ${patientName}?`;
      }
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Pass series data if deleting from a recurring series
      const deleteData = isEditingRecurringSeries ? {
        scope: seriesScope,
        recurrenceId: currentRecurrenceId
      } : null;

      const response = await deleteAppointment(appointment.id, deleteData);

      if (response.success) {
        const successMsg = isEditingRecurringSeries && seriesScope !== 'single'
          ? `${response.deletedCount || 'Multiple'} appointment(s) deleted successfully!`
          : 'Appointment deleted successfully!';
        setSuccess(successMsg);
        setTimeout(() => {
          handleClose();
          if (onSave) onSave();
        }, 1000);
      } else {
        setError(response.message || 'Failed to delete appointment');
      }
    } catch (err) {
      console.error('Failed to delete appointment:', err);
      setError(err.message || 'Failed to delete appointment');
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
    setAvailabilityConflict(null);
    setRecurrenceConflicts(null);
    setPatientSearchResults([]);
    setShowPatientDropdown(false);
    // Reset recurrence fields
    setIsRecurring(false);
    setRecurDays({ mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false });
    setRecurInterval('1');
    setRecurEndType('count');
    setRecurCount(10);
    setRecurEndDate('');
    // Reset series management fields
    setIsEditingRecurringSeries(false);
    setSeriesScope('single');
    setCurrentRecurrenceId(null);
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
      <div className="flex min-h-screen items-center justify-center p-4">
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
          {/* Error/Success/Warning Messages */}
          {availabilityConflict && (
            <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-amber-700 font-medium mb-2">{availabilityConflict}</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleOverride}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Override and Book Anyway
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvailabilityConflict(null)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recurrence Conflicts Warning */}
          {recurrenceConflicts && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-red-700 font-bold mb-2">
                    Scheduling Conflicts Detected
                  </p>
                  <p className="text-red-600 text-sm mb-3">
                    {recurrenceConflicts.conflictCount} of {recurrenceConflicts.totalOccurrences} recurring appointments have conflicts:
                  </p>
                  <div className="max-h-48 overflow-y-auto mb-4 space-y-2">
                    {recurrenceConflicts.conflicts.map((conflict, idx) => (
                      <div key={idx} className="bg-white border border-red-200 rounded p-2 text-sm">
                        <div className="font-medium text-red-700">
                          {new Date(conflict.date).toLocaleDateString()} at {conflict.time}
                        </div>
                        <div className="text-red-600">{conflict.reason}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleOverrideRecurrence}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Create Anyway (Skip Conflicts)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecurrenceConflicts(null)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <ErrorMessage className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </ErrorMessage>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg text-green-700 flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* Recurring Series Banner */}
          {isEditingRecurringSeries && (
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-blue-700 font-medium mb-2">
                    Recurring Appointment Series
                  </p>
                  <p className="text-blue-600 text-sm mb-3">
                    This appointment is part of a recurring series. Choose what to update:
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="seriesScope"
                        value="single"
                        checked={seriesScope === 'single'}
                        onChange={(e) => setSeriesScope(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-blue-700">Just this occurrence ({new Date(eventDate).toLocaleDateString()})</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="seriesScope"
                        value="future"
                        checked={seriesScope === 'future'}
                        onChange={(e) => setSeriesScope(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-blue-700">This and all future occurrences</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="seriesScope"
                        value="all"
                        checked={seriesScope === 'all'}
                        onChange={(e) => setSeriesScope(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-blue-700">All occurrences in the series</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

          {/* Appointment Type - FIRST */}
          <div>
            <FormLabel>
              Appointment Type <RequiredAsterisk />
            </FormLabel>
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

          {/* Conditional fields based on appointment type */}
          {categoryId && (() => {
            const category = categories.find(c => c.id === parseInt(categoryId));
            if (!category) return null;

            // CLIENT APPOINTMENTS - Show client search + provider
            if (category.categoryType === 'client') {
              return (
                <>
                  {/* Client Search */}
                  <div className="relative">
                    <FormLabel>
                      Client <RequiredAsterisk />
                    </FormLabel>
                    <input
                      type="text"
                      value={patientSearchQuery}
                      onChange={(e) => handlePatientSearch(e.target.value)}
                      placeholder="Search by name..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
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
                    <FormLabel>
                      Provider <RequiredAsterisk />
                    </FormLabel>
                    <select
                      value={selectedProvider}
                      onChange={(e) => handleProviderChange(e.target.value)}
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
                </>
              );
            }

            // SUPERVISION - Show provider + supervisees multi-select
            if (category.name === 'Supervision') {
              return (
                <>
                  {/* Supervisor */}
                  <div>
                    <FormLabel>
                      Supervisor <RequiredAsterisk />
                    </FormLabel>
                    <select
                      value={selectedProvider}
                      onChange={(e) => handleProviderChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Supervisor</option>
                      {providers.map((provider) => (
                        <option key={provider.value} value={provider.value}>
                          {provider.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Supervisees Multi-Select */}
                  {selectedProvider && supervisees.length > 0 && (
                    <div>
                      <FormLabel>
                        Supervisees <RequiredAsterisk />
                      </FormLabel>
                      <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                        {supervisees.map((supervisee) => (
                          <label key={supervisee.id} className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedSupervisees.includes(supervisee.id)}
                              onChange={() => toggleSupervisee(supervisee.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-900">{supervisee.label}</span>
                            {supervisee.title && <span className="text-xs text-gray-500">({supervisee.title})</span>}
                          </label>
                        ))}
                      </div>
                      {selectedSupervisees.length > 0 && (
                        <div className="mt-2 text-sm text-green-600">
                          {selectedSupervisees.length} supervisee(s) selected
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            }

            // STAFF MEETING - No provider needed
            if (category.name === 'Staff Meeting') {
              return (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>All-Staff Meeting:</strong> This appointment will be visible to all providers.
                  </p>
                </div>
              );
            }

            // OTHER CLINIC CATEGORIES - Show provider only
            if (category.categoryType === 'clinic') {
              return (
                <div>
                  <FormLabel>
                    Provider <RequiredAsterisk />
                  </FormLabel>
                  <select
                    value={selectedProvider}
                    onChange={(e) => handleProviderChange(e.target.value)}
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
              );
            }

            return null;
          })()}

          {/* CPT Code Selection - Show when category requires it or patient has insurance */}
          {categoryId && (() => {
            const category = categories.find(c => c.id === parseInt(categoryId));
            const showCptDropdown = category && category.requiresCptSelection && category.linkedCptCodes && category.linkedCptCodes.length > 0;
            const cptRequired = patientPaymentType === 'insurance';

            if (showCptDropdown) {
              return (
                <div>
                  <FormLabel>
                    CPT Code {cptRequired && <RequiredAsterisk />}
                    {!cptRequired && <span className="text-gray-500 text-xs ml-2">(Optional for {patientPaymentType})</span>}
                  </FormLabel>
                  <select
                    value={cptCodeId}
                    onChange={(e) => handleCptCodeChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={cptRequired}
                  >
                    <option value="">Select CPT Code</option>
                    {category.linkedCptCodes.map((cpt) => (
                      <option key={cpt.id} value={cpt.id}>
                        {cpt.code} - {cpt.description} ({cpt.standardDuration}min{cpt.standardFee ? `, $${cpt.standardFee}` : ''})
                      </option>
                    ))}
                  </select>
                  {selectedCptCode && (
                    <div className="mt-2 text-sm text-blue-600">
                      Standard fee: ${selectedCptCode.standardFee || 'Not set'} • Duration: {selectedCptCode.standardDuration} minutes
                    </div>
                  )}
                </div>
              );
            }
            return null;
          })()}

          {/* Date and Time - Side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel>
                Date <RequiredAsterisk />
              </FormLabel>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <FormLabel>
                Time <RequiredAsterisk />
              </FormLabel>
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
              <FormLabel>
                Duration (minutes) <RequiredAsterisk />
              </FormLabel>
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
              <FormLabel>
                Location
              </FormLabel>
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

          {/* Recurrence Section */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Make this recurring
              </label>
            </div>

            {isRecurring && (
              <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                {/* Day Selection */}
                <div>
                  <FormLabel>
                    Repeat on <RequiredAsterisk />
                  </FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'sun', label: 'Sun' },
                      { key: 'mon', label: 'Mon' },
                      { key: 'tue', label: 'Tue' },
                      { key: 'wed', label: 'Wed' },
                      { key: 'thu', label: 'Thu' },
                      { key: 'fri', label: 'Fri' },
                      { key: 'sat', label: 'Sat' }
                    ].map(day => (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => setRecurDays(prev => ({ ...prev, [day.key]: !prev[day.key] }))}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          recurDays[day.key]
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interval Selection */}
                <div>
                  <FormLabel>
                    Frequency <RequiredAsterisk />
                  </FormLabel>
                  <select
                    value={recurInterval}
                    onChange={(e) => setRecurInterval(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="1">Weekly</option>
                    <option value="2">Every 2 weeks</option>
                    <option value="3">Every 3 weeks</option>
                    <option value="4">Every 4 weeks</option>
                  </select>
                </div>

                {/* End Condition */}
                <div>
                  <FormLabel>
                    Ends <RequiredAsterisk />
                  </FormLabel>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={recurEndType === 'count'}
                        onChange={() => setRecurEndType('count')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="checkbox-label">After</span>
                      <input
                        type="number"
                        value={recurCount}
                        onChange={(e) => setRecurCount(parseInt(e.target.value) || 1)}
                        disabled={recurEndType !== 'count'}
                        min="1"
                        max="52"
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="checkbox-label">occurrences</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={recurEndType === 'date'}
                        onChange={() => setRecurEndType('date')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="checkbox-label">On</span>
                      <input
                        type="date"
                        value={recurEndDate}
                        onChange={(e) => setRecurEndDate(e.target.value)}
                        disabled={recurEndType !== 'date'}
                        className="px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Title (Optional) */}
          <div>
            <FormLabel>
              Title (Optional)
            </FormLabel>
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
            <FormLabel>
              Comments
            </FormLabel>
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
            {appointment && (
              <DangerButton
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </DangerButton>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-label rounded-xl transition-all hover:shadow-md"
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
