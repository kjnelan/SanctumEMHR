/**
 * SanctumEMHR EMHR
 * Diagnosis Note Template
 *
 * Comprehensive diagnosis assessment form that serves as the source of truth
 * for client diagnoses and automatically syncs to billing table.
 *
 * Fields:
 * - ICD-10 code selection (multi-select with billable flags)
 * - Symptoms reported by client
 * - Symptoms observed by clinician
 * - Clinical justification
 * - Differential diagnosis
 * - Severity specifiers
 * - Functional impairment
 * - Duration of symptoms
 * - Previous diagnoses
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4B
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React from 'react';
import ICD10Picker from './ICD10Picker';
import { FormLabel } from '../FormLabel';

function DiagnosisTemplate({ note, onChange, disabled = false }) {
  const handleFieldChange = (field, value) => {
    onChange(field, value);
  };

  const handleDiagnosisCodesChange = (codes) => {
    handleFieldChange('diagnosis_codes', JSON.stringify(codes));
  };

  // Parse diagnosis_codes from JSON string (handle empty strings safely)
  let diagnosisCodes = [];
  try {
    if (note.diagnosis_codes) {
      if (typeof note.diagnosis_codes === 'string') {
        const trimmed = note.diagnosis_codes.trim();
        if (trimmed.length > 0) {
          diagnosisCodes = JSON.parse(trimmed);
        }
      } else if (Array.isArray(note.diagnosis_codes)) {
        diagnosisCodes = note.diagnosis_codes;
      }
    }
  } catch (e) {
    console.error('Failed to parse diagnosis_codes, using empty array:', e, note.diagnosis_codes);
    diagnosisCodes = [];
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Diagnosis Assessment
        </h2>
        <p className="text-sm text-gray-600">
          This diagnosis note serves as the clinical source of truth and will automatically
          sync billable codes to the billing system when signed.
        </p>
      </div>

      {/* ICD-10 Code Selection */}
      <div className="card-main">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          ICD-10 Diagnosis Codes
        </h3>
        <div className="card-inner">
          <ICD10Picker
            selectedCodes={diagnosisCodes}
            onChange={handleDiagnosisCodesChange}
            maxBillable={4}
            showBillableToggle={true}
            showPrimarySelector={true}
            showSeveritySelector={true}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Clinical Assessment Section */}
      <div className="card-main">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Clinical Assessment
        </h3>
        <div className="card-inner space-y-6">
          {/* Symptoms Reported */}
          <div>
            <FormLabel>
              Symptoms Reported by Client
              <span className="ml-2 text-gray-500 font-normal">
                (What the client describes)
              </span>
            </FormLabel>
            <textarea
              value={note.symptoms_reported || ''}
              onChange={(e) => handleFieldChange('symptoms_reported', e.target.value)}
              disabled={disabled}
              rows={4}
              placeholder="Document symptoms as reported by the client in their own words..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Symptoms Observed */}
          <div>
            <FormLabel>
              Symptoms Observed by Clinician
              <span className="ml-2 text-gray-500 font-normal">
                (What you directly observe)
              </span>
            </FormLabel>
            <textarea
              value={note.symptoms_observed || ''}
              onChange={(e) => handleFieldChange('symptoms_observed', e.target.value)}
              disabled={disabled}
              rows={4}
              placeholder="Document observable symptoms, behavioral indicators, presentation..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Duration */}
          <div>
            <FormLabel>
              Duration of Symptoms
            </FormLabel>
            <textarea
              value={note.duration_of_symptoms || ''}
              onChange={(e) => handleFieldChange('duration_of_symptoms', e.target.value)}
              disabled={disabled}
              rows={2}
              placeholder="How long have symptoms been present? When did they begin?"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Diagnostic Reasoning */}
      <div className="card-main">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Diagnostic Reasoning
        </h3>
        <div className="card-inner space-y-6">
          {/* Clinical Justification */}
          <div>
            <FormLabel>
              Clinical Justification
              <span className="ml-2 text-gray-500 font-normal">
                (Why this diagnosis?)
              </span>
            </FormLabel>
            <textarea
              value={note.clinical_justification || ''}
              onChange={(e) => handleFieldChange('clinical_justification', e.target.value)}
              disabled={disabled}
              rows={5}
              placeholder="Explain the clinical reasoning for this diagnosis. Include DSM-5 criteria met, frequency/intensity of symptoms, impact on functioning..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Differential Diagnosis */}
          <div>
            <FormLabel>
              Differential Diagnosis
              <span className="ml-2 text-gray-500 font-normal">
                (What else was considered and ruled out?)
              </span>
            </FormLabel>
            <textarea
              value={note.differential_diagnosis || ''}
              onChange={(e) => handleFieldChange('differential_diagnosis', e.target.value)}
              disabled={disabled}
              rows={4}
              placeholder="Document other diagnoses considered and reasons they were ruled out..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Severity/Specifiers */}
          <div>
            <FormLabel>
              Severity & Specifiers
              <span className="ml-2 text-gray-500 font-normal">
                (Additional clinical details)
              </span>
            </FormLabel>
            <textarea
              value={note.severity_specifiers || ''}
              onChange={(e) => handleFieldChange('severity_specifiers', e.target.value)}
              disabled={disabled}
              rows={3}
              placeholder="Document severity level, course specifiers, additional features (e.g., 'with anxious distress', 'in partial remission')..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Functional Impact */}
      <div className="card-main">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Functional Impact
        </h3>
        <div className="card-inner">
          <FormLabel>
            Functional Impairment
            <span className="ml-2 text-gray-500 font-normal">
              (How symptoms affect daily life and functioning)
            </span>
          </FormLabel>
          <textarea
            value={note.functional_impairment || ''}
            onChange={(e) => handleFieldChange('functional_impairment', e.target.value)}
            disabled={disabled}
            rows={4}
            placeholder="Document impact on work, relationships, self-care, social functioning, occupational performance..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Diagnosis History */}
      <div className="card-main">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Diagnosis History
        </h3>
        <div className="card-inner">
          <FormLabel>
            Previous Diagnoses
            <span className="ml-2 text-gray-500 font-normal">
              (Prior diagnostic history and changes)
            </span>
          </FormLabel>
          <textarea
            value={note.previous_diagnoses || ''}
            onChange={(e) => handleFieldChange('previous_diagnoses', e.target.value)}
            disabled={disabled}
            rows={3}
            placeholder="Document previous diagnoses, when they were assigned, by whom, and any changes or revisions..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Summary Info Box */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 mb-2">📋 Billing Integration</h4>
        <p className="text-sm text-blue-800">
          When you sign this diagnosis note, the following will happen automatically:
        </p>
        <ul className="list-disc list-inside text-sm text-blue-800 mt-2 space-y-1">
          <li>Billable diagnoses ({diagnosisCodes.filter(d => d.billable).length} selected) will be added to the billing system</li>
          <li>Previous diagnoses will be marked as inactive</li>
          <li>This note becomes the source of truth for all clinical documentation</li>
          <li>Other notes will reference these diagnoses automatically</li>
        </ul>
      </div>
    </div>
  );
}

export default DiagnosisTemplate;
