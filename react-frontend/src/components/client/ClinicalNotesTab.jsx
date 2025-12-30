import React, { useState, useEffect, useMemo } from 'react';
import { getClinicalNotes } from '../../utils/api';
import EncounterDetailModal from './EncounterDetailModal';

function ClinicalNotesTab({ data }) {
  const [notesData, setNotesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [selectedEncounter, setSelectedEncounter] = useState(null);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!data?.patient?.pid) return;

      try {
        setLoading(true);
        setError(null);
        const result = await getClinicalNotes(data.patient.pid);
        setNotesData(result);
      } catch (err) {
        console.error('Error fetching clinical notes:', err);
        setError(err.message || 'Failed to load clinical notes');
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [data]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const filteredNotes = useMemo(() => {
    if (!notesData?.notes) return [];

    let filtered = [...notesData.notes];
    const now = new Date();

    if (filterType === 'recent') {
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(note => new Date(note.date) >= thirtyDaysAgo);
    } else if (filterType === 'past-year') {
      const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(note => new Date(note.date) >= oneYearAgo);
    }

    return filtered;
  }, [notesData, filterType]);

  if (loading) {
    return (
      <div className="empty-state">
        Loading clinical notes...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message text-center py-8">
        Error: {error}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Filters */}
        <div className="lg:col-span-1 space-y-6">
          {/* Statistics Card */}
          <div className="card-main">
            <h2 className="card-header">Notes Statistics</h2>
            <div className="space-y-4">
              <div className="stat-box">
                <div className="text-caption text-gray-600 font-semibold mb-1">Total Notes</div>
                <div className="text-3xl font-bold text-blue-600">{notesData?.total_count || 0}</div>
              </div>
            </div>
          </div>

          {/* Filters Card */}
          <div className="card-main">
            <h3 className="section-header">Filter By</h3>
            <div className="space-y-2">
              <button
                onClick={() => setFilterType('all')}
                className={`w-full text-left filter-btn-enhanced ${
                  filterType === 'all'
                    ? 'filter-btn-active-base bg-blue-500'
                    : 'filter-btn-inactive'
                }`}
              >
                All Notes
              </button>
              <button
                onClick={() => setFilterType('recent')}
                className={`w-full text-left filter-btn-enhanced ${
                  filterType === 'recent'
                    ? 'filter-btn-active-base bg-blue-500'
                    : 'filter-btn-inactive'
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setFilterType('past-year')}
                className={`w-full text-left filter-btn-enhanced ${
                  filterType === 'past-year'
                    ? 'filter-btn-active-base bg-blue-500'
                    : 'filter-btn-inactive'
                }`}
              >
                Past Year
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Notes List */}
        <div className="lg:col-span-3">
          <div className="card-main">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-header">
                Clinical Notes
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'})
                </span>
              </h2>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-muted text-lg text-gray-600">No clinical notes found</p>
                <p className="text-caption text-gray-500">
                  {filterType !== 'all' ? 'Try adjusting your filters' : 'No notes recorded'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="card-inner hover:bg-white/90 transition-colors cursor-pointer"
                    onClick={() => setSelectedEncounter(note.encounter)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="item-title">
                            {note.form_name || note.formdir}
                          </div>
                          {note.authorized === '1' && (
                            <span className="badge-sm badge-light-success">
                              Authorized
                            </span>
                          )}
                        </div>

                        <div className="item-secondary mb-2">
                          {formatDate(note.date)} • {note.user_name || 'Unknown user'}
                        </div>

                        {note.encounter_reason && (
                          <div className="item-secondary mb-2 text-gray-700">
                            <span className="font-semibold">Encounter:</span> {note.encounter_reason}
                          </div>
                        )}

                        <div className="flex gap-6 item-tertiary text-gray-500">
                          {note.encounter_provider && (
                            <div>
                              <span className="font-semibold">Provider:</span> {note.encounter_provider}
                            </div>
                          )}
                          {note.facility_name && (
                            <div>
                              <span className="font-semibold">Facility:</span> {note.facility_name}
                            </div>
                          )}
                        </div>
                      </div>

                      <button className="ml-4 btn-mini">
                        View Encounter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Encounter Detail Modal */}
      {selectedEncounter && (
        <EncounterDetailModal
          encounterId={selectedEncounter}
          onClose={() => setSelectedEncounter(null)}
        />
      )}
    </>
  );
}

export default ClinicalNotesTab;
