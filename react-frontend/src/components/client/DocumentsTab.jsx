import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

function DocumentsTab({ data }) {
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    category_id: ''
  });

  const clientId = data?.patient?.pid;

  useEffect(() => {
    if (clientId) {
      fetchDocuments();
      fetchAllCategories();
    }
  }, [clientId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/custom/api/client_documents.php?id=${clientId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const result = await response.json();
      setDocuments(result.documents || []);
      setCategories(result.categories || []);

      // Auto-expand categories that have documents
      const expanded = {};
      result.categories?.forEach(cat => {
        expanded[cat.id] = true;
      });
      setExpandedCategories(expanded);

    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCategories = async () => {
    try {
      const response = await fetch('/custom/api/client_documents.php?action=categories', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const result = await response.json();
      setAllCategories(result.categories || []);

    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Auto-populate name with filename if not set
      if (!uploadForm.name) {
        setUploadForm(prev => ({ ...prev, name: file.name }));
      }
    }
  };

  const handleUploadFormChange = (field, value) => {
    setUploadForm(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenUploadModal = () => {
    setShowUploadModal(true);
    setUploadError(null);
    setSelectedFile(null);
    setUploadForm({ name: '', category_id: '' });
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setUploadError(null);
    setSelectedFile(null);
    setUploadForm({ name: '', category_id: '' });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('patient_id', clientId);
      formData.append('name', uploadForm.name || selectedFile.name);
      if (uploadForm.category_id) {
        formData.append('category_id', uploadForm.category_id);
      }

      const response = await fetch('/custom/api/client_documents.php', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload document');
      }

      // Success - refresh documents and close modal
      await fetchDocuments();
      handleCloseUploadModal();

    } catch (err) {
      console.error('Error uploading document:', err);
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (mimetype) => {
    if (!mimetype) return '📄';
    if (mimetype.includes('pdf')) return '📕';
    if (mimetype.includes('image')) return '🖼️';
    if (mimetype.includes('word') || mimetype.includes('document')) return '📘';
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📊';
    return '📄';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getFileName = (doc) => {
    // Prefer the 'name' field from database
    if (doc.name) return doc.name;

    // Fall back to extracting from URL
    if (!doc.url) return 'Untitled Document';

    // Remove file:// prefix if present
    const cleanPath = doc.url.replace(/^file:\/\//, '');
    // Extract just the filename from the path
    const parts = cleanPath.split('/');
    return parts[parts.length - 1] || 'Untitled Document';
  };

  const handleViewDocument = (doc) => {
    // Direct file path - documents are stored with their path in the database
    if (doc.file_path) {
      window.open(doc.file_path, '_blank');
    } else {
      console.error('Document file path not available');
    }
  };

  const handleDownloadDocument = (doc) => {
    // Use custom API endpoint for document download
    const downloadUrl = `/custom/api/client_documents.php?action=download&document_id=${doc.id}`;
    window.open(downloadUrl, '_blank');
  };

  // Group documents by category
  const documentsByCategory = {};
  documents.forEach(doc => {
    const catId = doc.category_id || 'uncategorized';
    if (!documentsByCategory[catId]) {
      documentsByCategory[catId] = [];
    }
    documentsByCategory[catId].push(doc);
  });

  if (loading) {
    return (
      <div className="card-main">
        <div className="card-inner text-center py-8">
          <div className="text-gray-700">Loading documents...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-main">
        <div className="card-inner text-center py-8">
          <div className="text-red-600">Error loading documents: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Button */}
      <div className="flex justify-end">
        <button
          onClick={handleOpenUploadModal}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          📤 Upload Document
        </button>
      </div>

      {/* Empty state */}
      {documents.length === 0 && (
        <div className="card-main">
          <div className="card-inner text-center py-8">
            <div className="text-gray-500">No documents on file</div>
          </div>
        </div>
      )}
      {categories.map(category => {
        const categoryDocs = documentsByCategory[category.id] || [];
        const isExpanded = expandedCategories[category.id];

        if (categoryDocs.length === 0) return null;

        return (
          <div key={category.id} className="card-main">
            <div
              className="flex items-center justify-between mb-4 cursor-pointer"
              onClick={() => toggleCategory(category.id)}
            >
              <h2 className="text-xl font-semibold text-gray-800">
                {category.name} ({categoryDocs.length})
              </h2>
              <button className="text-gray-600 hover:text-gray-800 transition-colors">
                {isExpanded ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>

            {isExpanded && (
              <div className="card-inner">
                <div className="space-y-3">
                  {categoryDocs.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{getFileIcon(doc.mimetype)}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{getFileName(doc)}</div>
                          <div className="text-sm text-gray-500">
                            {doc.date && new Date(doc.date).toLocaleDateString()} • {formatFileSize(doc.size)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDocument(doc)}
                          className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Uncategorized documents */}
      {documentsByCategory['uncategorized'] && documentsByCategory['uncategorized'].length > 0 && (
        <div className="card-main">
          <div
            className="flex items-center justify-between mb-4 cursor-pointer"
            onClick={() => toggleCategory('uncategorized')}
          >
            <h2 className="text-xl font-semibold text-gray-800">
              Uncategorized ({documentsByCategory['uncategorized'].length})
            </h2>
            <button className="text-gray-600 hover:text-gray-800 transition-colors">
              {expandedCategories['uncategorized'] ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>

          {expandedCategories['uncategorized'] && (
            <div className="card-inner">
              <div className="space-y-3">
                {documentsByCategory['uncategorized'].map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{getFileIcon(doc.mimetype)}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{getFileName(doc)}</div>
                        <div className="text-sm text-gray-500">
                          {doc.date && new Date(doc.date).toLocaleDateString()} • {formatFileSize(doc.size)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDocument(doc)}
                        className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDownloadDocument(doc)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && createPortal(
        <div className="modal-backdrop">
          <div className="modal-container max-w-lg">
            {/* Modal Header */}
            <div className="modal-header">
              <h3 className="text-xl font-bold text-gray-800">Upload Document</h3>
              <button
                onClick={handleCloseUploadModal}
                disabled={uploading}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {uploadError && (
                <div className="error-message mb-4">
                  {uploadError}
                </div>
              )}

              <div className="space-y-4">
                {/* File Selector */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Select File <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="input-field"
                  />
                  {selectedFile && (
                    <div className="mt-2 text-sm text-gray-600">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>

                {/* Document Name */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Document Name
                  </label>
                  <input
                    type="text"
                    value={uploadForm.name}
                    onChange={(e) => handleUploadFormChange('name', e.target.value)}
                    placeholder="Enter document name"
                    className="input-field"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    Leave blank to use filename
                  </div>
                </div>

                {/* Category Selector */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Category (Optional)
                  </label>
                  <select
                    value={uploadForm.category_id}
                    onChange={(e) => handleUploadFormChange('category_id', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select a category...</option>
                    {allCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-sm text-gray-600 mt-4">
                <span className="text-red-600">*</span> Required
              </p>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                onClick={handleCloseUploadModal}
                disabled={uploading}
                className="btn-action btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className="btn-action btn-primary"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default DocumentsTab;
