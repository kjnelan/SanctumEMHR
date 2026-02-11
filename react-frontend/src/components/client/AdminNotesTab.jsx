import React, { useState } from 'react';
import NoteEditor from '../notes/NoteEditor';
import NoteViewer from '../notes/NoteViewer';
import { PrimaryButton } from '../PrimaryButton';

function AdminNotesTab({ data }) {
  const [editingDemo, setEditingDemo] = useState(false);
  const [editingFinancial, setEditingFinancial] = useState(false);
  const [demoData, setDemoData] = useState({});
  const [financialData, setFinancialData] = useState({});
  const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'view'
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  if (!data) {
    return (
      <div className="text-gray-700 text-center py-8">
        Loading admin notes...
      </div>
    );
  }

  const { client } = data;

  // Initialize edit data
  const handleEditDemo = () => {
    setDemoData({
      language: client.language || '',
      ethnicity: client.ethnicity || '',
      race: client.race || '',
      nationality: client.nationality || '',
      religion: client.religion || '',
      referral_source: client.referral_source || '',
      tribal_affiliations: client.tribal_affiliations || ''
    });
    setEditingDemo(true);
  };

  const handleEditFinancial = () => {
    setFinancialData({
      homeless_status: client.homeless_status || '',
      financial_review_date: client.financial_review_date || '',
      family_size: client.family_size || '',
      monthly_income: client.monthly_income || ''
    });
    setEditingFinancial(true);
  };

  const handleSaveDemo = async () => {
    // TODO: Implement save to backend
    console.log('Saving demographics:', demoData);
    alert('Demographics save not yet implemented - needs API endpoint');
    setEditingDemo(false);
  };

  const handleSaveFinancial = async () => {
    // TODO: Implement save to backend
    console.log('Saving financial data:', financialData);
    alert('Financial data save not yet implemented - needs API endpoint');
    setEditingFinancial(false);
  };

  const handleCancelDemo = () => {
    setEditingDemo(false);
    setDemoData({});
  };

  const handleCancelFinancial = () => {
    setEditingFinancial(false);
    setFinancialData({});
  };

  const handleCreateAdminNote = () => {
    setView('create');
  };

  const handleNoteSaved = () => {
    setView('list');
    setSelectedNoteId(null);
  };

  const handleClose = () => {
    setView('list');
    setSelectedNoteId(null);
  };

  // If creating/editing/viewing a note, show the note editor/viewer
  if (view === 'create') {
    return (
      <NoteEditor
        clientId={client.pid}
        noteType="admin"
        onSave={handleNoteSaved}
        onClose={handleClose}
      />
    );
  }

  if (view === 'edit') {
    return (
      <NoteEditor
        noteId={selectedNoteId}
        clientId={client.pid}
        noteType="admin"
        onSave={handleNoteSaved}
        onClose={handleClose}
      />
    );
  }

  if (view === 'view') {
    return (
      <NoteViewer
        noteId={selectedNoteId}
        onClose={handleClose}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Demographics & Statistics Section */}
        <div className="card-main">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Demographics & Statistics</h2>
            {!editingDemo && (
              <button
                onClick={handleEditDemo}
                className="px-4 py-2 text-sm font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
              >
                ✏️ Edit
              </button>
            )}
          </div>
          <div className="card-inner">
            <div className="grid grid-cols-2 gap-3">
              <div className="form-field">
                <div className="form-field-label">Language</div>
                {editingDemo ? (
                  <input
                    type="text"
                    value={demoData.language}
                    onChange={(e) => setDemoData({...demoData, language: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="form-field-value">{client.language || ''}</div>
                )}
              </div>
              <div className="form-field">
                <div className="form-field-label">Ethnicity</div>
                {editingDemo ? (
                  <input
                    type="text"
                    value={demoData.ethnicity}
                    onChange={(e) => setDemoData({...demoData, ethnicity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="form-field-value">{client.ethnicity || ''}</div>
                )}
              </div>
              <div className="form-field">
                <div className="form-field-label">Race</div>
                {editingDemo ? (
                  <input
                    type="text"
                    value={demoData.race}
                    onChange={(e) => setDemoData({...demoData, race: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="form-field-value">{client.race || ''}</div>
                )}
              </div>
              <div className="form-field">
                <div className="form-field-label">Nationality</div>
                {editingDemo ? (
                  <input
                    type="text"
                    value={demoData.nationality}
                    onChange={(e) => setDemoData({...demoData, nationality: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="form-field-value">{client.nationality || ''}</div>
                )}
              </div>
              <div className="form-field">
                <div className="form-field-label">Religion</div>
                {editingDemo ? (
                  <input
                    type="text"
                    value={demoData.religion}
                    onChange={(e) => setDemoData({...demoData, religion: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="form-field-value">{client.religion || ''}</div>
                )}
              </div>
              <div className="form-field">
                <div className="form-field-label">Referral Source</div>
                {editingDemo ? (
                  <input
                    type="text"
                    value={demoData.referral_source}
                    onChange={(e) => setDemoData({...demoData, referral_source: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="form-field-value">{client.referral_source || ''}</div>
                )}
              </div>
              <div className="col-span-2 form-field">
                <div className="form-field-label">Tribal Affiliations</div>
                {editingDemo ? (
                  <input
                    type="text"
                    value={demoData.tribal_affiliations}
                    onChange={(e) => setDemoData({...demoData, tribal_affiliations: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="form-field-value">{client.tribal_affiliations || ''}</div>
                )}
              </div>
            </div>
            {editingDemo && (
              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                <PrimaryButton onClick={handleSaveDemo}>
                  💾 Save Changes
                </PrimaryButton>
                <button
                  onClick={handleCancelDemo}
                  className="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Financial & Housing Status Section */}
        <div className="card-main">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Financial & Housing Status</h2>
            {!editingFinancial && (
              <button
                onClick={handleEditFinancial}
                className="px-4 py-2 text-sm font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
              >
                ✏️ Edit
              </button>
            )}
          </div>
          <div className="card-inner">
            <div className="grid grid-cols-2 gap-3">
              <div className="form-field">
                <div className="form-field-label">Homeless</div>
                {editingFinancial ? (
                  <select
                    value={financialData.homeless_status}
                    onChange={(e) => setFinancialData({...financialData, homeless_status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="At Risk">At Risk</option>
                  </select>
                ) : (
                  <div className="form-field-value">{client.homeless_status || ''}</div>
                )}
              </div>
              <div className="form-field">
                <div className="form-field-label">Financial Review</div>
                {editingFinancial ? (
                  <input
                    type="date"
                    value={financialData.financial_review_date}
                    onChange={(e) => setFinancialData({...financialData, financial_review_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="form-field-value">
                    {client.financial_review_date ? new Date(client.financial_review_date).toLocaleDateString() : ''}
                  </div>
                )}
              </div>
              <div className="form-field">
                <div className="form-field-label">Family Size</div>
                {editingFinancial ? (
                  <input
                    type="number"
                    value={financialData.family_size}
                    onChange={(e) => setFinancialData({...financialData, family_size: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="form-field-value">{client.family_size || ''}</div>
                )}
              </div>
              <div className="form-field">
                <div className="form-field-label">Monthly Income</div>
                {editingFinancial ? (
                  <input
                    type="number"
                    value={financialData.monthly_income}
                    onChange={(e) => setFinancialData({...financialData, monthly_income: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                ) : (
                  <div className="form-field-value">{client.monthly_income ? `$${client.monthly_income}` : ''}</div>
                )}
              </div>
            </div>
            {editingFinancial && (
              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                <PrimaryButton onClick={handleSaveFinancial}>
                  💾 Save Changes
                </PrimaryButton>
                <button
                  onClick={handleCancelFinancial}
                  className="px-4 py-2 bg-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Administrative Notes */}
      <div className="space-y-6">
        <div className="card-main">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Administrative Notes</h2>
            <PrimaryButton onClick={handleCreateAdminNote}>
              + New Admin Note
            </PrimaryButton>
          </div>
          <div className="text-gray-600 text-sm">
            Create administrative notes for this client's record
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminNotesTab;
