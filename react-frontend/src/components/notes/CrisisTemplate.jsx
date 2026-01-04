/**
 * Mindline EMHR
 * CrisisTemplate - Crisis/Emergency session documentation
 * For high-risk, emergency, or crisis intervention sessions
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
function CrisisTemplate({ note, onChange, autoSave }) {
  const handleChange = (field, value) => {
    onChange(field, value);
    if (autoSave) {
      setTimeout(() => autoSave(), 500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Crisis Alert */}
      <div className="card-main bg-red-50 border-2 border-red-400">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">⚠️</span>
          <h3 className="text-xl font-bold text-red-800">Crisis/Emergency Documentation</h3>
        </div>
        <p className="text-sm text-red-700">
          Document all crisis assessments, interventions, and safety planning thoroughly.
        </p>
      </div>

      {/* Crisis Presentation */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-red-700 mb-4">
          <span className="mr-2">🚨</span>
          Crisis Presentation
        </h3>
        <textarea
          value={note.behaviorProblem || ''}
          onChange={(e) => handleChange('behaviorProblem', e.target.value)}
          className="w-full px-4 py-3 border-2 border-red-400 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none bg-white shadow-sm"
          rows="5"
          placeholder="Describe the crisis situation: What happened? When? Who was involved? Client's presentation and immediate concerns..."
          required
        />
      </div>

      {/* Risk Assessment - REQUIRED for crisis notes */}
      <div className="card-main bg-orange-50 border-2 border-orange-400">
        <h3 className="text-lg font-semibold text-orange-800 mb-4">
          <span className="mr-2">⚠️</span>
          Risk Assessment (REQUIRED)
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-orange-800 mb-2 block">Risk Level</span>
              <div className="flex gap-4">
                {['Low', 'Moderate', 'High', 'Imminent'].map(level => (
                  <label key={level} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="riskLevel"
                      value={level}
                      className="w-4 h-4 text-orange-600"
                    />
                    <span className={`text-sm font-medium ${level === 'Imminent' || level === 'High' ? 'text-red-700' : 'text-gray-700'}`}>
                      {level}
                    </span>
                  </label>
                ))}
              </div>
            </label>
          </div>
          <textarea
            value={note.riskAssessment || ''}
            onChange={(e) => handleChange('riskAssessment', e.target.value)}
            className="w-full px-4 py-3 border-2 border-orange-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none bg-white shadow-sm"
            rows="6"
            placeholder="DETAILED RISK ASSESSMENT REQUIRED:
- Suicidal ideation (intent, plan, means, timeline)?
- Homicidal ideation (intent, plan, means, target)?
- Self-harm behaviors?
- Substance use/intoxication?
- Risk factors vs. protective factors
- Access to lethal means
- Support system availability
- History of attempts"
            required
          />
        </div>
      </div>

      {/* Crisis Interventions */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-red-700 mb-4">
          <span className="mr-2">🛟</span>
          Crisis Interventions Provided
        </h3>
        <textarea
          value={note.intervention || ''}
          onChange={(e) => handleChange('intervention', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none bg-white shadow-sm"
          rows="5"
          placeholder="What interventions were used? (e.g., crisis counseling, de-escalation, safety planning, referrals, emergency contacts, medication evaluation, hospitalization consideration...)"
          required
        />
      </div>

      {/* Client Response */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-red-700 mb-4">
          <span className="mr-2">💬</span>
          Client Response to Intervention
        </h3>
        <textarea
          value={note.response || ''}
          onChange={(e) => handleChange('response', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none bg-white shadow-sm"
          rows="4"
          placeholder="How did client respond to interventions? Mood/affect changes? Willingness to engage in safety planning?"
          required
        />
      </div>

      {/* Safety Plan */}
      <div className="card-main bg-green-50 border-2 border-green-400">
        <h3 className="text-lg font-semibold text-green-800 mb-4">
          <span className="mr-2">🛡️</span>
          Safety Plan (REQUIRED)
        </h3>
        <textarea
          value={note.plan || ''}
          onChange={(e) => handleChange('plan', e.target.value)}
          className="w-full px-4 py-3 border-2 border-green-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none bg-white shadow-sm"
          rows="6"
          placeholder="DETAILED SAFETY PLAN REQUIRED:
- Warning signs/triggers identified
- Internal coping strategies
- People/places for distraction
- Support contacts (names & numbers)
- Professional resources (crisis line, emergency services)
- Means restriction (removing lethal means)
- Follow-up plan
- Emergency numbers provided (988, local crisis line, etc.)"
          required
        />
      </div>

      {/* Disposition & Follow-Up */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-red-700 mb-4">
          <span className="mr-2">📍</span>
          Disposition & Follow-Up Plan
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Disposition</span>
              <div className="flex flex-wrap gap-3">
                {['Returned home with safety plan', 'Emergency contact notified', 'Referred to higher level of care', 'Voluntary hospitalization', 'Involuntary commitment initiated', 'Police/EMS contacted', 'Other'].map(disp => (
                  <label key={disp} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-red-600 rounded"
                    />
                    <span className="text-sm text-gray-700">{disp}</span>
                  </label>
                ))}
              </div>
            </label>
          </div>
          <textarea
            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none bg-white shadow-sm"
            rows="3"
            placeholder="Follow-up plan: Next appointment scheduled? Emergency contacts? Referrals made?"
          />
        </div>
      </div>

      {/* Collateral Contacts */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-red-700 mb-4">
          <span className="mr-2">📞</span>
          Collateral Contacts (if any)
        </h3>
        <textarea
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none bg-white shadow-sm"
          rows="3"
          placeholder="Document any contact with family, emergency services, other providers, etc."
        />
      </div>
    </div>
  );
}

export default CrisisTemplate;
