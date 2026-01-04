/**
 * Mindline EMHR
 * MSETemplate - Mental Status Exam template
 * Structured psychiatric assessment tool
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
function MSETemplate({ note, onChange, autoSave }) {
  const [riskPresent, setRiskPresent] = useState(note.riskPresent || false);

  const handleChange = (field, value) => {
    onChange(field, value);
    // Trigger auto-save after small delay
    if (autoSave) {
      setTimeout(() => autoSave(), 500);
    }
  };

  const handleRiskToggle = (checked) => {
    setRiskPresent(checked);
    handleChange('riskPresent', checked);
  };

  // Helper to create MSE field if it doesn't exist
  const getMSEField = (fieldName) => {
    const mse = note.mentalStatusExam || {};
    return mse[fieldName] || '';
  };

  const setMSEField = (fieldName, value) => {
    const mse = note.mentalStatusExam || {};
    handleChange('mentalStatusExam', { ...mse, [fieldName]: value });
  };

  const SelectField = ({ label, field, options }) => (
    <div>
      <label className="block">
        <span className="text-sm font-semibold text-gray-700 mb-2 block">{label}</span>
        <select
          value={getMSEField(field)}
          onChange={(e) => setMSEField(field, e.target.value)}
          className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white shadow-sm"
        >
          <option value="">Select...</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </label>
    </div>
  );

  const TextAreaField = ({ label, field, placeholder, rows = 3 }) => (
    <div>
      <label className="block">
        <span className="text-sm font-semibold text-gray-700 mb-2 block">{label}</span>
        <textarea
          value={getMSEField(field)}
          onChange={(e) => setMSEField(field, e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none bg-white shadow-sm"
          rows={rows}
          placeholder={placeholder}
        />
      </label>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Appearance & Grooming */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-teal-700 mb-4">
          <span className="mr-2">👤</span>
          Appearance & Grooming
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="General Appearance"
            field="appearance"
            options={['Well-groomed', 'Disheveled', 'Unkempt', 'Bizarre', 'Appropriate', 'Casual']}
          />
          <SelectField
            label="Hygiene"
            field="hygiene"
            options={['Good', 'Fair', 'Poor', 'Malodorous']}
          />
        </div>
        <div className="mt-4">
          <TextAreaField
            label="Additional Notes"
            field="appearanceNotes"
            placeholder="Additional observations about appearance..."
            rows={2}
          />
        </div>
      </div>

      {/* Behavior & Motor Activity */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-teal-700 mb-4">
          <span className="mr-2">🏃</span>
          Behavior & Motor Activity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Psychomotor Activity"
            field="psychomotorActivity"
            options={['Normal', 'Agitated', 'Retarded', 'Restless', 'Hyperactive', 'Lethargic']}
          />
          <SelectField
            label="Eye Contact"
            field="eyeContact"
            options={['Good', 'Fair', 'Poor', 'Avoidant', 'Intense/Staring']}
          />
        </div>
        <div className="mt-4">
          <TextAreaField
            label="Additional Behavioral Observations"
            field="behaviorNotes"
            placeholder="Tics, tremors, mannerisms, gait, posture..."
            rows={2}
          />
        </div>
      </div>

      {/* Speech */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-teal-700 mb-4">
          <span className="mr-2">💬</span>
          Speech
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField
            label="Rate"
            field="speechRate"
            options={['Normal', 'Slow', 'Rapid', 'Pressured']}
          />
          <SelectField
            label="Volume"
            field="speechVolume"
            options={['Normal', 'Loud', 'Soft', 'Whispered']}
          />
          <SelectField
            label="Tone"
            field="speechTone"
            options={['Normal', 'Monotone', 'Varied', 'Flat']}
          />
        </div>
        <div className="mt-4">
          <TextAreaField
            label="Speech Characteristics"
            field="speechNotes"
            placeholder="Slurred, stuttering, articulation issues..."
            rows={2}
          />
        </div>
      </div>

      {/* Mood & Affect */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-teal-700 mb-4">
          <span className="mr-2">😊</span>
          Mood & Affect
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700 mb-2 block">Mood (subjective)</span>
              <input
                type="text"
                value={getMSEField('mood')}
                onChange={(e) => setMSEField('mood', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white shadow-sm"
                placeholder="Client's own words (e.g., 'sad', 'anxious')"
              />
            </label>
          </div>
          <SelectField
            label="Affect (objective)"
            field="affect"
            options={['Appropriate', 'Flat', 'Blunted', 'Labile', 'Restricted', 'Congruent', 'Incongruent']}
          />
        </div>
        <div className="mt-4">
          <TextAreaField
            label="Mood & Affect Details"
            field="moodNotes"
            placeholder="Congruence, range, reactivity..."
            rows={2}
          />
        </div>
      </div>

      {/* Thought Process */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-teal-700 mb-4">
          <span className="mr-2">🧩</span>
          Thought Process
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Organization"
            field="thoughtProcess"
            options={['Logical', 'Goal-directed', 'Tangential', 'Circumstantial', 'Loose associations', 'Flight of ideas', 'Thought blocking']}
          />
          <SelectField
            label="Flow"
            field="thoughtFlow"
            options={['Normal', 'Rapid', 'Slow', 'Interrupted']}
          />
        </div>
        <div className="mt-4">
          <TextAreaField
            label="Additional Observations"
            field="thoughtProcessNotes"
            placeholder="Racing thoughts, ruminations, perseverations..."
            rows={2}
          />
        </div>
      </div>

      {/* Thought Content */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-teal-700 mb-4">
          <span className="mr-2">💭</span>
          Thought Content
        </h3>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {['Suicidal ideation', 'Homicidal ideation', 'Delusions', 'Obsessions', 'Phobias', 'Paranoia'].map(item => (
              <label key={item} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(getMSEField('thoughtContent') || []).includes(item)}
                  onChange={(e) => {
                    const current = getMSEField('thoughtContent') || [];
                    const updated = e.target.checked
                      ? [...current, item]
                      : current.filter(i => i !== item);
                    setMSEField('thoughtContent', updated);
                  }}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">{item}</span>
              </label>
            ))}
          </div>
          <TextAreaField
            label="Thought Content Details"
            field="thoughtContentNotes"
            placeholder="Describe any concerning thought content, including intent, plan, means..."
            rows={3}
          />
        </div>
      </div>

      {/* Perception */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-teal-700 mb-4">
          <span className="mr-2">👁️</span>
          Perception
        </h3>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {['No perceptual disturbances', 'Auditory hallucinations', 'Visual hallucinations', 'Tactile hallucinations', 'Illusions', 'Depersonalization', 'Derealization'].map(item => (
              <label key={item} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(getMSEField('perception') || []).includes(item)}
                  onChange={(e) => {
                    const current = getMSEField('perception') || [];
                    const updated = e.target.checked
                      ? [...current, item]
                      : current.filter(i => i !== item);
                    setMSEField('perception', updated);
                  }}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">{item}</span>
              </label>
            ))}
          </div>
          <TextAreaField
            label="Perception Details"
            field="perceptionNotes"
            placeholder="Describe any perceptual disturbances..."
            rows={2}
          />
        </div>
      </div>

      {/* Cognition */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-teal-700 mb-4">
          <span className="mr-2">🧠</span>
          Cognition
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField
            label="Orientation"
            field="orientation"
            options={['Oriented x4', 'Oriented x3', 'Oriented x2', 'Oriented x1', 'Disoriented']}
          />
          <SelectField
            label="Memory"
            field="memory"
            options={['Intact', 'Impaired recent', 'Impaired remote', 'Impaired both']}
          />
          <SelectField
            label="Concentration"
            field="concentration"
            options={['Good', 'Fair', 'Poor', 'Distractible']}
          />
        </div>
        <div className="mt-4">
          <TextAreaField
            label="Cognitive Details"
            field="cognitionNotes"
            placeholder="Attention, abstract thinking, calculations..."
            rows={2}
          />
        </div>
      </div>

      {/* Insight & Judgment */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-teal-700 mb-4">
          <span className="mr-2">💡</span>
          Insight & Judgment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Insight"
            field="insight"
            options={['Good', 'Fair', 'Poor', 'Absent']}
          />
          <SelectField
            label="Judgment"
            field="judgment"
            options={['Good', 'Fair', 'Poor', 'Impaired']}
          />
        </div>
        <div className="mt-4">
          <TextAreaField
            label="Insight & Judgment Details"
            field="insightJudgmentNotes"
            placeholder="Awareness of illness, decision-making capacity..."
            rows={2}
          />
        </div>
      </div>

      {/* Summary & Impressions */}
      <div className="card-main">
        <h3 className="text-lg font-semibold text-teal-700 mb-4">
          <span className="mr-2">📋</span>
          Clinical Summary & Impressions
        </h3>
        <TextAreaField
          label="Summary"
          field="summary"
          placeholder="Overall clinical impression, diagnostic considerations, recommendations..."
          rows={5}
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

export default MSETemplate;
