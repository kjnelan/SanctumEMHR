/**
 * SanctumEMHR EMHR
 * InterventionPicker - Multi-select intervention picker with 4-tier system
 * Tier 1: Core (always visible)
 * Tier 2: Modality-specific (collapsible)
 * Tier 3: Crisis/Risk (only when flagged)
 * Tier 4: Administrative
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React, { useState, useEffect } from 'react';
import { getInterventions } from '../../utils/api';
import { ErrorInline } from '../ErrorInline';

/**
 * Props:
 * - selectedInterventions: array - Currently selected intervention names
 * - onChange: function(interventions) - Callback when selection changes
 * - riskPresent: boolean - Whether to show Tier 3 crisis interventions
 * - showFavorites: boolean - Whether to show favorites section (default: true)
 */
function InterventionPicker({ selectedInterventions = [], onChange, riskPresent = false, showFavorites = true }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [interventions, setInterventions] = useState(null);
  const [expandedModalities, setExpandedModalities] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadInterventions();
  }, []);

  const loadInterventions = async () => {
    try {
      setLoading(true);
      const data = await getInterventions();
      setInterventions(data);
      setError(null);
    } catch (err) {
      console.error('Error loading interventions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (interventionName) => {
    const isSelected = selectedInterventions.includes(interventionName);

    if (isSelected) {
      // Remove
      onChange(selectedInterventions.filter(i => i !== interventionName));
    } else {
      // Add
      onChange([...selectedInterventions, interventionName]);
    }
  };

  const toggleModality = (modality) => {
    setExpandedModalities(prev => ({
      ...prev,
      [modality]: !prev[modality]
    }));
  };

  if (loading) {
    return <div className="text-gray-600">Loading interventions...</div>;
  }

  if (error) {
    return <ErrorInline>Error loading interventions: {error}</ErrorInline>;
  }

  if (!interventions) {
    return <div className="text-gray-600">No interventions available</div>;
  }

  const { grouped, favorites } = interventions;

  // Filter all interventions by search term
  const allInterventions = [
    ...(grouped.tier1 || []),
    ...(grouped.tier3 || []),
    ...(grouped.tier4 || []),
    ...Object.values(grouped.tier2 || {}).flat(),
  ];

  const filteredInterventions = searchTerm
    ? allInterventions.filter(i =>
        i.intervention_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search interventions..."
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
        />
      </div>

      {/* Search Results */}
      {searchTerm && filteredInterventions && (
        <div>
          <h4 className="text-label mb-3">
            Search Results ({filteredInterventions.length})
          </h4>
          {filteredInterventions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredInterventions.map((intervention) => (
                <label
                  key={intervention.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedInterventions.includes(intervention.intervention_name)}
                    onChange={() => handleToggle(intervention.intervention_name)}
                    className="checkbox"
                  />
                  <span className="text-sm text-gray-800">{intervention.intervention_name}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">No interventions found matching "{searchTerm}"</div>
          )}
        </div>
      )}

      {/* Show tiered view only when not searching */}
      {!searchTerm && (
        <>
          {/* Favorites Section */}
          {showFavorites && favorites && favorites.length > 0 && (
        <div>
          <h4 className="text-label mb-3 flex items-center gap-2">
            <span>⭐</span>
            <span>Your Favorites</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {favorites.map((intervention) => (
              <label
                key={intervention.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedInterventions.includes(intervention.intervention_name)}
                  onChange={() => handleToggle(intervention.intervention_name)}
                  className="checkbox"
                />
                <span className="text-sm text-gray-800">{intervention.intervention_name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Tier 1: Core Interventions (Always Visible) */}
      <div>
        <h4 className="text-label mb-3">Core Interventions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {grouped.tier1.map((intervention) => (
            <label
              key={intervention.id}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedInterventions.includes(intervention.intervention_name)}
                onChange={() => handleToggle(intervention.intervention_name)}
                className="checkbox"
              />
              <span className="text-sm text-gray-800">{intervention.intervention_name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tier 2: Modality-Specific (Collapsible) */}
      {Object.keys(grouped.tier2).length > 0 && (
        <div>
          <h4 className="text-label mb-3">Modality-Specific Interventions</h4>
          <div className="space-y-2">
            {Object.entries(grouped.tier2).map(([modality, modalityInterventions]) => (
              <div key={modality} className="card-inner">
                {/* Modality Header (Collapsible) */}
                <button
                  onClick={() => toggleModality(modality)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="font-semibold text-gray-800">{modality}</span>
                  <svg
                    className={`w-5 h-5 text-gray-600 transition-transform ${
                      expandedModalities[modality] ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Modality Interventions (Collapsible Content) */}
                {expandedModalities[modality] && (
                  <div className="px-3 pb-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {modalityInterventions.map((intervention) => (
                      <label
                        key={intervention.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedInterventions.includes(intervention.intervention_name)}
                          onChange={() => handleToggle(intervention.intervention_name)}
                          className="checkbox"
                        />
                        <span className="text-sm text-gray-800">{intervention.intervention_name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tier 3: Crisis/Risk (Only When Risk Present) */}
      {riskPresent && grouped.tier3.length > 0 && (
        <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
          <h4 className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
            <span>⚠️</span>
            <span>Crisis/Risk Interventions</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {grouped.tier3.map((intervention) => (
              <label
                key={intervention.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-orange-100 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedInterventions.includes(intervention.intervention_name)}
                  onChange={() => handleToggle(intervention.intervention_name)}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-800">{intervention.intervention_name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Tier 4: Administrative */}
      {grouped.tier4.length > 0 && (
        <div>
          <h4 className="text-label mb-3">Administrative/Clinical Process</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {grouped.tier4.map((intervention) => (
              <label
                key={intervention.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedInterventions.includes(intervention.intervention_name)}
                  onChange={() => handleToggle(intervention.intervention_name)}
                  className="checkbox"
                />
                <span className="text-sm text-gray-800">{intervention.intervention_name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
        </>
      )}

      {/* Selection Summary */}
      {selectedInterventions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm font-semibold text-blue-800 mb-2">
            Selected ({selectedInterventions.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedInterventions.map((intervention) => (
              <span
                key={intervention}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
              >
                {intervention}
                <button
                  onClick={() => handleToggle(intervention)}
                  className="hover:text-blue-600 focus:outline-none"
                  title="Remove"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default InterventionPicker;
