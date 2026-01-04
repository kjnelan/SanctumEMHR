/**
 * Mindline EMHR
 * RiskAssessmentTemplate - Standalone comprehensive risk assessment
 * For detailed safety evaluations outside of regular sessions
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
function RiskAssessmentTemplate({ note, onChange, autoSave }) {
  const handleChange = (field, value) => {
    onChange(field, value);
    if (autoSave) {
      setTimeout(() => autoSave(), 500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Risk Assessment Header */}
      <div className="card-main bg-orange-50 border-2 border-orange-400">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🛡️</span>
          <h3 className="text-xl font-bold text-orange-800">Comprehensive Risk Assessment</h3>
        </div>
        <p className="text-sm text-orange-700">
          Thorough evaluation of suicide, homicide, and self-harm risk with safety planning.
        </p>
      </div>

      {/* Reason for Assessment */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-orange-700 mb-4">
          <span className="mr-2">📋</span>
          Reason for Assessment
        </h3>
        <textarea
          value={note.behaviorProblem || ''}
          onChange={(e) => handleChange('behaviorProblem', e.target.value)}
          className="w-full px-4 py-3 border-2 border-orange-400 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none bg-white shadow-sm"
          rows="3"
          placeholder="What prompted this risk assessment?"
        />
      </div>

      {/* Suicidal Ideation Assessment */}
      <div className="card-main bg-red-50 border-2 border-red-300">
        <h3 className="text-lg font-semibold text-red-800 mb-4">
          <span className="mr-2">⚠️</span>
          Suicidal Ideation Assessment
        </h3>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3 mb-2">
              <input type="checkbox" className="w-5 h-5 text-red-600 rounded" />
              <span className="font-semibold text-red-800">Current suicidal ideation present</span>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700 mb-2 block">Ideation Frequency</span>
                <select className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg bg-white shadow-sm">
                  <option>None</option>
                  <option>Rare (few times/year)</option>
                  <option>Occasional (monthly)</option>
                  <option>Frequent (weekly)</option>
                  <option>Daily</option>
                  <option>Constant</option>
                </select>
              </label>
            </div>
            <div>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700 mb-2 block">Intent Level</span>
                <select className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg bg-white shadow-sm">
                  <option>No intent</option>
                  <option>Low (passive wishes)</option>
                  <option>Moderate (some intent)</option>
                  <option>High (strong intent)</option>
                  <option>Imminent</option>
                </select>
              </label>
            </div>
          </div>
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Plan Details</span>
              <textarea
                className="w-full px-4 py-3 border-2 border-red-400 rounded-lg focus:ring-2 focus:ring-red-500 resize-none bg-white shadow-sm"
                rows="2"
                placeholder="Is there a plan? How specific? How lethal?"
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Access to Means</span>
              <textarea
                className="w-full px-4 py-3 border-2 border-red-400 rounded-lg focus:ring-2 focus:ring-red-500 resize-none bg-white shadow-sm"
                rows="2"
                placeholder="Does client have access to lethal means (firearms, medications, etc.)?"
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Timeline</span>
              <input
                type="text"
                className="w-full px-4 py-3 border-2 border-red-400 rounded-lg focus:ring-2 focus:ring-red-500 bg-white shadow-sm"
                placeholder="When? Immediate? Within days/weeks?"
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Previous Attempts</span>
              <textarea
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-red-500 resize-none bg-white shadow-sm"
                rows="2"
                placeholder="History of suicide attempts? When? Method? Outcome?"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Homicidal Ideation Assessment */}
      <div className="card-main bg-red-50 border-2 border-red-300">
        <h3 className="text-lg font-semibold text-red-800 mb-4">
          <span className="mr-2">🔴</span>
          Homicidal/Violence Risk Assessment
        </h3>
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-3 mb-2">
              <input type="checkbox" className="w-5 h-5 text-red-600 rounded" />
              <span className="font-semibold text-red-800">Homicidal ideation or violence risk present</span>
            </label>
          </div>
          <textarea
            className="w-full px-4 py-3 border-2 border-red-400 rounded-lg focus:ring-2 focus:ring-red-500 resize-none bg-white shadow-sm"
            rows="4"
            placeholder="Target identified? Plan? Access to weapons? History of violence? Duty to warn considerations?"
          />
        </div>
      </div>

      {/* Self-Harm Assessment */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-orange-700 mb-4">
          <span className="mr-2">🩹</span>
          Self-Harm Assessment
        </h3>
        <div className="space-y-3">
          <div>
            <label className="flex items-center gap-3 mb-2">
              <input type="checkbox" className="w-5 h-5 text-orange-600 rounded" />
              <span className="font-semibold text-gray-700">Non-suicidal self-injury present</span>
            </label>
          </div>
          <textarea
            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none bg-white shadow-sm"
            rows="3"
            placeholder="Methods? Frequency? Function (emotion regulation, punishment, etc.)?"
          />
        </div>
      </div>

      {/* Risk & Protective Factors */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-orange-700 mb-4">
          <span className="mr-2">⚖️</span>
          Risk & Protective Factors
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-red-700 mb-2 block">Risk Factors</span>
              <textarea
                className="w-full px-4 py-3 border-2 border-red-400 rounded-lg focus:ring-2 focus:ring-red-500 resize-none bg-white shadow-sm"
                rows="5"
                placeholder="- Recent losses
- Substance use
- Social isolation
- Hopelessness
- Impulsivity
- Access to means
- Mental health symptoms
- Financial/legal problems"
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-green-700 mb-2 block">Protective Factors</span>
              <textarea
                className="w-full px-4 py-3 border-2 border-green-400 rounded-lg focus:ring-2 focus:ring-green-500 resize-none bg-white shadow-sm"
                rows="5"
                placeholder="- Strong support system
- Reasons for living
- Engaged in treatment
- Coping skills
- Religious/spiritual beliefs
- Future goals
- Responsibility to others
- Problem-solving ability"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Overall Risk Level */}
      <div className="card-main bg-orange-100 border-2 border-orange-400">
        <h3 className="text-lg font-semibold text-orange-800 mb-4">
          <span className="mr-2">📊</span>
          Overall Risk Level
        </h3>
        <div className="space-y-3">
          <div className="flex gap-4">
            {['Low', 'Low-Moderate', 'Moderate', 'Moderate-High', 'High', 'Imminent'].map(level => (
              <label key={level} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="overallRisk"
                  value={level}
                  className="w-4 h-4 text-orange-600"
                />
                <span className={`text-sm font-medium ${level.includes('High') || level === 'Imminent' ? 'text-red-700' : 'text-gray-700'}`}>
                  {level}
                </span>
              </label>
            ))}
          </div>
          <textarea
            value={note.riskAssessment || ''}
            onChange={(e) => handleChange('riskAssessment', e.target.value)}
            className="w-full px-4 py-3 border-2 border-orange-400 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none bg-white shadow-sm"
            rows="4"
            placeholder="Clinical rationale for risk level determination..."
            required
          />
        </div>
      </div>

      {/* Interventions & Safety Plan */}
      <div className="card-main bg-green-50 border-2 border-green-400">
        <h3 className="text-lg font-semibold text-green-800 mb-4">
          <span className="mr-2">🛡️</span>
          Interventions & Safety Plan
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Interventions Provided</span>
              <textarea
                value={note.intervention || ''}
                onChange={(e) => handleChange('intervention', e.target.value)}
                className="w-full px-4 py-3 border-2 border-green-400 rounded-lg focus:ring-2 focus:ring-green-500 resize-none bg-white shadow-sm"
                rows="3"
                placeholder="Crisis counseling, means restriction, emergency contacts, referrals..."
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Safety Plan</span>
              <textarea
                value={note.plan || ''}
                onChange={(e) => handleChange('plan', e.target.value)}
                className="w-full px-4 py-3 border-2 border-green-400 rounded-lg focus:ring-2 focus:ring-green-500 resize-none bg-white shadow-sm"
                rows="6"
                placeholder="Detailed safety plan:
- Warning signs
- Coping strategies
- Distraction activities
- Support contacts (names & numbers)
- Professional resources
- Crisis line numbers (988)
- Means restriction plan
- Follow-up schedule"
                required
              />
            </label>
          </div>
        </div>
      </div>

      {/* Follow-Up Plan */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-orange-700 mb-4">
          <span className="mr-2">📅</span>
          Follow-Up Plan
        </h3>
        <textarea
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none bg-white shadow-sm"
          rows="3"
          placeholder="Next appointment? Frequency of contact? Collateral involvement? Referrals?"
        />
      </div>
    </div>
  );
}

export default RiskAssessmentTemplate;
