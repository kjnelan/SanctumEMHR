/**
 * Mindline EMHR
 * AdministrativeTemplate - Non-clinical administrative documentation
 * For coordination, consultations, paperwork, etc.
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
function AdministrativeTemplate({ note, onChange, autoSave }) {
  const handleChange = (field, value) => {
    onChange(field, value);
    if (autoSave) {
      setTimeout(() => autoSave(), 500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Note Type */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          <span className="mr-2">📋</span>
          Type of Administrative Note
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Care coordination',
            'Consultation with colleague',
            'Phone contact',
            'Email correspondence',
            'Collateral contact',
            'Documentation review',
            'Treatment planning',
            'Case management',
            'Supervision notes',
            'Peer review',
            'Quality assurance',
            'Insurance coordination',
            'Referral coordination',
            'Records request',
            'Other'
          ].map(type => (
            <label key={type} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-gray-600 rounded"
              />
              <span className="text-sm text-gray-700">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          <span className="mr-2">📝</span>
          Details
        </h3>
        <textarea
          value={note.behaviorProblem || ''}
          onChange={(e) => handleChange('behaviorProblem', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none bg-white shadow-sm"
          rows="8"
          placeholder="Document the administrative activity:

- Date and time
- Who was involved (names, roles)
- Purpose of contact/activity
- Information discussed or exchanged
- Decisions made
- Follow-up needed
- Documents generated or reviewed"
        />
      </div>

      {/* Participants */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          <span className="mr-2">👥</span>
          Participants/Contacts
        </h3>
        <textarea
          value={note.intervention || ''}
          onChange={(e) => handleChange('intervention', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none bg-white shadow-sm"
          rows="3"
          placeholder="Who was involved? (Names, organizations, roles)"
        />
      </div>

      {/* Outcome/Actions Taken */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          <span className="mr-2">✅</span>
          Outcome & Actions Taken
        </h3>
        <textarea
          value={note.response || ''}
          onChange={(e) => handleChange('response', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none bg-white shadow-sm"
          rows="4"
          placeholder="What was accomplished? Any decisions or agreements?"
        />
      </div>

      {/* Follow-Up Needed */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          <span className="mr-2">📌</span>
          Follow-Up Required
        </h3>
        <textarea
          value={note.plan || ''}
          onChange={(e) => handleChange('plan', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none bg-white shadow-sm"
          rows="3"
          placeholder="Next steps? Who is responsible? Timeline?"
        />
      </div>

      {/* Additional Notes */}
      <div className="card-main bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          <span className="mr-2">💭</span>
          Additional Notes
        </h3>
        <textarea
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none bg-white shadow-sm"
          rows="3"
          placeholder="Any other relevant information..."
        />
      </div>

      {/* Time Documentation */}
      <div className="card-main bg-blue-50 border-2 border-blue-300">
        <h3 className="text-lg font-semibold text-blue-700 mb-4">
          <span className="mr-2">⏱️</span>
          Time Documentation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Duration (minutes)</span>
              <input
                type="number"
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                placeholder="0"
                min="0"
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Billable?</span>
              <select className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white shadow-sm">
                <option>Yes</option>
                <option>No</option>
                <option>To be determined</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdministrativeTemplate;
