/**
 * SanctumEMHR EMHR
 * ICD-10 Code Picker Component
 *
 * Multi-select diagnosis code picker with:
 * - Search from codes table (ICD-10)
 * - Billable flag toggle
 * - Primary diagnosis selector
 * - Severity specifiers
 * - Max 4 billable codes (CMS requirement)
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4B
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { searchCodes } from '../../utils/api';
import { FormLabel } from '../FormLabel';
import { ErrorMessage } from '../ErrorMessage';

const SEVERITY_OPTIONS = [
  'Mild',
  'Moderate',
  'Severe',
  'In partial remission',
  'In full remission',
  'With psychotic features',
  'Unspecified'
];

/**
 * Format ICD-10 code with period for display
 * F411 → F41.1
 * F4110 → F41.10
 * Z91411 → Z91.411
 */
const formatCode = (code) => {
  if (!code || code.length < 4) return code;

  // ICD-10 format: Insert period after 3rd character
  // Examples: F41.1, F33.1, Z63.0, F41.10
  return code.slice(0, 3) + '.' + code.slice(3);
};

function ICD10Picker({
  selectedCodes = [],
  onChange,
  maxBillable = 4,
  showBillableToggle = true,
  showPrimarySelector = true,
  showSeveritySelector = true,
  disabled = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      setError(null);

      try {
        const response = await searchCodes(searchTerm, 'ICD10', 50);
        setSearchResults(response.codes || []);
        setShowDropdown(true);
      } catch (err) {
        console.error('Error searching codes:', err);
        setError('Failed to search codes. Please try again.');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Update dropdown position when it opens
  useEffect(() => {
    if (showDropdown && searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [showDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addCode = (code) => {
    // Check if already selected
    if (selectedCodes.some(c => c.code === code.code)) {
      setError(`${code.code} is already selected`);
      return;
    }

    // Check billable limit
    const billableCount = selectedCodes.filter(c => c.billable).length;
    const newCode = {
      code: code.code,
      description: code.description,
      billable: billableCount < maxBillable,
      primary: selectedCodes.length === 0, // First code is primary by default
      severity: null
    };

    onChange([...selectedCodes, newCode]);
    setSearchTerm('');
    setShowDropdown(false);
    setError(null);
  };

  const removeCode = (codeToRemove) => {
    const updated = selectedCodes.filter(c => c.code !== codeToRemove);

    // If removing primary, make first remaining code primary
    if (selectedCodes.find(c => c.code === codeToRemove)?.primary && updated.length > 0) {
      updated[0].primary = true;
    }

    onChange(updated);
  };

  const updateCode = (codeValue, field, value) => {
    const updated = selectedCodes.map(c => {
      if (c.code === codeValue) {
        const updatedCode = { ...c, [field]: value };

        // If setting as primary, unset others
        if (field === 'primary' && value === true) {
          return updatedCode;
        }
        return updatedCode;
      }
      // If another code is being set as primary, unset this one
      if (field === 'primary' && value === true) {
        return { ...c, primary: false };
      }
      return c;
    });

    // Enforce billable limit
    if (field === 'billable' && value === true) {
      const billableCount = updated.filter(c => c.billable).length;
      if (billableCount > maxBillable) {
        setError(`Maximum ${maxBillable} billable diagnoses allowed`);
        return;
      }
    }

    onChange(updated);
    setError(null);
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const updated = [...selectedCodes];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
  };

  const moveDown = (index) => {
    if (index === selectedCodes.length - 1) return;
    const updated = [...selectedCodes];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);
  };

  const billableCount = selectedCodes.filter(c => c.billable).length;

  // Render dropdown using portal
  const renderDropdown = () => {
    if (!showDropdown) return null;

    const dropdownContent = (
      <div
        ref={dropdownRef}
        style={{
          position: 'absolute',
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          zIndex: 9999
        }}
        className="mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto"
      >
        {searchResults.length > 0 ? (
          searchResults.map((result, index) => (
            <button
              key={index}
              onClick={() => addCode(result)}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="font-semibold text-gray-900">{formatCode(result.code)}</div>
              <div className="text-sm text-gray-600 mt-1">{result.description}</div>
            </button>
          ))
        ) : (
          !isSearching && searchTerm.length >= 2 && (
            <div className="p-4 text-center text-gray-500">
              No codes found matching "{searchTerm}"
            </div>
          )
        )}
      </div>
    );

    return ReactDOM.createPortal(dropdownContent, document.body);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <FormLabel>
          Search ICD-10 Codes
          <span className="ml-2 text-xs text-gray-500">
            ({billableCount}/{maxBillable} billable selected)
          </span>
        </FormLabel>

        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by code or description (e.g., F41.1 or anxiety)..."
            disabled={disabled}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />

          {isSearching && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      </div>

      {/* Render dropdown via portal (appears on top of everything) */}
      {renderDropdown()}

      {/* Error Message */}
      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}

      {/* Selected Codes */}
      {selectedCodes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Selected Diagnoses ({selectedCodes.length})
          </h3>

          {selectedCodes.map((dx, index) => (
            <div
              key={dx.code}
              className={`bg-white border-2 rounded-lg p-4 ${
                dx.primary ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Code and Description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-gray-900">{formatCode(dx.code)}</span>
                    {dx.primary && (
                      <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded">
                        PRIMARY
                      </span>
                    )}
                    {dx.billable && (
                      <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded">
                        BILLABLE
                      </span>
                    )}
                  </div>
                  <p className="checkbox-label">{dx.description}</p>

                  {/* Controls */}
                  <div className="mt-3 flex flex-wrap gap-3">
                    {showBillableToggle && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dx.billable}
                          onChange={(e) => updateCode(dx.code, 'billable', e.target.checked)}
                          disabled={disabled || (!dx.billable && billableCount >= maxBillable)}
                          className="checkbox"
                        />
                        <span className="checkbox-label">Billable</span>
                      </label>
                    )}

                    {showPrimarySelector && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="primary-diagnosis"
                          checked={dx.primary}
                          onChange={() => updateCode(dx.code, 'primary', true)}
                          disabled={disabled}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="checkbox-label">Primary</span>
                      </label>
                    )}

                    {showSeveritySelector && (
                      <select
                        value={dx.severity || ''}
                        onChange={(e) => updateCode(dx.code, 'severity', e.target.value || null)}
                        disabled={disabled}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Severity --</option>
                        {SEVERITY_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={disabled || index === 0}
                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={disabled || index === selectedCodes.length - 1}
                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => removeCode(dx.code)}
                    disabled={disabled}
                    className="p-1 text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCodes.length === 0 && (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          No diagnoses selected. Search and select ICD-10 codes above.
        </div>
      )}
    </div>
  );
}

export default ICD10Picker;
