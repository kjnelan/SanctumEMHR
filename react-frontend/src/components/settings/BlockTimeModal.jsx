/**
 * Mindline EMHR
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
import { createAppointment, updateAppointment, deleteAppointment } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

function BlockTimeModal({ isOpen, onClose, onSave, initialDate, initialTime, categories, block }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form fields
  const [categoryId, setCategoryId] = useState('');
  const [eventDate, setEventDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(initialTime || '09:00');
  const [duration, setDuration] = useState(50);
  const [comments, setComments] = useState('');

  // Duration presets
  const durationPresets = [15, 30, 50, 90, 240, 480]; // 4 hours, 8 hours for vacation

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!categoryId) {
      setError('Please select a block type');
      setLoading(false);
      return;
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
        apptstatus: block ? block.apptstatus : '-'
      };

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
      setError(err.message || `Failed to ${block ? 'update' : 'create'} block`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!block) return;

    if (!confirm('Are you sure you want to delete this availability block?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await deleteAppointment(block.id);

      if (response.success) {
        setSuccess('Block deleted successfully!');
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
    onClose();
    if (onSave) onSave();
  };

  if (!isOpen) return null;

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
            {/* Block Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason <span className="text-red-500">*</span>
              </label>
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

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  required
                />
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
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

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
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
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all hover:shadow-md"
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
      </div>
    </div>
  );
}

export default BlockTimeModal;
