/**
 * SanctumEMHR EMHR
 * Block Time Modal - Modal for creating provider availability blocks
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createAppointment, updateAppointment, deleteAppointment } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
import { FormLabel } from '../FormLabel';
import { RequiredAsterisk } from '../RequiredAsterisk';
import { ErrorMessage } from '../ErrorMessage';

function BlockTimeModal({ isOpen, onClose, onSave, initialDate, initialTime, categories, block }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [recurrenceConflicts, setRecurrenceConflicts] = useState(null); // { conflicts: [], totalOccurrences: N }

  // Form fields
  const [categoryId, setCategoryId] = useState('');
  const [eventDate, setEventDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(initialTime || '09:00');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState(50);
  const [comments, setComments] = useState('');

  // Recurrence fields
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurDays, setRecurDays] = useState({ mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false });
  const [recurInterval, setRecurInterval] = useState('1'); // 1=weekly, 2=bi-weekly, 3=every 3 weeks, 4=every 4 weeks
  const [recurEndType, setRecurEndType] = useState('count'); // 'count' or 'date'
  const [recurCount, setRecurCount] = useState(10);
  const [recurEndDate, setRecurEndDate] = useState('');

  // Series management (for editing existing recurring blocks)
  const [isEditingRecurringSeries, setIsEditingRecurringSeries] = useState(false);
  const [seriesScope, setSeriesScope] = useState('single'); // 'single', 'all', 'future'
  const [currentRecurrenceId, setCurrentRecurrenceId] = useState(null);

  // Duration presets (removed 15min, added note about 12 hours)
  const durationPresets = [30, 50, 90, 240, 480]; // 30min, 50min, 1.5h, 4h, 8h

  // Update date/time when props change
  useEffect(() => {
    if (initialDate) setEventDate(initialDate);
    if (initialTime) setStartTime(initialTime);
  }, [initialDate, initialTime]);

  // Populate form when editing existing block
  useEffect(() => {
    if (block && isOpen) {
      setCategoryId(block.categoryId || '');
      setEventDate(block.eventDate || '');
      setStartTime(block.startTime ? block.startTime.substring(0, 5) : '');
      setDuration(block.duration || 50);
      setComments(block.comments || '');

      // Check if this is part of a recurring series
      if (block.isRecurring && block.recurrenceId) {
        setIsEditingRecurringSeries(true);
        setCurrentRecurrenceId(block.recurrenceId);
        setSeriesScope('single'); // Default to editing just this occurrence
      } else {
        setIsEditingRecurringSeries(false);
        setCurrentRecurrenceId(null);
      }
    }
  }, [block, isOpen]);

  // Auto-select first category
  useEffect(() => {
    if (categories && categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
      if (categories[0].defaultDuration > 0) {
        setDuration(categories[0].defaultDuration / 60);
      }
    }
  }, [categories]);

  // Calculate duration when start or end time changes
  useEffect(() => {
    if (startTime && endTime) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const calculatedDuration = endMinutes - startMinutes;
      if (calculatedDuration > 0) {
        setDuration(calculatedDuration);
      }
    }
  }, [startTime, endTime]);

  const handleSubmit = async (e, overrideConflicts = false) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setRecurrenceConflicts(null);

    if (!categoryId) {
      setError('Please select a block type');
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
      const formattedTime = startTime.includes(':') ? `${startTime}:00` : `${startTime}:00:00`;

      // Create/update availability block (appointment without patient)
      const blockData = {
        patientId: 0, // No patient for availability blocks
        providerId: user.id, // Current logged-in provider
        categoryId: parseInt(categoryId),
        eventDate: eventDate,
        startTime: formattedTime,
        duration: parseInt(duration),
        title: categories.find(c => c.id === parseInt(categoryId))?.name || 'Blocked',
        comments: comments,
        room: '',
        apptstatus: block ? block.apptstatus : '-',
        overrideAvailability: overrideConflicts // Pass override flag
      };

      // Add series management data if editing a recurring series
      if (isEditingRecurringSeries) {
        blockData.seriesUpdate = {
          scope: seriesScope,
          recurrenceId: currentRecurrenceId
        };
      }

      // Add recurrence data if enabled (for new recurring blocks)
      if (isRecurring && !block) {
        blockData.recurrence = {
          enabled: true,
          days: recurDays,
          interval: parseInt(recurInterval),
          endType: recurEndType,
          endCount: recurEndType === 'count' ? parseInt(recurCount) : null,
          endDate: recurEndType === 'date' ? recurEndDate : null
        };
      }

      console.log(block ? 'Updating availability block:' : 'Creating availability block:', blockData);

      const response = block
        ? await updateAppointment(block.id, blockData)
        : await createAppointment(blockData);

      if (response.success) {
        setSuccess(block ? 'Block updated successfully!' : 'Time blocked successfully!');
        setTimeout(() => {
          handleClose();
        }, 1000);
      } else {
        setError(response.message || `Failed to ${block ? 'update' : 'create'} block`);
      }
    } catch (err) {
      console.error(`Failed to ${block ? 'update' : 'create'} block:`, err);

      // Check if it's a recurrence conflict (409 status with conflicts array)
      if (err.conflicts) {
        setRecurrenceConflicts({
          conflicts: err.conflicts,
          totalOccurrences: err.totalOccurrences,
          conflictCount: err.conflictCount
        });
      } else {
        setError(err.message || `Failed to ${block ? 'update' : 'create'} block`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle override confirmation for recurrence conflicts
  const handleOverrideRecurrence = () => {
    setRecurrenceConflicts(null);
    // Resubmit with override - need to add override logic
    handleSubmit({ preventDefault: () => {} }, true);
  };

  const handleDelete = async () => {
    if (!block) return;

    // Build confirmation message based on series scope
    let confirmMessage = 'Are you sure you want to delete this availability block?';
    if (isEditingRecurringSeries) {
      if (seriesScope === 'all') {
        confirmMessage = 'Are you sure you want to delete ALL occurrences in this recurring series?';
      } else if (seriesScope === 'future') {
        confirmMessage = 'Are you sure you want to delete this and all future occurrences?';
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

      const response = await deleteAppointment(block.id, deleteData);

      if (response.success) {
        const successMsg = isEditingRecurringSeries && seriesScope !== 'single'
          ? `${response.deletedCount || 'Multiple'} block(s) deleted successfully!`
          : 'Block deleted successfully!';
        setSuccess(successMsg);
        setTimeout(() => {
          handleClose();
        }, 1000);
      } else {
        setError(response.message || 'Failed to delete block');
      }
    } catch (err) {
      console.error('Failed to delete block:', err);
      setError(err.message || 'Failed to delete block');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCategoryId('');
    setComments('');
    setError(null);
    setSuccess(null);
    setRecurrenceConflicts(null);
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
    if (onSave) onSave();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal - Centered with inline styles */}
      <div
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-y-auto"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: '48rem',
          maxHeight: '90vh',
          zIndex: 10
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 px-8 pt-6 bg-gradient-to-r from-purple-50 to-pink-50">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {block ? 'Edit Availability Block' : 'Block Time'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {block ? 'Update or remove this availability block' : 'Mark yourself as unavailable during this time'}
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
                    {recurrenceConflicts.conflictCount} of {recurrenceConflicts.totalOccurrences} recurring blocks have conflicts:
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
            <div className="mb-6 p-4 bg-purple-50 border-l-4 border-purple-500 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-purple-700 font-medium mb-2">
                    Recurring Availability Block Series
                  </p>
                  <p className="text-purple-600 text-sm mb-3">
                    This block is part of a recurring series. Choose what to update:
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="seriesScope"
                        value="single"
                        checked={seriesScope === 'single'}
                        onChange={(e) => setSeriesScope(e.target.value)}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-purple-700">Just this occurrence ({new Date(eventDate).toLocaleDateString()})</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="seriesScope"
                        value="future"
                        checked={seriesScope === 'future'}
                        onChange={(e) => setSeriesScope(e.target.value)}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-purple-700">This and all future occurrences</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="seriesScope"
                        value="all"
                        checked={seriesScope === 'all'}
                        onChange={(e) => setSeriesScope(e.target.value)}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-purple-700">All occurrences in the series</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Block Type */}
            <div>
              <FormLabel>
                Reason <RequiredAsterisk />
              </FormLabel>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                required
              >
                <option value="">Select Reason</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <FormLabel>
                Date <RequiredAsterisk />
              </FormLabel>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                required
              />
            </div>

            {/* Start and End Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel>
                  Start Time <RequiredAsterisk />
                </FormLabel>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  required
                />
              </div>

              <div>
                <FormLabel>
                  End Time
                </FormLabel>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <FormLabel>
                Duration (minutes) <RequiredAsterisk />
              </FormLabel>
              <div className="flex flex-wrap gap-2 mb-3 items-center">
                {durationPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDuration(preset)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      duration === preset
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {preset >= 60 ? `${preset / 60}h` : `${preset}m`}
                  </button>
                ))}
                <span className="text-xs text-gray-500 ml-2">(12-hours = 720 minutes)</span>
              </div>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="5"
                step="5"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                required
              />
            </div>

            {/* Recurrence Section */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  Make this recurring
                </label>
              </div>

              {isRecurring && (
                <div className="space-y-4 pl-6 border-l-2 border-purple-200">
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
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
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
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <span className="checkbox-label">After</span>
                        <input
                          type="number"
                          value={recurCount}
                          onChange={(e) => setRecurCount(parseInt(e.target.value) || 1)}
                          disabled={recurEndType !== 'count'}
                          min="1"
                          max="52"
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="checkbox-label">occurrences</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={recurEndType === 'date'}
                          onChange={() => setRecurEndType('date')}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <span className="checkbox-label">On</span>
                        <input
                          type="date"
                          value={recurEndDate}
                          onChange={(e) => setRecurEndDate(e.target.value)}
                          disabled={recurEndType !== 'date'}
                          className="px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 focus:ring-2 focus:ring-purple-500"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Comments */}
            <div>
              <FormLabel>
                Notes (Optional)
              </FormLabel>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                placeholder="Add any notes about this blocked time..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6 mt-6 border-t border-gray-200">
              {block && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-6 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-xl transition-all hover:shadow-md"
                  disabled={loading}
                >
                  Delete
                </button>
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
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (block ? 'Updating...' : 'Blocking...') : (block ? 'Update Block' : 'Block Time')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default BlockTimeModal;
