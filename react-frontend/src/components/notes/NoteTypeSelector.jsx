/**
 * Mindline EMHR
 * NoteTypeSelector - Lightweight selector asking "What kind of note are you writing?"
 * Trauma-informed, minimal cognitive load design
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
 * - onSelect: function(noteType) - Callback when note type is selected
 * - preselected: string - Pre-selected note type based on context
 * - appointment: object - Optional appointment context for smart suggestions
 */
function NoteTypeSelector({ onSelect, preselected = null, appointment = null }) {
  const noteTypes = [
    {
      id: 'diagnosis',
      label: 'Diagnosis Note',
      description: 'ICD-10 diagnosis assessment and documentation',
      icon: '🏥',
      common: true
    },
    {
      id: 'progress',
      label: 'Progress Note',
      description: 'Regular therapy session',
      icon: '📝',
      common: true
    },
    {
      id: 'noshow',
      label: 'No-Show',
      description: 'Client did not attend',
      icon: '❌',
      common: true,
      quick: true
    },
    {
      id: 'cancel',
      label: 'Cancellation',
      description: 'Session cancelled',
      icon: '🚫',
      common: true,
      quick: true
    },
    {
      id: 'risk_assessment',
      label: 'Risk Assessment',
      description: 'Safety evaluation and risk screening',
      icon: '🛡️',
      common: false
    },
    {
      id: 'intake',
      label: 'Intake Assessment',
      description: 'First session with client',
      icon: '👋',
      common: false
    },
    {
      id: 'crisis',
      label: 'Crisis Note',
      description: 'Emergency or high-risk session',
      icon: '⚠️',
      common: false
    },
    {
      id: 'discharge',
      label: 'Discharge Summary',
      description: 'Final session, treatment conclusion',
      icon: '✅',
      common: false
    },
    {
      id: 'mse',
      label: 'Mental Status Exam',
      description: 'Standalone MSE assessment',
      icon: '🧠',
      common: false
    },
    {
      id: 'admin',
      label: 'Administrative Note',
      description: 'Non-clinical documentation',
      icon: '📋',
      common: false
    }
  ];

  // Smart pre-selection logic
  const getSuggestion = () => {
    if (preselected) return preselected;

    if (appointment) {
      // First appointment? Suggest intake
      // Crisis flag? Suggest crisis note
      // etc. - Add logic based on appointment data
    }

    return 'progress'; // Default
  };

  const suggestion = getSuggestion();

  const handleSelect = (noteType) => {
    onSelect(noteType);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          What kind of note are you writing?
        </h2>
        <p className="text-gray-600">
          Select the type of clinical documentation
        </p>
      </div>

      {/* Common note types (larger buttons) */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Most Common
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {noteTypes.filter(t => t.common).map((noteType) => (
            <button
              key={noteType.id}
              onClick={() => handleSelect(noteType.id)}
              className={`card-main text-left p-5 hover:bg-blue-50 hover:border-blue-300 transition-all ${
                suggestion === noteType.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{noteType.icon}</div>
                <div className="flex-1">
                  <div className="text-lg font-semibold text-gray-800 mb-1">
                    {noteType.label}
                    {suggestion === noteType.id && (
                      <span className="ml-2 badge-sm badge-light-success">Suggested</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{noteType.description}</div>
                  {noteType.quick && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">
                      ⚡ Quick note (no full editor)
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Specialized note types */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Specialized Documentation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {noteTypes.filter(t => !t.common).map((noteType) => (
            <button
              key={noteType.id}
              onClick={() => handleSelect(noteType.id)}
              className="card-main text-left p-4 hover:bg-blue-50 hover:border-blue-300 transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="text-2xl">{noteType.icon}</div>
                <div className="text-base font-semibold text-gray-800">
                  {noteType.label}
                </div>
              </div>
              <div className="text-xs text-gray-600">{noteType.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NoteTypeSelector;
