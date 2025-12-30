import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchPatients, getClientStats, getClients } from '../utils/api';
import PendingNotes from './dashboard/PendingNotes';
import NewClientModal from './client/NewClientModal';

function Clients() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [stats, setStats] = useState({
    activeClients: 0,
    inactiveClients: 0,
    dischargedClients: 0,
    todayClients: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Client list state
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('active');

  // New client modal state
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  // Fetch client statistics on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsData = await getClientStats();
        setStats(statsData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch client list when status filter changes
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setClientsLoading(true);
        const clientsData = await getClients(statusFilter);
        setClients(clientsData || []);
      } catch (err) {
        console.error('Failed to fetch clients:', err);
        setClients([]);
      } finally {
        setClientsLoading(false);
      }
    };

    fetchClients();
  }, [statusFilter]);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      setError('Please enter a search term');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const results = await searchPatients(searchQuery);
      setSearchResults(results || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search patients. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientClick = (patientId) => {
    // Navigate to custom Mindline client detail view
    console.log('=== CLICKING CLIENT ===');
    console.log('Patient ID:', patientId);
    console.log('About to navigate to:', `/clients/${patientId}`);
    navigate(`/clients/${patientId}`);
    console.log('Navigate called');
  };

  const handleNewClientCreated = (patientId) => {
    console.log('New client created with ID:', patientId);
    // Navigate to the new client's detail page
    navigate(`/clients/${patientId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadge = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'active') {
      return 'badge-solid-success';
    } else if (statusLower === 'inactive') {
      return 'badge-solid-warning';
    } else if (statusLower === 'discharged') {
      return 'badge-solid-neutral';
    }
    return 'badge-solid-neutral';
  };

  return (
    <div className="flex gap-6">
      {/* Left Sidebar - Stats & Demographics */}
      <div className="w-80 flex-shrink-0 space-y-6">
        {/* Page Header */}
        <div className="card-main">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Clients</h2>
          <p className="text-gray-600 text-xs">Manage client records</p>
        </div>

        {/* Quick Stats */}
        <div className="card-main">
          <h3 className="text-sm font-bold text-gray-700 mb-4">Caseload Summary</h3>
          <div className="space-y-3">
            {/* Active Clients */}
            <div className="stat-box">
              {statsLoading ? (
                <div className="skeleton-pulse">
                  <div className="h-3 bg-gray-300 rounded w-16 mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded w-8"></div>
                </div>
              ) : (
                <>
                  <p className="text-caption text-gray-600 font-semibold mb-1">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeClients}</p>
                </>
              )}
            </div>

            {/* Inactive Clients */}
            <div className="stat-box">
              {statsLoading ? (
                <div className="skeleton-pulse">
                  <div className="h-3 bg-gray-300 rounded w-16 mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded w-8"></div>
                </div>
              ) : (
                <>
                  <p className="text-caption text-gray-600 font-semibold mb-1">Inactive</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.inactiveClients}</p>
                </>
              )}
            </div>

            {/* Discharged Clients */}
            <div className="stat-box">
              {statsLoading ? (
                <div className="skeleton-pulse">
                  <div className="h-3 bg-gray-300 rounded w-16 mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded w-8"></div>
                </div>
              ) : (
                <>
                  <p className="text-caption text-gray-600 font-semibold mb-1">Discharged</p>
                  <p className="text-2xl font-bold text-gray-500">{stats.dischargedClients}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Pending Documentation */}
        <PendingNotes />
      </div>

      {/* Main Content Area - Search & Results */}
      <div className="flex-1 space-y-6">{/* Search Bar */}
      <div className="card-main">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-gray-800 text-sm font-semibold mb-2">
                Search by Name
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-lg"
                placeholder="Enter client name..."
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-search disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Searching...
                  </span>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </form>
      </div>

      {/* Results Section - Only show after search has been initiated */}
      {hasSearched && (
        <div className="card-main">
          {loading ? (
          <div className="text-center py-6">
            <div className="spinner spinner-md mx-auto"></div>
            <p className="text-gray-700 font-semibold mt-3">Searching...</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-6">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600">No clients found matching "{searchQuery}"</p>
            <p className="text-gray-500 text-sm mt-2">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mb-4">
              <p className="text-gray-700 font-semibold">
                Found {searchResults.length} client{searchResults.length !== 1 ? 's' : ''}
              </p>
            </div>
            {searchResults.map((patient) => (
              <div
                key={patient.id || patient.pid}
                onClick={() => handlePatientClick(patient.id || patient.pid)}
                className="card-item"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      {patient.fname} {patient.lname}
                    </h3>
                    <div className="flex gap-6 text-sm text-gray-600">
                      <div>
                        <span className="font-semibold">DOB:</span> {formatDate(patient.DOB)}
                      </div>
                      {patient.phone_cell && (
                        <div>
                          <span className="font-semibold">Phone:</span> {patient.phone_cell}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      )}

      {/* Client List Section */}
      <div className="card-main">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Client List</h3>
            <button
              onClick={() => setShowNewClientModal(true)}
              className="btn-solid btn-solid-green btn-icon"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Client
            </button>
          </div>

          {/* Filter Toggles */}
          <div className="flex gap-3">
            <button
              onClick={() => setStatusFilter('active')}
              className={`filter-btn-enhanced ${
                statusFilter === 'active'
                  ? 'filter-btn-active-base bg-green-500'
                  : 'filter-btn-inactive'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`filter-btn-enhanced ${
                statusFilter === 'inactive'
                  ? 'filter-btn-active-base bg-yellow-500'
                  : 'filter-btn-inactive'
              }`}
            >
              Inactive
            </button>
            <button
              onClick={() => setStatusFilter('discharged')}
              className={`filter-btn-enhanced ${
                statusFilter === 'discharged'
                  ? 'filter-btn-active-base bg-gray-500'
                  : 'filter-btn-inactive'
              }`}
            >
              Discharged
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`filter-btn-enhanced ${
                statusFilter === 'all'
                  ? 'filter-btn-active-base bg-blue-500'
                  : 'filter-btn-inactive'
              }`}
            >
              All Clients
            </button>
          </div>
        </div>

        {/* Client List */}
        {clientsLoading ? (
          <div className="text-center py-12">
            <div className="spinner spinner-lg mx-auto"></div>
            <p className="text-gray-700 font-semibold mt-4">Loading clients...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 text-lg">No {statusFilter !== 'all' ? statusFilter : ''} clients found</p>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <p className="text-gray-700 font-semibold">
                {clients.length} {statusFilter !== 'all' ? statusFilter : ''} client{clients.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <div
                  key={client.pid}
                  onClick={() => handlePatientClick(client.pid)}
                  className="card-item"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold text-gray-800">
                      {client.fname} {client.lname}
                    </h4>
                    <span className={getStatusBadge(client.care_team_status)}>
                      {(client.care_team_status || 'Unknown').toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>
                      <span className="font-semibold">Age:</span> {client.age}
                    </div>
                    <div>
                      <span className="font-semibold">DOB:</span> {formatDate(client.DOB)}
                    </div>
                    {(client.phone_cell || client.phone_home) && (
                      <div>
                        <span className="font-semibold">Phone:</span> {client.phone_cell || client.phone_home}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>

      {/* New Client Modal */}
      {showNewClientModal && (
        <NewClientModal
          onClose={() => setShowNewClientModal(false)}
          onClientCreated={handleNewClientCreated}
        />
      )}
    </div>
  );
}

export default Clients;
