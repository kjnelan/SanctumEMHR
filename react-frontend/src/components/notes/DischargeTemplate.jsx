/**
 * Mindline EMHR
 * DischargeTemplate - Discharge summary for treatment conclusion
 * Documents treatment course, progress, outcomes, and recommendations
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
function DischargeTemplate({ note, onChange, autoSave }) {
  const handleChange = (field, value) => {
    onChange(field, value);
    if (autoSave) {
      setTimeout(() => autoSave(), 500);
    }
  };

  const getField = (fieldName) => {
    const discharge = note.clinicalObservations || {};
    return discharge[fieldName] || '';
  };

  const setField = (fieldName, value) => {
    const discharge = note.clinicalObservations || {};
    handleChange('clinicalObservations', { ...discharge, [fieldName]: value });
  };

  return (
    <div className="space-y-6">
      {/* Reason for Discharge */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-emerald-700 mb-4">
          <span className="mr-2">✅</span>
          Reason for Discharge
        </h3>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {['Treatment goals achieved', 'Client request', 'Mutual agreement', 'Client no-show', 'Administrative discharge', 'Transfer to another provider', 'Other'].map(reason => (
              <label key={reason} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dischargeReason"
                  value={reason}
                  checked={getField('dischargeReason') === reason}
                  onChange={(e) => setField('dischargeReason', e.target.value)}
                  className="w-4 h-4 text-emerald-600"
                />
                <span className="text-sm text-gray-700">{reason}</span>
              </label>
            ))}
          </div>
          <textarea
            value={getField('dischargeReasonDetails')}
            onChange={(e) => setField('dischargeReasonDetails', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none bg-white shadow-sm"
            rows="2"
            placeholder="Additional details..."
          />
        </div>
      </div>

      {/* Treatment Summary */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-emerald-700 mb-4">
          <span className="mr-2">📋</span>
          Treatment Summary
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Dates of Treatment</span>
              <input
                type="text"
                value={getField('treatmentDates')}
                onChange={(e) => setField('treatmentDates', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm"
                placeholder="From [date] to [date] - Total of X sessions"
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Presenting Problem (at intake)</span>
              <textarea
                value={note.behaviorProblem || ''}
                onChange={(e) => handleChange('behaviorProblem', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none bg-white shadow-sm"
                rows="3"
                placeholder="What brought client to treatment..."
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Diagnosis/Diagnoses</span>
              <textarea
                value={getField('diagnoses')}
                onChange={(e) => setField('diagnoses', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none bg-white shadow-sm"
                rows="2"
                placeholder="Primary and secondary diagnoses..."
              />
            </label>
          </div>
        </div>
      </div>

      {/* Interventions Used */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-emerald-700 mb-4">
          <span className="mr-2">🛠️</span>
          Interventions & Treatment Modalities
        </h3>
        <textarea
          value={note.intervention || ''}
          onChange={(e) => handleChange('intervention', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none bg-white shadow-sm"
          rows="4"
          placeholder="CBT, DBT, EMDR, supportive counseling, psychoeducation, medication management..."
        />
      </div>

      {/* Progress & Outcomes */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-emerald-700 mb-4">
          <span className="mr-2">📈</span>
          Progress & Treatment Outcomes
        </h3>
        <textarea
          value={note.response || ''}
          onChange={(e) => handleChange('response', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none bg-white shadow-sm"
          rows="5"
          placeholder="Describe client progress toward treatment goals, symptom reduction, skill development, behavioral changes..."
        />
      </div>

      {/* Current Status at Discharge */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-emerald-700 mb-4">
          <span className="mr-2">🎯</span>
          Current Status at Discharge
        </h3>
        <textarea
          value={getField('currentStatus')}
          onChange={(e) => setField('currentStatus', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none bg-white shadow-sm"
          rows="4"
          placeholder="Current symptoms, functioning level, remaining challenges, strengths..."
        />
      </div>

      {/* Recommendations & Follow-Up */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-emerald-700 mb-4">
          <span className="mr-2">💡</span>
          Recommendations & Follow-Up Plan
        </h3>
        <textarea
          value={note.plan || ''}
          onChange={(e) => handleChange('plan', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none bg-white shadow-sm"
          rows="5"
          placeholder="Future treatment recommendations, referrals, follow-up care, relapse prevention strategies, resources provided..."
        />
      </div>

      {/* Prognosis */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-emerald-700 mb-4">
          <span className="mr-2">🔮</span>
          Prognosis
        </h3>
        <div className="space-y-3">
          <div className="flex gap-4">
            {['Excellent', 'Good', 'Fair', 'Guarded', 'Poor'].map(prog => (
              <label key={prog} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="prognosis"
                  value={prog}
                  checked={getField('prognosis') === prog}
                  onChange={(e) => setField('prognosis', e.target.value)}
                  className="w-4 h-4 text-emerald-600"
                />
                <span className="text-sm text-gray-700">{prog}</span>
              </label>
            ))}
          </div>
          <textarea
            value={getField('prognosisDetails')}
            onChange={(e) => setField('prognosisDetails', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none bg-white shadow-sm"
            rows="2"
            placeholder="Additional prognosis details..."
          />
        </div>
      </div>
    </div>
  );
}

export default DischargeTemplate;
