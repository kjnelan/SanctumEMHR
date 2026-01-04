/**
 * Mindline EMHR
 * IntakeTemplate - Comprehensive intake assessment for first session
 * Collects presenting problem, history, current functioning, treatment goals
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
function IntakeTemplate({ note, onChange, autoSave }) {
  const [riskPresent, setRiskPresent] = useState(note.riskPresent || false);

  const handleChange = (field, value) => {
    onChange(field, value);
    if (autoSave) {
      setTimeout(() => autoSave(), 500);
    }
  };

  const handleRiskToggle = (checked) => {
    setRiskPresent(checked);
    handleChange('riskPresent', checked);
  };

  const getField = (fieldName) => {
    const intake = note.presentingConcerns || {};
    return intake[fieldName] || '';
  };

  const setField = (fieldName, value) => {
    const intake = note.presentingConcerns || {};
    handleChange('presentingConcerns', { ...intake, [fieldName]: value });
  };

  return (
    <div className="space-y-6">
      {/* Presenting Problem / Chief Complaint */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-indigo-700 mb-4">
          <span className="mr-2">📋</span>
          Presenting Problem / Chief Complaint
        </h3>
        <textarea
          value={note.behaviorProblem || ''}
          onChange={(e) => handleChange('behaviorProblem', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white shadow-sm"
          rows="5"
          placeholder="In client's own words: What brings you in today? What are you hoping to work on?"
        />
      </div>

      {/* History of Present Illness */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-indigo-700 mb-4">
          <span className="mr-2">📖</span>
          History of Present Illness
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Duration & Onset</span>
              <textarea
                value={getField('duration')}
                onChange={(e) => setField('duration', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white shadow-sm"
                rows="2"
                placeholder="When did symptoms begin? What was happening at that time?"
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Frequency & Severity</span>
              <textarea
                value={getField('frequency')}
                onChange={(e) => setField('frequency', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white shadow-sm"
                rows="2"
                placeholder="How often? How severe? What makes it better/worse?"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Previous Treatment History */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-indigo-700 mb-4">
          <span className="mr-2">🏥</span>
          Previous Mental Health Treatment
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Prior Therapy/Counseling</span>
              <textarea
                value={getField('priorTherapy')}
                onChange={(e) => setField('priorTherapy', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white shadow-sm"
                rows="2"
                placeholder="When? With whom? What was helpful/not helpful?"
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Psychiatric Medications (Current & Past)</span>
              <textarea
                value={getField('medications')}
                onChange={(e) => setField('medications', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white shadow-sm"
                rows="2"
                placeholder="Current meds, dosages, effectiveness, side effects..."
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Psychiatric Hospitalizations</span>
              <textarea
                value={getField('hospitalizations')}
                onChange={(e) => setField('hospitalizations', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white shadow-sm"
                rows="2"
                placeholder="Dates, reasons, outcomes..."
              />
            </label>
          </div>
        </div>
      </div>

      {/* Family History */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-indigo-700 mb-4">
          <span className="mr-2">👨‍👩‍👧‍👦</span>
          Family History
        </h3>
        <textarea
          value={getField('familyHistory')}
          onChange={(e) => setField('familyHistory', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white shadow-sm"
          rows="3"
          placeholder="Mental health diagnoses, substance use, suicide attempts in family members..."
        />
      </div>

      {/* Substance Use */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-indigo-700 mb-4">
          <span className="mr-2">🍺</span>
          Substance Use
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Alcohol Use</span>
              <textarea
                value={getField('alcoholUse')}
                onChange={(e) => setField('alcoholUse', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white shadow-sm"
                rows="2"
                placeholder="Frequency, amount, history of abuse..."
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Drug Use (Recreational/Prescription)</span>
              <textarea
                value={getField('drugUse')}
                onChange={(e) => setField('drugUse', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white shadow-sm"
                rows="2"
                placeholder="Substances, frequency, history..."
              />
            </label>
          </div>
        </div>
      </div>

      {/* Medical History */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-indigo-700 mb-4">
          <span className="mr-2">⚕️</span>
          Medical History
        </h3>
        <textarea
          value={getField('medicalHistory')}
          onChange={(e) => setField('medicalHistory', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white shadow-sm"
          rows="3"
          placeholder="Chronic conditions, surgeries, medications, head injuries, neurological issues..."
        />
      </div>

      {/* Social & Developmental History */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-indigo-700 mb-4">
          <span className="mr-2">🌱</span>
          Social & Developmental History
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Childhood/Development</span>
              <textarea
                value={getField('childhood')}
                onChange={(e) => setField('childhood', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white shadow-sm"
                rows="2"
                placeholder="Developmental milestones, childhood experiences, trauma..."
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Education & Employment</span>
              <textarea
                value={getField('education')}
                onChange={(e) => setField('education', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white shadow-sm"
                rows="2"
                placeholder="Highest education, current employment, work history..."
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Relationships & Support System</span>
              <textarea
                value={getField('relationships')}
                onChange={(e) => setField('relationships', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white shadow-sm"
                rows="2"
                placeholder="Marital status, children, family support, friends..."
              />
            </label>
          </div>
        </div>
      </div>

      {/* Current Functioning */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-indigo-700 mb-4">
          <span className="mr-2">⚡</span>
          Current Functioning
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Sleep</span>
              <input
                type="text"
                value={getField('sleep')}
                onChange={(e) => setField('sleep', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                placeholder="Hours per night, quality, difficulties..."
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Appetite/Eating</span>
              <input
                type="text"
                value={getField('appetite')}
                onChange={(e) => setField('appetite', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                placeholder="Changes, patterns, concerns..."
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Energy Level</span>
              <input
                type="text"
                value={getField('energy')}
                onChange={(e) => setField('energy', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm"
                placeholder="Fatigue, motivation, activity level..."
              />
            </label>
          </div>
        </div>
      </div>

      {/* Treatment Goals */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-indigo-700 mb-4">
          <span className="mr-2">🎯</span>
          Treatment Goals
        </h3>
        <textarea
          value={note.plan || ''}
          onChange={(e) => handleChange('plan', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white shadow-sm"
          rows="4"
          placeholder="What does the client hope to achieve? What are the initial treatment goals? Recommended frequency of sessions?"
        />
      </div>

      {/* Clinical Impressions */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-indigo-700 mb-4">
          <span className="mr-2">💡</span>
          Clinical Impressions & Diagnostic Considerations
        </h3>
        <textarea
          value={getField('impressions')}
          onChange={(e) => setField('impressions', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none bg-white shadow-sm"
          rows="4"
          placeholder="Initial clinical formulation, provisional diagnoses, treatment recommendations..."
        />
      </div>

      {/* Risk Assessment */}
      <div className="card-main bg-orange-50 border-2 border-orange-300">
        <label className="flex items-center gap-3 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={riskPresent}
            onChange={(e) => handleRiskToggle(e.target.checked)}
            className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
          />
          <span className="font-semibold text-gray-800">
            ⚠️ Risk Present (suicide, homicide, self-harm)
          </span>
        </label>

        {riskPresent && (
          <div className="border-t-2 border-orange-200 pt-3">
            <label className="block">
              <div className="text-sm font-semibold text-orange-800 mb-2">
                Risk Assessment Details (Required when risk is flagged)
              </div>
              <textarea
                value={note.riskAssessment || ''}
                onChange={(e) => handleChange('riskAssessment', e.target.value)}
                className="w-full px-4 py-3 border-2 border-orange-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none bg-white shadow-sm"
                rows="5"
                placeholder="Document risk factors, protective factors, safety plan, level of risk, interventions used, follow-up plan..."
                required={riskPresent}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

export default IntakeTemplate;
