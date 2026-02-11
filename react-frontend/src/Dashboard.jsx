import { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Greeting from './components/dashboard/Greeting';
import StatsGrid from './components/dashboard/StatsGrid';
import AppointmentsList from './components/dashboard/AppointmentsList';
const Clients = lazy(() => import('./pages/Clients'));
const Reports = lazy(() => import('./pages/Reports'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Admin = lazy(() => import('./pages/Admin'));
const Settings = lazy(() => import('./pages/Settings'));
import NewClientModal from './components/client/NewClientModal';
import AppointmentModal from './components/calendar/AppointmentModal';
import { useAuth } from './hooks/useAuth';
import { getProviders } from './utils/api';
import { logout } from './services/AuthService';
import { getClientStats } from './services/ClientService';
import { getPendingReviews, getMyPendingNotes } from './services/DashboardService';
import SupervisionWidget from './components/dashboard/SupervisionWidget';

function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('dashboard');
  const { user, appointments, loading } = useAuth();
  const [clientStats, setClientStats] = useState({ activeClients: 0 });
  const [pendingReviews, setPendingReviews] = useState({ count: 0, notes: [] });
  const [myPendingNotes, setMyPendingNotes] = useState({ totalCount: 0, combined: [] });
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [providers, setProviders] = useState([]);

  // Update activeNav when navigating from client detail or other pages
  useEffect(() => {
    if (location.state?.activeNav) {
      setActiveNav(location.state.activeNav);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchClientStats = async () => {
      try {
        const data = await getClientStats();
        setClientStats(data);
      } catch (err) {
        console.error('Failed to fetch client stats:', err);
      }
    };

    const fetchProviders = async () => {
      try {
        const response = await getProviders();
        setProviders(response.providers || []);
      } catch (err) {
        console.error('Failed to fetch providers:', err);
      }
    };

    const fetchPendingReviews = async () => {
      // Only fetch if user is a supervisor
      if (!user?.isSupervisor) return;

      try {
        const data = await getPendingReviews();
        setPendingReviews(data);
      } catch (err) {
        console.error('Failed to fetch pending reviews:', err);
      }
    };

    const fetchMyPendingNotes = async () => {
      try {
        const data = await getMyPendingNotes();
        setMyPendingNotes(data);
      } catch (err) {
        console.error('Failed to fetch my pending notes:', err);
      }
    };

    if (user) {
      fetchClientStats();
      fetchProviders();
      fetchPendingReviews();
      fetchMyPendingNotes();
    }
  }, [user]);

  const stats = {
    todayAppointments: { value: appointments.filter(apt => apt.categoryType !== 1).length || 0, trend: { direction: 'up', change: 0, label: 'from yesterday' } },
    unbilledAppointments: { value: 0, trend: { direction: 'up', change: 0, label: 'from last week' } },
    sessionsYTD: { value: 0, trend: { direction: 'up', change: 0, label: 'from last month' } },
    activeClients: { value: clientStats.activeClients || 0, trend: { direction: 'down', change: 0, label: 'from last month' } }
  };

  const todaysAppointments = appointments
    .filter(appt => appt.categoryType !== 1) // Exclude availability blocks
    .map(appt => {
      // For client appointments, show patient name; for clinic/supervision, show clinician
      const displayName = appt.clientName
        ? appt.clientName
        : (appt.providerFirstName
          ? `${appt.providerFirstName} ${appt.providerLastName || ''}`.trim()
          : appt.categoryName || 'Appointment');

      return {
        ...appt, // Include all original appointment data
        time: new Date(appt.eventDate + ' ' + appt.startTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        }),
        client: displayName,
        type: appt.categoryName || 'Appointment',
        duration: appt.duration ? `${appt.duration} min` : '',
        room: appt.room || '',
        isNext: false
      };
    });

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleLogout = async () => {
    await logout();
  };

  const handleNewClient = () => {
    setShowNewClientModal(true);
  };

  const handleNewClientCreated = (patientId) => {
    console.log('New client created with ID:', patientId);
    setShowNewClientModal(false);
    // Navigate to the new client's detail page
    navigate(`/clients/${patientId}`);
  };

  const handleNewAppointment = () => {
    setSelectedAppointment(null);
    setShowAppointmentModal(true);
  };

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const handleAppointmentSave = () => {
    console.log('Appointment saved');
    setSelectedAppointment(null);
    setShowAppointmentModal(false);
    // Optionally refresh appointments here
    window.location.reload(); // Simple way to refresh data
  };

  const handleAppointmentClose = () => {
    setSelectedAppointment(null);
    setShowAppointmentModal(false);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-mental">
        <div className="sanctum-glass-main p-8">
          <div className="animate-spin rounded-full h-16 w-16 mx-auto" style={{ border: '3px solid rgba(107, 154, 196, 0.3)', borderTopColor: 'rgba(107, 154, 196, 0.9)' }}></div>
          <p className="text-label mt-4 text-center">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      user={user}
      activeNav={activeNav}
      setActiveNav={setActiveNav}
      today={today}
      onLogout={handleLogout}
      wide={true}
    >
      {activeNav === 'dashboard' && (
        <>
          <Greeting />
          <StatsGrid
            stats={stats}
            onNewClient={handleNewClient}
            onNewAppointment={handleNewAppointment}
          />
          {/* Pending Notes Card + Today's Appointments */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Supervision + Pending Notes */}
            <div className="space-y-6">
              {/* Supervision Widget - Shows supervisees (if supervisor) and/or supervisors */}
              <SupervisionWidget userId={user.id} isSupervisor={user?.isSupervisor} />

              {/* Pending Notes Card - Your Notes + Supervisor Reviews */}
              <div className="sanctum-glass-main p-6">
              {/* Your Pending Notes Section */}
              <div className={user?.isSupervisor ? 'pb-4 border-b border-gray-200 mb-4' : ''}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Your Pending Notes</h3>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${myPendingNotes.totalCount > 0 ? 'bg-gradient-to-br from-amber-400 to-orange-600' : 'bg-gradient-to-br from-gray-400 to-gray-600'}`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                </div>
                {myPendingNotes.totalCount === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">All caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className={`text-2xl font-bold ${myPendingNotes.totalCount > 0 ? 'text-orange-600' : 'text-gray-800'}`}>
                      {myPendingNotes.totalCount} <span className="text-sm font-medium text-gray-500">pending</span>
                    </div>
                    {myPendingNotes.combined?.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="p-2 bg-white/60 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${item.type === 'draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {item.type === 'draft' ? 'Draft' : 'Missing'}
                          </span>
                          <span className="font-medium text-gray-800 text-sm truncate">{item.clientName}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(item.serviceDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    {myPendingNotes.totalCount > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{myPendingNotes.totalCount - 3} more
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Notes Pending Review Section - Only for supervisors */}
              {user?.isSupervisor && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Notes Pending Review</h3>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${pendingReviews.count > 0 ? 'bg-gradient-to-br from-red-400 to-red-600' : 'bg-gradient-to-br from-gray-400 to-gray-600'}`}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  {pendingReviews.count === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No notes awaiting review</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className={`text-2xl font-bold ${pendingReviews.count > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                        {pendingReviews.count} <span className="text-sm font-medium text-gray-500">to review</span>
                      </div>
                      {pendingReviews.notes?.slice(0, 3).map((note, idx) => (
                        <div key={idx} className="p-2 bg-white/60 rounded-lg border border-gray-200">
                          <p className="font-medium text-gray-800 text-sm truncate">{note.clientName}</p>
                          <p className="text-xs text-gray-500">
                            {note.providerName} • {new Date(note.serviceDate).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                      {pendingReviews.count > 3 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{pendingReviews.count - 3} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>

            {/* Today's Appointments */}
            <div className="lg:col-span-2">
              <AppointmentsList
                todaysAppointments={todaysAppointments}
                onAppointmentClick={handleAppointmentClick}
              />
            </div>
          </div>
        </>
      )}

      <Suspense fallback={<div className="p-10 text-center text-gray-500">Loading component...</div>}>
      {activeNav === 'clients' && <Clients />}

      {activeNav === 'calendar' && <Calendar />}

      {activeNav === 'reports' && <Reports />}

      {activeNav === 'admin' && <Admin />}

      {activeNav === 'settings' && <Settings />}

      </Suspense>
      {activeNav !== 'dashboard' && activeNav !== 'clients' && activeNav !== 'calendar' && activeNav !== 'reports' && activeNav !== 'admin' && activeNav !== 'settings' && (
        <div className="sanctum-glass-main p-8 text-center">
          <p className="text-gray-700 text-lg font-semibold">
            {activeNav.charAt(0).toUpperCase() + activeNav.slice(1)} - Coming Soon
          </p>
          <p className="text-gray-600 mt-2">This feature is under development</p>
        </div>
      )}

      {/* New Client Modal */}
      {showNewClientModal && (
        <NewClientModal
          onClose={() => setShowNewClientModal(false)}
          onClientCreated={handleNewClientCreated}
        />
      )}

      {/* New/Edit Appointment Modal */}
      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={handleAppointmentClose}
        onSave={handleAppointmentSave}
        appointment={selectedAppointment}
        providers={providers}
      />
    </AppShell>
  );
}

export default Dashboard;
