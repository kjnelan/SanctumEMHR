/**
 * SanctumEMHR EMHR
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

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

/**
 * Props:
 * - onSelect: function(noteType, templateFormat) - Callback when note type is selected
 * - preselected: string - Pre-selected note type based on context
 * - appointment: object - Optional appointment context for smart suggestions
 */
function NoteTypeSelector({ onSelect, preselected = null, appointment = null }) {
  const { user } = useAuth();
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // Check if user is a social worker (for case management notes)
  const isSocialWorker = user?.isSocialWorker || false;
  const isProvider = user?.isProvider || false;
  // Organized by clinical workflow - single section
  const noteTypes = [
    // Row 1: Primary clinical workflow
    {
      id: 'intake',
      label: 'Intake Assessment',
      description: 'First session with client',
      icon: '🤝',
      row: 1,
      cols: 3
    },
    {
      id: 'diagnosis',
      label: 'Diagnosis Note',
      description: 'ICD-10 diagnosis assessment and documentation',
      icon: '🏥',
      row: 1,
      cols: 3
    },
    {
      id: 'treatment_plan',
      label: 'Treatment Plan',
      description: 'Goals, objectives, interventions',
      icon: '📋',
      row: 1,
      cols: 3
    },
    {
      id: 'progress',
      label: 'Progress Note',
      description: 'Regular therapy session',
      icon: '📊',
      row: 1,
      cols: 3
    },
    // Row 2: Assessment & Closure
    {
      id: 'mse',
      label: 'Mental Status Exam',
      description: 'Standalone MSE assessment',
      icon: '🧠',
      row: 2,
      cols: 6
    },
    {
      id: 'discharge',
      label: 'Discharge Summary',
      description: 'Final session, treatment conclusion',
      icon: '✅',
      row: 2,
      cols: 6
    },
    // Row 3: Crisis & Risk
    {
      id: 'crisis',
      label: 'Crisis Note',
      description: 'Emergency or high-risk session',
      icon: '⚠️',
      row: 3,
      cols: 6
    },
    {
      id: 'risk_assessment',
      label: 'Risk Assessment',
      description: 'SI/HI safety evaluation',
      icon: '🛡️',
      row: 3,
      cols: 6
    },
    // Row 4: Administrative
    {
      id: 'appointment_status',
      label: 'Appointment Status',
      description: 'No show, late cancel, cancellation',
      icon: '📅',
      row: 4,
      cols: 6,
      quick: true
    },
    {
      id: 'client_communication',
      label: 'Client Communication',
      description: 'Phone calls, emails, client contact',
      icon: '📞',
      row: 4,
      cols: 6,
      quick: true
    },
    // Row 5: Case Management (for social workers)
    {
      id: 'case_management',
      label: 'Case Management Note',
      description: 'Resource coordination, referrals, advocacy',
      icon: '🤝',
      row: 5,
      cols: 12,
      socialWorkerOnly: true
    }
  ];

  // Progress note template formats
  const templateFormats = [
    {
      id: 'BIRP',
      label: 'BIRP',
      description: 'Behavior, Intervention, Response, Plan',
      color: 'blue'
    },
    {
      id: 'PIRP',
      label: 'PIRP',
      description: 'Problem, Intervention, Response, Plan',
      color: 'purple'
    },
    {
      id: 'SOAP',
      label: 'SOAP',
      description: 'Subjective, Objective, Assessment, Plan',
      color: 'green'
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
    // For progress notes, show template format selector
    if (noteType === 'progress' && isProvider) {
      setShowTemplateSelector(true);
      return;
    }
    // For all other notes, proceed directly
    onSelect(noteType);
  };

  const handleTemplateSelect = (templateFormat) => {
    onSelect('progress', templateFormat);
  };

  const handleBackToTypes = () => {
    setShowTemplateSelector(false);
  };

  // Group by rows - filter by user role for social worker notes
  const row1 = noteTypes.filter(t => t.row === 1 && !t.socialWorkerOnly);
  const row2 = noteTypes.filter(t => t.row === 2 && !t.socialWorkerOnly);
  const row3 = noteTypes.filter(t => t.row === 3 && !t.socialWorkerOnly);
  const row4 = noteTypes.filter(t => t.row === 4 && !t.socialWorkerOnly);
  const row5 = noteTypes.filter(t => t.row === 5 && t.socialWorkerOnly && isSocialWorker);

  // Template format selector for progress notes
  if (showTemplateSelector) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Back button */}
        <button
          onClick={handleBackToTypes}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <span>←</span>
          <span>Back to note types</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Choose Your Progress Note Format
          </h2>
          <p className="text-gray-600">
            Select the documentation format you prefer
          </p>
        </div>

        {/* Template Format Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templateFormats.map((format) => (
            <button
              key={format.id}
              onClick={() => handleTemplateSelect(format.id)}
              className={`card-main text-left p-6 hover:bg-${format.color}-50 hover:border-${format.color}-300 transition-all`}
            >
              <div className="text-center">
                <div className={`text-3xl font-bold text-${format.color}-600 mb-3`}>
                  {format.id}
                </div>
                <div className="text-sm text-gray-600">
                  {format.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Format descriptions */}
        <div className="mt-8 card-main bg-gray-50">
          <h3 className="font-semibold text-gray-800 mb-3">Format Guide</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <span className="font-semibold text-blue-600">BIRP:</span> Focuses on client behavior observed during session, interventions used, client response, and future plan.
            </div>
            <div>
              <span className="font-semibold text-purple-600">PIRP:</span> Starts with presenting problem/issue, then documents interventions, response, and plan.
            </div>
            <div>
              <span className="font-semibold text-green-600">SOAP:</span> Medical model format - subjective reports, objective observations, clinical assessment, and treatment plan.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          What kind of note are you writing?
        </h2>
        <p className="text-gray-600">
          Select the type of clinical documentation
        </p>
      </div>

      {/* Clinical Notes Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Clinical Notes
        </h3>

        {/* Row 1: Primary Workflow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {row1.map((noteType) => (
            <button
              key={noteType.id}
              onClick={() => handleSelect(noteType.id)}
              className={`card-main text-left p-4 hover:bg-blue-50 hover:border-blue-300 transition-all ${
                suggestion === noteType.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{noteType.icon}</div>
                <div className="flex-1">
                  <div className="text-base font-semibold text-gray-800 mb-1">
                    {noteType.label}
                    {noteType.suggested && (
                      <span className="ml-2 badge-sm badge-light-success">Suggested</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">{noteType.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Row 2: Assessment & Closure */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {row2.map((noteType) => (
            <button
              key={noteType.id}
              onClick={() => handleSelect(noteType.id)}
              className="card-main text-left p-4 hover:bg-blue-50 hover:border-blue-300 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{noteType.icon}</div>
                <div className="flex-1">
                  <div className="text-base font-semibold text-gray-800 mb-1">
                    {noteType.label}
                  </div>
                  <div className="text-xs text-gray-600">{noteType.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Row 3: Crisis & Risk */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {row3.map((noteType) => (
            <button
              key={noteType.id}
              onClick={() => handleSelect(noteType.id)}
              className="card-main text-left p-4 hover:bg-orange-50 hover:border-orange-300 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{noteType.icon}</div>
                <div className="flex-1">
                  <div className="text-base font-semibold text-gray-800 mb-1">
                    {noteType.label}
                  </div>
                  <div className="text-xs text-gray-600">{noteType.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Row 4: Administrative */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {row4.map((noteType) => (
            <button
              key={noteType.id}
              onClick={() => handleSelect(noteType.id)}
              className="card-main text-left p-4 hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{noteType.icon}</div>
                <div className="flex-1">
                  <div className="text-base font-semibold text-gray-800 mb-1">
                    {noteType.label}
                  </div>
                  <div className="text-xs text-gray-600">{noteType.description}</div>
                  {noteType.quick && (
                    <div className="mt-1 text-xs text-blue-600 font-medium">
                      ⚡ Quick note
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Row 5: Case Management (Social Workers) */}
        {row5.length > 0 && (
          <>
            <h3 className="text-sm font-semibold text-teal-600 uppercase tracking-wide mt-6">
              Case Management
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {row5.map((noteType) => (
                <button
                  key={noteType.id}
                  onClick={() => handleSelect(noteType.id)}
                  className="card-main text-left p-4 hover:bg-teal-50 hover:border-teal-300 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{noteType.icon}</div>
                    <div className="flex-1">
                      <div className="text-base font-semibold text-gray-800 mb-1">
                        {noteType.label}
                      </div>
                      <div className="text-xs text-gray-600">{noteType.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default NoteTypeSelector;
