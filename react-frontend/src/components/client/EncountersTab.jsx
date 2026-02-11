import React, { useState, useMemo } from 'react';
import EncounterDetailModal from './EncounterDetailModal';

function EncountersTab({ data }) {
  const [filterType, setFilterType] = useState('all'); // all, recent, past-year
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, provider
  const [selectedEncounter, setSelectedEncounter] = useState(null);

  if (!data) {
    return (
      <div className="empty-state">
        Loading encounter history...
      </div>
    );
  }

  const { encounters, client } = data;

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    // Parse date parts manually to avoid timezone offset issues
    const [year, month, day] = dateStr.split(/[-T]/);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Filter and sort encounters
  const filteredEncounters = useMemo(() => {
    if (!encounters || encounters.length === 0) return [];

    let filtered = [...encounters];
    const now = new Date();

    // Apply filters
    if (filterType === 'recent') {
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(enc => new Date(enc.date) >= thirtyDaysAgo);
    } else if (filterType === 'past-year') {
      const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(enc => new Date(enc.date) >= oneYearAgo);
    }

    // Apply sorting
    if (sortBy === 'date-desc') {
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === 'date-asc') {
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === 'provider') {
      filtered.sort((a, b) => {
        const provA = a.provider_name || '';
        const provB = b.provider_name || '';
        return provA.localeCompare(provB);
      });
    }

    return filtered;
  }, [encounters, filterType, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!encounters || encounters.length === 0) {
      return {
        total: 0,
        lastVisit: null,
        avgPerMonth: 0,
        thisYear: 0
      };
    }

    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
    const thisYearStart = new Date(now.getFullYear(), 0, 1);

    const encounterDates = encounters.map(e => new Date(e.date));
    const lastVisit = encounterDates.length > 0
      ? new Date(Math.max(...encounterDates.map(d => d.getTime())))
      : null;

    const pastYearEncounters = encounters.filter(e => new Date(e.date) >= oneYearAgo);
    const avgPerMonth = pastYearEncounters.length / 12;

    const thisYearEncounters = encounters.filter(e => new Date(e.date) >= thisYearStart);

    return {
      total: encounters.length,
      lastVisit: lastVisit ? formatDate(lastVisit) : 'N/A',
      avgPerMonth: avgPerMonth.toFixed(1),
      thisYear: thisYearEncounters.length
    };
  }, [encounters]);

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Column - Stats */}
      <div className="lg:col-span-1 space-y-6">
        {/* Statistics Card */}
        <div className="card-main">
          <h2 className="card-header">Visit Statistics</h2>
          <div className="space-y-4">
            <div className="stat-box">
              <div className="text-caption text-gray-600 font-semibold mb-1">Total Visits</div>
              <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            </div>
            <div className="stat-box">
              <div className="text-caption text-gray-600 font-semibold mb-1">This Year</div>
              <div className="text-3xl font-bold text-green-600">{stats.thisYear}</div>
            </div>
            <div className="stat-box">
              <div className="text-caption text-gray-600 font-semibold mb-1">Avg/Month (Past Year)</div>
              <div className="text-3xl font-bold text-purple-600">{stats.avgPerMonth}</div>
            </div>
            <div className="stat-box">
              <div className="text-caption text-gray-600 font-semibold mb-1">Last Visit</div>
              <div className="text-lg font-bold text-gray-700">{stats.lastVisit}</div>
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
              All Encounters
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

        {/* Sort Card */}
        <div className="card-main">
          <h3 className="section-header">Sort By</h3>
          <div className="space-y-2">
            <button
              onClick={() => setSortBy('date-desc')}
              className={`w-full text-left filter-btn-enhanced ${
                sortBy === 'date-desc'
                  ? 'filter-btn-active-base bg-blue-500'
                  : 'filter-btn-inactive'
              }`}
            >
              Newest First
            </button>
            <button
              onClick={() => setSortBy('date-asc')}
              className={`w-full text-left filter-btn-enhanced ${
                sortBy === 'date-asc'
                  ? 'filter-btn-active-base bg-blue-500'
                  : 'filter-btn-inactive'
              }`}
            >
              Oldest First
            </button>
            <button
              onClick={() => setSortBy('provider')}
              className={`w-full text-left filter-btn-enhanced ${
                sortBy === 'provider'
                  ? 'filter-btn-active-base bg-blue-500'
                  : 'filter-btn-inactive'
              }`}
            >
              By Provider
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - Encounters List */}
      <div className="lg:col-span-3">
        <div className="card-main">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Encounter History
              <span className="ml-2 text-sm font-normal text-gray-600">
                ({filteredEncounters.length} {filteredEncounters.length === 1 ? 'visit' : 'visits'})
              </span>
            </h2>
          </div>

          {filteredEncounters.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 text-lg">No encounters found</p>
              <p className="text-gray-500 text-sm mt-2">
                {filterType !== 'all' ? 'Try adjusting your filters' : 'No visit history recorded'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEncounters.map((encounter) => (
                <div
                  key={encounter.encounter}
                  className="card-inner hover:bg-white/90 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-lg font-bold text-gray-800">
                          {formatDate(encounter.date)}
                        </div>
                        <span className="badge-sm badge-light-info">
                          ID: {encounter.encounter}
                        </span>
                      </div>

                      {encounter.reason && (
                        <div className="text-gray-900 font-medium mb-2">
                          {encounter.reason}
                        </div>
                      )}

                      <div className="flex gap-6 text-sm text-gray-600">
                        {encounter.provider_name && (
                          <div>
                            <span className="font-semibold">Provider:</span> {encounter.provider_name}
                          </div>
                        )}
                        {encounter.facility_name && (
                          <div>
                            <span className="font-semibold">Facility:</span> {encounter.facility_name}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEncounter(encounter.encounter);
                      }}
                      className="ml-4 btn-mini"
                    >
                      View Details
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

export default EncountersTab;
