/**
 * SanctumEMHR EMHR
 * MedicationList - Manage current medications list in Intake
 * Simple add/remove/edit interface for documenting client's current medications
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4B
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React, { useState } from 'react';
import { RequiredAsterisk } from '../RequiredAsterisk';

/**
 * Props:
 * - medications: array - Current medications list
 * - onChange: function(medications) - Callback when list changes
 */
function MedicationList({ medications = [], onChange }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: '',
    prescriber: '',
    purpose: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      dosage: '',
      frequency: '',
      prescriber: '',
      purpose: ''
    });
    setIsAdding(false);
    setEditingIndex(null);
  };

  const handleAdd = () => {
    if (!formData.name.trim()) return;

    const newMedication = { ...formData };
    const updated = [...medications, newMedication];
    onChange(updated);
    resetForm();
  };

  const handleEdit = (index) => {
    setFormData(medications[index]);
    setEditingIndex(index);
    setIsAdding(true);
  };

  const handleUpdate = () => {
    if (!formData.name.trim()) return;

    const updated = [...medications];
    updated[editingIndex] = { ...formData };
    onChange(updated);
    resetForm();
  };

  const handleRemove = (index) => {
    const updated = medications.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Existing Medications */}
      {medications.length > 0 && (
        <div className="space-y-2">
          {medications.map((med, index) => (
            <div
              key={index}
              className="p-3 bg-white border-2 border-gray-300 rounded-lg hover:border-indigo-400 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {med.name}
                    {med.dosage && <span className="ml-2 text-indigo-600">{med.dosage}</span>}
                  </div>
                  {med.frequency && (
                    <div className="text-sm text-gray-600 mt-1">
                      Frequency: {med.frequency}
                    </div>
                  )}
                  {med.prescriber && (
                    <div className="text-sm text-gray-600">
                      Prescribed by: {med.prescriber}
                    </div>
                  )}
                  {med.purpose && (
                    <div className="text-sm text-gray-600">
                      For: {med.purpose}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(index)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRemove(index)}
                    className="text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      {isAdding ? (
        <div className="p-4 bg-indigo-50 border-2 border-indigo-300 rounded-lg space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700 mb-1 block">
                  Medication Name <RequiredAsterisk />
                </span>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Sertraline, Adderall XR"
                  autoFocus
                />
              </label>
            </div>
            <div>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700 mb-1 block">Dosage</span>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 50mg, 20mg XR"
                />
              </label>
            </div>
            <div>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700 mb-1 block">Frequency</span>
                <input
                  type="text"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Once daily, Twice daily"
                />
              </label>
            </div>
            <div>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700 mb-1 block">Prescriber</span>
                <input
                  type="text"
                  value={formData.prescriber}
                  onChange={(e) => setFormData({ ...formData, prescriber: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Dr. Smith, Psychiatrist"
                />
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700 mb-1 block">What it's for</span>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Depression, ADHD, Anxiety"
                />
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={editingIndex !== null ? handleUpdate : handleAdd}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
            >
              {editingIndex !== null ? 'Update Medication' : 'Add Medication'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full px-4 py-3 border-2 border-dashed border-indigo-400 rounded-lg text-indigo-700 font-medium hover:bg-indigo-50 transition-colors"
        >
          + Add Medication
        </button>
      )}

      {medications.length === 0 && !isAdding && (
        <div className="text-sm text-gray-500 italic text-center py-2">
          No medications documented yet
        </div>
      )}
    </div>
  );
}

export default MedicationList;
