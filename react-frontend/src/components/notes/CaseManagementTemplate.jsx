/**
 * SanctumEMHR EMHR
 * CaseManagementTemplate - Social Worker case management note template
 * For documenting case management activities, referrals, resource coordination
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React, { useState } from 'react';

/**
 * Props:
 * - note: object - Current note data
 * - onChange: function(field, value) - Callback when field changes
 * - autoSave: function() - Trigger auto-save
 */
function CaseManagementTemplate({ note, onChange, autoSave }) {
  const handleChange = (field, value) => {
    onChange(field, value);
    // Trigger auto-save after small delay
    if (autoSave) {
      setTimeout(() => autoSave(), 500);
    }
  };

  const handleServiceToggle = (service) => {
    const current = note.servicesProvided || [];
    const isSelected = current.includes(service);

    if (isSelected) {
      handleChange('servicesProvided', current.filter(s => s !== service));
    } else {
      handleChange('servicesProvided', [...current, service]);
    }
  };

  const contactTypes = [
    { value: 'in_person', label: 'In-Person Meeting' },
    { value: 'phone', label: 'Phone Call' },
    { value: 'video', label: 'Video Call' },
    { value: 'email', label: 'Email' },
    { value: 'text', label: 'Text Message' },
    { value: 'collateral', label: 'Collateral Contact' },
    { value: 'home_visit', label: 'Home Visit' },
    { value: 'community', label: 'Community Visit' }
  ];

  const serviceCategories = [
    {
      title: 'Resource Coordination',
      color: 'blue',
      services: [
        'Housing assistance',
        'Food/nutrition resources',
        'Transportation assistance',
        'Utility assistance',
        'Clothing/personal items',
        'Financial assistance'
      ]
    },
    {
      title: 'Referrals & Linkages',
      color: 'purple',
      services: [
        'Medical referral',
        'Psychiatric referral',
        'Substance abuse treatment',
        'Legal services',
        'Employment services',
        'Educational services',
        'Childcare services',
        'Domestic violence resources'
      ]
    },
    {
      title: 'Advocacy & Support',
      color: 'green',
      services: [
        'Benefits application',
        'Insurance navigation',
        'Appointment coordination',
        'Care team communication',
        'Family support',
        'Crisis intervention',
        'Discharge planning',
        'System navigation'
      ]
    },
    {
      title: 'Documentation & Administrative',
      color: 'gray',
      services: [
        'Assessment completion',
        'Care plan review',
        'Progress monitoring',
        'Release of information',
        'Records request',
        'Report preparation'
      ]
    }
  ];

  const contactOutcomes = [
    'Client engaged and receptive',
    'Client declined services',
    'Unable to reach client',
    'Left voicemail',
    'Referral accepted',
    'Referral pending',
    'Follow-up needed',
    'Goal completed',
    'No answer'
  ];

  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <div className="card-main bg-teal-50 border-2 border-teal-300">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
          <span>📞</span>
          <span>Contact Information</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contact Type
            </label>
            <select
              value={note.contactType || ''}
              onChange={(e) => handleChange('contactType', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
            >
              <option value="">Select contact type...</option>
              {contactTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Contact Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={note.duration || ''}
              onChange={(e) => handleChange('duration', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
              placeholder="e.g., 30"
              min="1"
            />
          </div>

          {/* Contact With */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contact With
            </label>
            <input
              type="text"
              value={note.contactWith || ''}
              onChange={(e) => handleChange('contactWith', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
              placeholder="e.g., Client, Family member (relationship), Agency name, etc."
            />
          </div>
        </div>
      </div>

      {/* Purpose of Contact */}
      <div className="card-main">
        <label className="block">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800">
              Purpose of Contact
            </span>
            <span className="text-xs text-gray-500">Why this contact was made</span>
          </div>
          <textarea
            value={note.purposeOfContact || ''}
            onChange={(e) => handleChange('purposeOfContact', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none bg-white shadow-sm"
            rows="3"
            placeholder="Example: Follow-up on housing application submitted last week. Check in on client's overall well-being and current needs..."
          />
        </label>
      </div>

      {/* Services Provided */}
      <div className="card-main">
        <h3 className="font-semibold text-gray-800 mb-4">Services Provided</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {serviceCategories.map((category) => (
            <div key={category.title}>
              <div className={`text-sm font-semibold text-${category.color}-700 mb-2`}>
                {category.title}
              </div>
              <div className="space-y-2">
                {category.services.map((service) => {
                  const isSelected = (note.servicesProvided || []).includes(service);
                  return (
                    <label
                      key={service}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleServiceToggle(service)}
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-700">{service}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Other services text field */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Other Services (not listed above)</span>
            <input
              type="text"
              value={note.otherServices || ''}
              onChange={(e) => handleChange('otherServices', e.target.value)}
              className="mt-1 w-full px-4 py-2 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
              placeholder="Describe any other services provided..."
            />
          </label>
        </div>
      </div>

      {/* Narrative / Details */}
      <div className="card-main">
        <label className="block">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800">
              Narrative / Details
            </span>
            <span className="text-xs text-gray-500">What happened during the contact</span>
          </div>
          <textarea
            value={note.narrative || ''}
            onChange={(e) => handleChange('narrative', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none bg-white shadow-sm"
            rows="5"
            placeholder="Example: Spoke with client regarding housing application. Client reported they received a call from the housing authority and have an interview scheduled for next Tuesday. Reviewed what documents to bring. Client expressed feeling hopeful about the process. Discussed backup plans if this application is not approved..."
          />
        </label>
      </div>

      {/* Client Status / Response */}
      <div className="card-main">
        <label className="block mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800">
              Client Status / Response
            </span>
            <span className="text-xs text-gray-500">How client is doing, their response</span>
          </div>
          <textarea
            value={note.clientStatus || ''}
            onChange={(e) => handleChange('clientStatus', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none bg-white shadow-sm"
            rows="3"
            placeholder="Example: Client was engaged and receptive during our conversation. Reports feeling more stable since starting new medication. Mood appeared improved from last contact..."
          />
        </label>

        {/* Quick outcome tags */}
        <div className="border-t border-gray-200 pt-3">
          <div className="text-xs font-semibold text-gray-600 mb-2">Contact Outcome (Optional)</div>
          <div className="flex flex-wrap gap-2">
            {contactOutcomes.map((outcome) => {
              const isSelected = (note.contactOutcome || []).includes(outcome);
              return (
                <button
                  key={outcome}
                  onClick={() => {
                    const current = note.contactOutcome || [];
                    if (isSelected) {
                      handleChange('contactOutcome', current.filter(o => o !== outcome));
                    } else {
                      handleChange('contactOutcome', [...current, outcome]);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {outcome}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Follow-up Plan */}
      <div className="card-main bg-yellow-50 border-2 border-yellow-300">
        <label className="block">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800 flex items-center gap-2">
              <span>📋</span>
              Follow-up Plan / Next Steps
            </span>
          </div>
          <textarea
            value={note.followUpPlan || ''}
            onChange={(e) => handleChange('followUpPlan', e.target.value)}
            className="w-full px-4 py-3 border-2 border-yellow-400 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none bg-white shadow-sm"
            rows="3"
            placeholder="Example: Will call client Thursday to follow up on housing interview. Need to research additional food bank options in client's new neighborhood. Schedule care team meeting for next month..."
          />
        </label>

        {/* Follow-up date */}
        <div className="mt-3">
          <label className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">Next Follow-up Date:</span>
            <input
              type="date"
              value={note.followUpDate || ''}
              onChange={(e) => handleChange('followUpDate', e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
            />
          </label>
        </div>
      </div>

      {/* Barriers / Concerns */}
      <div className="card-main">
        <label className="block">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800">
              Barriers / Concerns (Optional)
            </span>
            <span className="text-xs text-gray-500">Challenges or obstacles noted</span>
          </div>
          <textarea
            value={note.barriers || ''}
            onChange={(e) => handleChange('barriers', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none bg-white shadow-sm"
            rows="2"
            placeholder="Example: Client lacks transportation to attend housing interview. Language barrier making it difficult to navigate benefits application..."
          />
        </label>
      </div>
    </div>
  );
}

export default CaseManagementTemplate;
