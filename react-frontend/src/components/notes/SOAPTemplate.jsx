/**
 * SanctumEMHR EMHR
 * SOAPTemplate - SOAP format clinical note template
 * S - Subjective (what client reports)
 * O - Objective (clinical observations, test results)
 * A - Assessment (clinical impression/diagnosis)
 * P - Plan (treatment plan, next steps)
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React, { useState, useEffect } from 'react';
import InterventionPicker from './InterventionPicker';
import DiagnosisSelector from './DiagnosisSelector';
import { getTreatmentGoals } from '../../utils/api';

/**
 * Props:
 * - note: object - Current note data
 * - onChange: function(field, value) - Callback when field changes
 * - patientId: number - Patient ID for fetching goals
 * - autoSave: function() - Trigger auto-save
 */
function SOAPTemplate({ note, onChange, patientId, autoSave }) {
  const [goals, setGoals] = useState([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [riskPresent, setRiskPresent] = useState(note.riskPresent || false);

  useEffect(() => {
    loadTreatmentGoals();
  }, [patientId]);

  const loadTreatmentGoals = async () => {
    try {
      setLoadingGoals(true);
      const data = await getTreatmentGoals(patientId, { status: 'active' });
      setGoals(data.goals || []);
    } catch (err) {
      console.error('Error loading treatment goals:', err);
    } finally {
      setLoadingGoals(false);
    }
  };

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

  const handleGoalToggle = (goalId) => {
    const current = note.goalsAddressed || [];
    const isSelected = current.includes(goalId);

    if (isSelected) {
      handleChange('goalsAddressed', current.filter(id => id !== goalId));
    } else {
      handleChange('goalsAddressed', [...current, goalId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Diagnosis Selection for Billing */}
      <div className="card-main bg-blue-50 border-2 border-blue-300">
        <div className="mb-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <span>🏥</span>
            <span>Diagnosis Codes for This Session</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Select all diagnoses addressed in this session. Required for billing and clinical documentation.
          </p>
        </div>
        <DiagnosisSelector
          patientId={patientId}
          serviceDate={note.date_of_service || new Date().toISOString().split('T')[0]}
          selectedDiagnoses={note.diagnosis_codes || []}
          onChange={(diagnoses) => handleChange('diagnosis_codes', diagnoses)}
        />
      </div>

      {/* S - Subjective */}
      <div className="card-main">
        <label className="block">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800">
              <span className="text-green-600 mr-2">S</span>
              Subjective / What Client Reports
            </span>
            <span className="text-xs text-gray-500">Client's symptoms, feelings, history</span>
          </div>
          <textarea
            value={note.subjective || ''}
            onChange={(e) => handleChange('subjective', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none bg-white shadow-sm"
            rows="4"
            placeholder="Example: Client reports feeling 'overwhelmed and anxious' over the past two weeks. States difficulty sleeping, racing thoughts, and increased irritability. Denies changes in appetite. Reports work stress as primary trigger..."
          />
        </label>

        {/* Quick-select symptom tags */}
        <div className="mt-3">
          <div className="text-xs font-semibold text-gray-600 mb-2">Reported Symptoms (Optional)</div>
          <div className="flex flex-wrap gap-2">
            {['Anxiety', 'Depression', 'Sleep Issues', 'Appetite Changes', 'Fatigue', 'Racing Thoughts', 'Irritability', 'Hopelessness', 'Difficulty Concentrating', 'Social Withdrawal'].map((tag) => {
              const isSelected = (note.reportedSymptoms || []).includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => {
                    const current = note.reportedSymptoms || [];
                    if (isSelected) {
                      handleChange('reportedSymptoms', current.filter(t => t !== tag));
                    } else {
                      handleChange('reportedSymptoms', [...current, tag]);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* O - Objective */}
      <div className="card-main">
        <label className="block">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800">
              <span className="text-green-600 mr-2">O</span>
              Objective / Clinical Observations
            </span>
            <span className="text-xs text-gray-500">Mental status, appearance, behavior</span>
          </div>
          <textarea
            value={note.objective || ''}
            onChange={(e) => handleChange('objective', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none bg-white shadow-sm"
            rows="4"
            placeholder="Example: Client arrived on time, appropriately dressed. Appeared anxious with fidgeting and rapid speech. Affect congruent with stated mood. Eye contact intermittent. Thought process organized. No evidence of psychosis..."
          />
        </label>

        {/* Quick-select observation tags */}
        <div className="mt-3">
          <div className="text-xs font-semibold text-gray-600 mb-2">Presentation Tags (Optional)</div>
          <div className="flex flex-wrap gap-2">
            {['Engaged', 'Cooperative', 'Tearful', 'Anxious', 'Flat affect', 'Guarded', 'Appropriate dress', 'Good eye contact', 'Poor eye contact', 'Oriented x3'].map((tag) => {
              const isSelected = (note.clientPresentation || []).includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => {
                    const current = note.clientPresentation || [];
                    if (isSelected) {
                      handleChange('clientPresentation', current.filter(t => t !== tag));
                    } else {
                      handleChange('clientPresentation', [...current, tag]);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* A - Assessment */}
      <div className="card-main">
        <label className="block mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800">
              <span className="text-green-600 mr-2">A</span>
              Assessment / Clinical Impression
            </span>
            <span className="text-xs text-gray-500">Progress, insights, clinical judgment</span>
          </div>
          <textarea
            value={note.assessment || ''}
            onChange={(e) => handleChange('assessment', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none bg-white shadow-sm"
            rows="4"
            placeholder="Example: Client presents with symptoms consistent with Generalized Anxiety Disorder. Symptoms appear to be exacerbated by work stress. Making progress on coping skills but requires continued support..."
          />
        </label>

        {/* Intervention Picker */}
        <div className="border-t border-gray-200 pt-4">
          <div className="text-label mb-3">Interventions Used This Session</div>
          <InterventionPicker
            selectedInterventions={note.interventionsSelected || []}
            onChange={(interventions) => handleChange('interventionsSelected', interventions)}
            riskPresent={riskPresent}
          />
        </div>
      </div>

      {/* P - Plan */}
      <div className="card-main">
        <label className="block mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800">
              <span className="text-green-600 mr-2">P</span>
              Plan / Treatment Plan
            </span>
            <span className="text-xs text-gray-500">Next steps, homework, referrals</span>
          </div>
          <textarea
            value={note.plan || ''}
            onChange={(e) => handleChange('plan', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none bg-white shadow-sm"
            rows="4"
            placeholder="Example: Continue weekly therapy sessions. Homework: Practice relaxation techniques daily, complete thought log. Consider medication consultation if symptoms persist. Follow up on sleep hygiene next session..."
          />
        </label>

        {/* Goals Addressed */}
        {!loadingGoals && goals.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="text-label mb-3">
              Treatment Goals Addressed This Session
            </div>
            <div className="space-y-2">
              {goals.map((goal) => (
                <label
                  key={goal.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-green-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={(note.goalsAddressed || []).includes(goal.id)}
                    onChange={() => handleGoalToggle(goal.id)}
                    className="mt-0.5 w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-gray-800">{goal.goal_text}</div>
                    {goal.goal_category && (
                      <div className="text-xs text-gray-500 mt-1">{goal.goal_category}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Risk Assessment (Optional - only shows if risk is flagged) */}
      <div className="card-main bg-orange-50 border-2 border-orange-300">
        <label className="flex items-center gap-3 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={riskPresent}
            onChange={(e) => handleRiskToggle(e.target.checked)}
            className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
          />
          <span className="font-semibold text-gray-800">
            Risk Present (suicide, homicide, self-harm)
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

export default SOAPTemplate;
