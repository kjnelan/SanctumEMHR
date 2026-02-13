/**
 * SanctumEMHR EMHR
 * ClientCommunicationTemplate - Document client phone calls, emails, texts
 * Quick documentation for client-initiated contact
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
function ClientCommunicationTemplate({ note, onChange, autoSave }) {
  const handleChange = (field, value) => {
    onChange(field, value);
    if (autoSave) {
      setTimeout(() => autoSave(), 500);
    }
  };

  const contactMethods = [
    { value: 'phone', label: '📞 Phone Call', icon: '📞' },
    { value: 'email', label: '📧 Email', icon: '📧' },
    { value: 'text', label: '💬 Text Message', icon: '💬' },
    { value: 'portal', label: '🌐 Client Portal', icon: '🌐' },
    { value: 'voicemail', label: '🎙️ Voicemail', icon: '🎙️' }
  ];

  const selectedMethod = note.contactMethod || 'phone';

  return (
    <div className="space-y-6">
      {/* Contact Method */}
      <div className="card-main bg-blue-50">
        <h3 className="section-header-gray">
          <span className="mr-2">📞</span>
          Contact Method
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {contactMethods.map((method) => (
            <label
              key={method.value}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedMethod === method.value
                  ? 'border-blue-500 bg-blue-100'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="contactMethod"
                value={method.value}
                checked={selectedMethod === method.value}
                onChange={(e) => handleChange('contactMethod', e.target.value)}
                className="sr-only"
              />
              <div className="text-3xl">{method.icon}</div>
              <div className="text-sm font-semibold text-gray-800 text-center">
                {method.label.replace(/^.+ /, '')}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Contact Date/Time */}
      <div className="card-main">
        <h3 className="section-header-gray">
          <span className="mr-2">🕐</span>
          Date & Time of Contact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block">
              <span className="text-label block mb-2">Date</span>
              <input
                type="date"
                value={note.contactDate || ''}
                onChange={(e) => handleChange('contactDate', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="text-label block mb-2">Time</span>
              <input
                type="time"
                value={note.contactTime || ''}
                onChange={(e) => handleChange('contactTime', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Reason for Contact */}
      <div className="card-main">
        <h3 className="section-header-gray">
          <span className="mr-2">❓</span>
          Reason for Contact
        </h3>
        <textarea
          value={note.contactReason || ''}
          onChange={(e) => handleChange('contactReason', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white shadow-sm"
          rows="3"
          placeholder="Why did the client reach out? What did they need or want to discuss?"
        />
      </div>

      {/* Summary of Communication */}
      <div className="card-main">
        <h3 className="section-header-gray">
          <span className="mr-2">💬</span>
          Summary of Communication
        </h3>
        <textarea
          value={note.communicationSummary || ''}
          onChange={(e) => handleChange('communicationSummary', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white shadow-sm"
          rows="5"
          placeholder="Summarize the content of the communication. What was discussed? What information was provided?"
        />
      </div>

      {/* Action Taken / Response */}
      <div className="card-main">
        <h3 className="section-header-gray">
          <span className="mr-2">✅</span>
          Action Taken / Response Provided
        </h3>
        <textarea
          value={note.actionTaken || ''}
          onChange={(e) => handleChange('actionTaken', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white shadow-sm"
          rows="4"
          placeholder="How did you respond? What actions were taken? Any referrals or resources provided? Follow-up needed?"
        />
      </div>

      {/* Urgent/Crisis Flag */}
      <div className="card-main bg-orange-50 border-2 border-orange-300">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={note.urgentFlag || false}
            onChange={(e) => handleChange('urgentFlag', e.target.checked)}
            className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
          />
          <div className="flex-1">
            <span className="font-semibold text-gray-800">⚠️ Urgent or Crisis-Related Contact</span>
            <div className="text-sm text-gray-600 mt-1">
              Check if this contact involved safety concerns, crisis, or urgent clinical needs
            </div>
          </div>
        </label>

        {note.urgentFlag && (
          <div className="mt-4">
            <textarea
              value={note.urgentDetails || ''}
              onChange={(e) => handleChange('urgentDetails', e.target.value)}
              className="w-full px-4 py-3 border-2 border-orange-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none bg-white shadow-sm"
              rows="3"
              placeholder="Describe the urgent nature of the contact and actions taken to address safety/crisis concerns..."
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientCommunicationTemplate;
