/**
 * SanctumEMHR EMHR
 * TreatmentPlanTemplate - Comprehensive treatment planning
 * Goals, objectives, interventions, frequency, expected duration
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
function TreatmentPlanTemplate({ note, onChange, autoSave }) {
  const handleChange = (field, value) => {
    onChange(field, value);
    if (autoSave) {
      setTimeout(() => autoSave(), 500);
    }
  };

  const getField = (fieldName) => {
    const plan = note.treatmentPlan || {};
    return plan[fieldName] || '';
  };

  const setField = (fieldName, value) => {
    const plan = note.treatmentPlan || {};
    handleChange('treatmentPlan', { ...plan, [fieldName]: value });
  };

  return (
    <div className="space-y-6">
      {/* Treatment Goals */}
      <div className="card-main">
        <h3 className="section-header-blue">
          <span className="mr-2">🎯</span>
          Treatment Goals
        </h3>
        <div className="text-sm text-gray-600 mb-3">
          What are the primary goals of treatment? What does the client hope to achieve?
        </div>
        <textarea
          value={getField('goals')}
          onChange={(e) => setField('goals', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white shadow-sm"
          rows="5"
          placeholder="Example:&#10;1. Reduce anxiety symptoms to manageable levels&#10;2. Develop healthy coping strategies for stress&#10;3. Improve relationships with family members&#10;4. Return to work/school functioning"
        />
      </div>

      {/* Target Behaviors & Objectives */}
      <div className="card-main">
        <h3 className="section-header-blue">
          <span className="mr-2">📍</span>
          Target Behaviors & Objectives
        </h3>
        <div className="text-sm text-gray-600 mb-3">
          Specific, measurable objectives. What behaviors or symptoms will change?
        </div>
        <textarea
          value={getField('objectives')}
          onChange={(e) => setField('objectives', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white shadow-sm"
          rows="5"
          placeholder="Example:&#10;- Client will identify and challenge 3 cognitive distortions per week&#10;- Client will practice deep breathing exercises daily&#10;- Client will attend all scheduled sessions&#10;- Client will report anxiety level of 5 or below (0-10 scale) within 8 weeks"
        />
      </div>

      {/* Interventions & Modalities */}
      <div className="card-main">
        <h3 className="section-header-blue">
          <span className="mr-2">🛠️</span>
          Interventions & Treatment Modalities
        </h3>
        <div className="text-sm text-gray-600 mb-3">
          What therapeutic approaches, techniques, or interventions will be used?
        </div>
        <textarea
          value={getField('interventions')}
          onChange={(e) => setField('interventions', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white shadow-sm"
          rows="5"
          placeholder="Example:&#10;- Cognitive Behavioral Therapy (CBT)&#10;- Dialectical Behavior Therapy (DBT) skills training&#10;- Mindfulness and relaxation techniques&#10;- EMDR for trauma processing&#10;- Family therapy sessions (as needed)&#10;- Psychoeducation about anxiety/depression"
        />
      </div>

      {/* Treatment Frequency & Duration */}
      <div className="card-main">
        <h3 className="section-header-blue">
          <span className="mr-2">📅</span>
          Treatment Frequency & Expected Duration
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block">
              <span className="text-label block mb-2">Session Frequency</span>
              <textarea
                value={getField('frequency')}
                onChange={(e) => setField('frequency', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white shadow-sm"
                rows="2"
                placeholder="Example: Weekly 50-minute sessions, with option to increase to twice weekly if needed"
              />
            </label>
          </div>
          <div>
            <label className="block">
              <span className="text-label block mb-2">Expected Duration of Treatment</span>
              <textarea
                value={getField('duration')}
                onChange={(e) => setField('duration', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white shadow-sm"
                rows="2"
                placeholder="Example: 12-16 weeks of weekly therapy, with ongoing reassessment of progress"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Barriers to Treatment */}
      <div className="card-main">
        <h3 className="section-header-blue">
          <span className="mr-2">⚠️</span>
          Potential Barriers & Mitigation Strategies
        </h3>
        <div className="text-sm text-gray-600 mb-3">
          What might interfere with treatment success? How will barriers be addressed?
        </div>
        <textarea
          value={getField('barriers')}
          onChange={(e) => setField('barriers', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white shadow-sm"
          rows="4"
          placeholder="Example:&#10;- Transportation issues → Offer telehealth options&#10;- Work schedule conflicts → Offer early morning or evening appointments&#10;- Financial concerns → Sliding scale fee, connect with financial assistance resources&#10;- Language barriers → Provide interpreter services"
        />
      </div>

      {/* Discharge Criteria */}
      <div className="card-main">
        <h3 className="section-header-blue">
          <span className="mr-2">✅</span>
          Discharge Criteria & Success Indicators
        </h3>
        <div className="text-sm text-gray-600 mb-3">
          How will we know treatment has been successful? What indicates readiness for discharge?
        </div>
        <textarea
          value={getField('dischargeCriteria')}
          onChange={(e) => setField('dischargeCriteria', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white shadow-sm"
          rows="4"
          placeholder="Example:&#10;- Client reports anxiety symptoms manageable without therapy support&#10;- Client demonstrates consistent use of coping skills&#10;- Client feels confident managing stressors independently&#10;- Client has achieved treatment goals&#10;- Client expresses readiness to discontinue therapy"
        />
      </div>

      {/* Client Agreement */}
      <div className="card-main bg-blue-50 border-2 border-blue-300">
        <h3 className="section-header-blue">
          <span className="mr-2">🤝</span>
          Client Agreement & Collaboration
        </h3>
        <div className="text-sm text-gray-600 mb-3">
          Document client's understanding, agreement, and input on the treatment plan
        </div>
        <textarea
          value={getField('clientAgreement')}
          onChange={(e) => setField('clientAgreement', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white shadow-sm"
          rows="3"
          placeholder="Example: Client reviewed treatment plan and expressed agreement with goals and proposed interventions. Client voiced concerns about time commitment, and we agreed to reassess frequency after 4 weeks."
        />
      </div>
    </div>
  );
}

export default TreatmentPlanTemplate;
