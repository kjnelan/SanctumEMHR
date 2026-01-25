/**
 * SanctumEMHR EMHR
 * DiagnosisSelector - Select diagnoses for progress notes
 * Fetches active diagnoses and allows selection for billing/clinical purposes
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4B
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React, { useState, useEffect } from 'react';
import { getPatientDiagnoses } from '../../utils/api';
import { ErrorInline } from '../ErrorInline';

/**
 * Props:
 * - patientId: number - Patient ID
 * - serviceDate: string - Date of service (YYYY-MM-DD)
 * - selectedDiagnoses: array - Currently selected diagnosis codes
 * - onChange: function(diagnoses) - Callback when selection changes
 */
function DiagnosisSelector({ patientId, serviceDate, selectedDiagnoses = [], onChange }) {
  const [availableDiagnoses, setAvailableDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patientId) {
      loadDiagnoses();
    }
  }, [patientId, serviceDate]);

  const loadDiagnoses = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active diagnoses as of the service date
      const data = await getPatientDiagnoses(patientId, {
        activeAsOf: serviceDate,
        includeRetired: false
      });

      setAvailableDiagnoses(data.diagnoses || []);
    } catch (err) {
      console.error('Error loading diagnoses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format code with period (F411 → F41.1)
  const formatCode = (code) => {
    if (!code) return '';
    return code.length >= 4 ? code.slice(0, 3) + '.' + code.slice(3) : code;
  };

  // Clean up diagnosis description - remove duplicates
  const cleanDescription = (title) => {
    if (!title) return '';
    const parts = title.split(/\s{3,}/);
    if (parts.length > 1) {
      return parts[1].trim();
    }
    return title.trim();
  };

  // Check if a diagnosis is selected
  const isSelected = (diagnosisCode) => {
    return selectedDiagnoses.some(d => d.code === diagnosisCode || d === diagnosisCode);
  };

  // Get primary diagnosis code (first one selected, or null)
  const getPrimaryCode = () => {
    if (!selectedDiagnoses || selectedDiagnoses.length === 0) return null;
    const firstDx = selectedDiagnoses[0];
    return typeof firstDx === 'string' ? firstDx : firstDx.code;
  };

  // Handle diagnosis selection toggle
  const handleToggle = (diagnosis) => {
    const code = diagnosis.diagnosis; // This is the ICD-10 code without period
    const currentlySelected = isSelected(code);

    if (currentlySelected) {
      // Remove this diagnosis
      const updated = selectedDiagnoses.filter(d => {
        const dCode = typeof d === 'string' ? d : d.code;
        return dCode !== code;
      });
      onChange(updated);
    } else {
      // Add this diagnosis
      const newDiagnosis = {
        code: code,
        description: diagnosis.title,
        isPrimary: selectedDiagnoses.length === 0, // First one is primary
        billable: true
      };
      onChange([...selectedDiagnoses, newDiagnosis]);
    }
  };

  // Set a diagnosis as primary
  const setPrimary = (code) => {
    const updated = selectedDiagnoses.map(d => ({
      ...(typeof d === 'string' ? { code: d } : d),
      isPrimary: (typeof d === 'string' ? d : d.code) === code
    }));
    onChange(updated);
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-600 italic">
        Loading active diagnoses...
      </div>
    );
  }

  if (error) {
    return (
      <ErrorInline>
        Error loading diagnoses: {error}
      </ErrorInline>
    );
  }

  if (!availableDiagnoses || availableDiagnoses.length === 0) {
    return (
      <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        ⚠️ No active diagnoses found for this patient. Please create a Diagnosis Note first.
      </div>
    );
  }

  const primaryCode = getPrimaryCode();

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600 mb-2">
        Select all diagnoses addressed in this session. The first selected diagnosis will be marked as primary for billing purposes.
      </div>

      <div className="space-y-2">
        {availableDiagnoses.map((diagnosis) => {
          const code = diagnosis.diagnosis;
          const selected = isSelected(code);
          const isPrimary = code === primaryCode;

          return (
            <div
              key={diagnosis.id}
              className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                selected
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => handleToggle(diagnosis)}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => handleToggle(diagnosis)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      {formatCode(code)}
                    </span>
                    {selected && isPrimary && (
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                        PRIMARY
                      </span>
                    )}
                    {selected && !isPrimary && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrimary(code);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Set as primary
                      </button>
                    )}
                  </div>
                  <div className="text-sm text-gray-800">
                    {cleanDescription(diagnosis.title)}
                  </div>
                  {diagnosis.begdate && (
                    <div className="text-xs text-gray-500 mt-1">
                      Since: {new Date(diagnosis.begdate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedDiagnoses.length > 0 && (
        <div className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2">
          ℹ️ {selectedDiagnoses.length} diagnosis code{selectedDiagnoses.length !== 1 ? 's' : ''} selected for this session
        </div>
      )}
    </div>
  );
}

export default DiagnosisSelector;
