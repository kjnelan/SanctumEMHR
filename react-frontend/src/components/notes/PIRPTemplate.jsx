/**
 * Mindline EMHR
 * PIRPTemplate - PIRP format clinical note template
 * P - Problem (presenting issue/chief complaint)
 * I - Intervention (what you did)
 * R - Response (how client responded)
 * P - Plan (what's next)
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
import { getTreatmentGoals } from '../../utils/api';

/**
 * Props:
 * - note: object - Current note data
 * - onChange: function(field, value) - Callback when field changes
 * - patientId: number - Patient ID for fetching goals
 * - autoSave: function() - Trigger auto-save
 */
function PIRPTemplate({ note, onChange, patientId, autoSave }) {
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
      {/* P - Problem/Presenting Issue */}
      <div className="card-main">
        <label className="block">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800">
              <span className="text-purple-600 mr-2">P</span>
              Problem / Presenting Issue
            </span>
            <span className="text-xs text-gray-500">Chief complaint, reason for session</span>
          </div>
          <textarea
            value={note.behaviorProblem || ''}
            onChange={(e) => handleChange('behaviorProblem', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none bg-white shadow-sm"
            rows="4"
            placeholder="Example: Client reports increased anxiety related to work stress. Difficulty concentrating, racing thoughts, sleep disruption. Concerned about upcoming performance review..."
          />
        </label>

        {/* Quick-select problem tags */}
        <div className="mt-3">
          <div className="text-xs font-semibold text-gray-600 mb-2">Quick Tags (Optional)</div>
          <div className="flex flex-wrap gap-2">
            {['Anxiety', 'Depression', 'Stress', 'Trauma', 'Grief', 'Relationship Issues', 'Work Stress', 'Sleep Issues', 'Anger', 'Self-Esteem'].map((tag) => {
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
                      ? 'bg-purple-500 text-white'
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

      {/* I - Intervention */}
      <div className="card-main">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800">
              <span className="text-purple-600 mr-2">I</span>
              Intervention / What You Did
            </span>
          </div>
          <textarea
            value={note.intervention || ''}
            onChange={(e) => handleChange('intervention', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none bg-white shadow-sm"
            rows="4"
            placeholder="Narrative description of interventions used... (or use checkboxes below for quick selection)"
          />
        </div>

        {/* Intervention Picker */}
        <div className="border-t border-gray-200 pt-4">
          <div className="text-sm font-semibold text-gray-700 mb-3">Select Interventions Used</div>
          <InterventionPicker
            selectedInterventions={note.interventionsSelected || []}
            onChange={(interventions) => handleChange('interventionsSelected', interventions)}
            riskPresent={riskPresent}
          />
        </div>
      </div>

      {/* R - Response */}
      <div className="card-main">
        <label className="block">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800">
              <span className="text-purple-600 mr-2">R</span>
              Response / How Client Responded
            </span>
            <span className="text-xs text-gray-500">Client's reaction to interventions</span>
          </div>
          <textarea
            value={note.response || ''}
            onChange={(e) => handleChange('response', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none bg-white shadow-sm"
            rows="4"
            placeholder="Example: Client reported feeling validated after reframing negative thoughts. Expressed willingness to practice relaxation techniques. Appeared more hopeful by end of session..."
          />
        </label>
      </div>

      {/* P - Plan */}
      <div className="card-main">
        <label className="block mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800">
              <span className="text-purple-600 mr-2">P</span>
              Plan / What's Next
            </span>
            <span className="text-xs text-gray-500">Homework, next steps, follow-up</span>
          </div>
          <textarea
            value={note.plan || ''}
            onChange={(e) => handleChange('plan', e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none bg-white shadow-sm"
            rows="4"
            placeholder="Example: Continue weekly sessions. Homework: Practice deep breathing 3x daily. Client will monitor anxiety levels in journal. Follow up on work situation next session..."
          />
        </label>

        {/* Goals Addressed */}
        {!loadingGoals && goals.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="text-sm font-semibold text-gray-700 mb-3">
              Treatment Goals Addressed This Session
            </div>
            <div className="space-y-2">
              {goals.map((goal) => (
                <label
                  key={goal.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={(note.goalsAddressed || []).includes(goal.id)}
                    onChange={() => handleGoalToggle(goal.id)}
                    className="mt-0.5 w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
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

export default PIRPTemplate;
