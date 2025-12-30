import React, { useState, useEffect } from 'react';

function DocumentsTab({ data }) {
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const clientId = data?.patient?.pid;

  useEffect(() => {
    if (clientId) {
      fetchDocuments();
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

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
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
    // Link to OpenEMR's document viewer
    const viewerUrl = `/interface/patient_file/encounter/view_form.php?formname=../../Documents/${doc.id}`;
    window.open(viewerUrl, '_blank');
  };

  const handleDownloadDocument = (doc) => {
    // Link to OpenEMR's document download
    const downloadUrl = `/controller.php?document&retrieve&patient_id=${clientId}&document_id=${doc.id}`;
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

  if (documents.length === 0) {
    return (
      <div className="card-main">
        <div className="card-inner text-center py-8">
          <div className="text-gray-500">No documents on file</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
    </div>
  );
}

export default DocumentsTab;
