/**
 * Mindline EMHR
 * ICD-10 Code Import Page
 *
 * Admin interface for importing ICD-10-CM codes from CMS files
 * Supports tab-delimited text files from cms.gov
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA - Phase 4B
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React, { useState } from 'react';

function ICD10Import() {
  const [file, setFile] = useState(null);
  const [action, setAction] = useState('replace_all');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress('Uploading file...');

    try {
      const formData = new FormData();
      formData.append('icd10_file', file);
      formData.append('action', action);

      const response = await fetch('/custom/api/import_icd10_codes.php', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Import failed');
      }

      setProgress(null);
      setResult(data);
      setFile(null);

      // Clear file input
      document.getElementById('file-input').value = '';

    } catch (err) {
      console.error('Import error:', err);
      setError(err.message || 'Import failed. Please try again.');
      setProgress(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🏥 ICD-10 Code Import
        </h1>
        <p className="text-gray-600">
          Import ICD-10-CM diagnosis codes from CMS (Centers for Medicare & Medicaid Services)
        </p>
      </div>

      {/* Instructions */}
      <div className="card-main mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          📋 Instructions
        </h2>
        <div className="card-inner space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">1. Download ICD-10-CM File</h3>
            <p className="text-gray-600 mb-2">
              Visit: <a href="https://www.cms.gov/medicare/coding-billing/icd-10-codes" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                https://www.cms.gov/medicare/coding-billing/icd-10-codes
              </a>
            </p>
            <p className="text-gray-600">
              Download the current year's ICD-10-CM Code Descriptions (tab-delimited text file)
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-2">2. Select Import Action</h3>
            <p className="text-gray-600">
              <strong>Replace All:</strong> Deletes existing codes and imports fresh (recommended for annual updates)
              <br />
              <strong>Update Only:</strong> Updates existing codes and adds new ones (preserves custom codes)
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-2">3. Upload File</h3>
            <p className="text-gray-600">
              Select the downloaded file and click "Import Codes". This may take 1-2 minutes to process ~72,000 codes.
            </p>
          </div>
        </div>
      </div>

      {/* Import Form */}
      <div className="card-main mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Import Settings
        </h2>
        <div className="card-inner space-y-6">
          {/* Action Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Import Action
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors">
                <input
                  type="radio"
                  name="action"
                  value="replace_all"
                  checked={action === 'replace_all'}
                  onChange={(e) => setAction(e.target.value)}
                  disabled={uploading}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-semibold text-gray-900">Replace All Codes</div>
                  <div className="text-sm text-gray-600">Deletes all existing ICD-10 codes and imports fresh (recommended)</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors">
                <input
                  type="radio"
                  name="action"
                  value="update_only"
                  checked={action === 'update_only'}
                  onChange={(e) => setAction(e.target.value)}
                  disabled={uploading}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-semibold text-gray-900">Update Only</div>
                  <div className="text-sm text-gray-600">Updates existing codes and adds new ones (preserves custom codes)</div>
                </div>
              </label>
            </div>
          </div>

          {/* File Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select ICD-10-CM File
            </label>
            <input
              id="file-input"
              type="file"
              accept=".txt,.csv,.tsv"
              onChange={handleFileChange}
              disabled={uploading}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {file && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: <span className="font-semibold">{file.name}</span> ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg text-lg"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                Importing Codes...
              </span>
            ) : (
              '⬆️ Import ICD-10 Codes'
            )}
          </button>
        </div>
      </div>

      {/* Progress */}
      {progress && (
        <div className="card-main mb-6 bg-blue-50 border-blue-300">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-blue-900 font-semibold">{progress}</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card-main mb-6 bg-red-50 border-red-300">
          <div className="flex items-start gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Import Failed</h3>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Result */}
      {result && (
        <div className="card-main bg-green-50 border-green-300">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-3xl">✅</span>
            <div>
              <h3 className="text-xl font-semibold text-green-900 mb-1">
                Import Successful!
              </h3>
              <p className="text-green-800">{result.message}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-green-700">{result.imported.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Imported</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-blue-700">{result.total_active.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Active</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-yellow-700">{result.skipped.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Skipped</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="text-2xl font-bold text-red-700">{result.errors.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white rounded-lg border border-green-200">
            <h4 className="font-semibold text-gray-800 mb-2">✅ Next Steps:</h4>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>ICD-10 codes are now available for diagnosis notes</li>
              <li>Test by creating a diagnosis note and searching for codes</li>
              <li>Codes update annually on October 1st - re-import then</li>
            </ul>
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="card-main bg-yellow-50 border-yellow-300 mt-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-yellow-900 mb-2">Important Notes</h3>
            <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
              <li><strong>File Size:</strong> ICD-10 files are typically 10-15 MB with ~72,000 codes</li>
              <li><strong>Import Time:</strong> Expect 1-2 minutes to process all codes</li>
              <li><strong>Backup:</strong> If using "Replace All", existing custom codes will be deleted</li>
              <li><strong>Annual Updates:</strong> ICD-10 codes are updated every October 1st</li>
              <li><strong>Admin Only:</strong> This function requires admin privileges</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ICD10Import;
