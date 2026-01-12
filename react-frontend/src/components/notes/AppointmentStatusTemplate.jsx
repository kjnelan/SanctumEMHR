/**
 * Mindline EMHR
 * AppointmentStatusTemplate - Quick note for appointment status
 * No show, late cancel, cancellation, late arrival
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React from 'react';

/**
 * Props:
 * - note: object - Current note data
 * - onChange: function(field, value) - Callback when field changes
 * - autoSave: function() - Trigger auto-save
 */
function AppointmentStatusTemplate({ note, onChange, autoSave }) {
  const handleChange = (field, value) => {
    onChange(field, value);
    if (autoSave) {
      setTimeout(() => autoSave(), 500);
    }
  };

  const statusTypes = [
    { value: 'noshow', label: 'No Show', description: 'Client did not attend, no notice given' },
    { value: 'late_cancel', label: 'Late Cancellation', description: 'Canceled within 24 hours of appointment' },
    { value: 'cancel', label: 'Cancellation', description: 'Canceled with adequate notice' },
    { value: 'late_arrival', label: 'Late Arrival', description: 'Client arrived late to session' }
  ];

  const selectedStatus = note.appointmentStatus || 'noshow';
  const statusInfo = statusTypes.find(s => s.value === selectedStatus);

  return (
    <div className="space-y-6">
      {/* Status Type Selection */}
      <div className="card-main bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          <span className="mr-2">📅</span>
          Appointment Status
        </h3>

        <div className="space-y-3">
          {statusTypes.map((status) => (
            <label
              key={status.value}
              className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedStatus === status.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="appointmentStatus"
                value={status.value}
                checked={selectedStatus === status.value}
                onChange={(e) => handleChange('appointmentStatus', e.target.value)}
                className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{status.label}</div>
                <div className="text-sm text-gray-600">{status.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Reason/Details */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          <span className="mr-2">📝</span>
          Reason / Additional Details
        </h3>
        <textarea
          value={note.statusReason || ''}
          onChange={(e) => handleChange('statusReason', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white shadow-sm"
          rows="4"
          placeholder="Provide additional context: Why did the client cancel? When were you notified? Any relevant circumstances?"
        />
      </div>

      {/* Billing Impact (Optional) */}
      <div className="card-main bg-yellow-50 border-2 border-yellow-300">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          <span className="mr-2">💰</span>
          Billing Impact
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={note.chargeApplied || false}
              onChange={(e) => handleChange('chargeApplied', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Late cancellation/no-show charge applied</span>
          </label>

          {note.chargeApplied && (
            <textarea
              value={note.chargeDetails || ''}
              onChange={(e) => handleChange('chargeDetails', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white shadow-sm"
              rows="2"
              placeholder="Charge amount and details..."
            />
          )}
        </div>
      </div>

      {/* Follow-up Action */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          <span className="mr-2">📞</span>
          Follow-up Action
        </h3>
        <textarea
          value={note.followUpAction || ''}
          onChange={(e) => handleChange('followUpAction', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white shadow-sm"
          rows="3"
          placeholder="What follow-up is needed? Call client to reschedule? Send reminder? Review cancellation policy?"
        />
      </div>
    </div>
  );
}

export default AppointmentStatusTemplate;
