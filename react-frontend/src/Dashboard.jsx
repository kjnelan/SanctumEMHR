import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Greeting from './components/dashboard/Greeting';
import StatsGrid from './components/dashboard/StatsGrid';
import AppointmentsList from './components/dashboard/AppointmentsList';
import Clients from './components/Clients';
import Reports from './components/Reports';
import Calendar from './pages/Calendar';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import NewClientModal from './components/client/NewClientModal';
import AppointmentModal from './components/calendar/AppointmentModal';
import { useAuth } from './hooks/useAuth';
import { logout, getClientStats, getProviders } from './utils/api';

function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('dashboard');
  const { user, appointments, loading } = useAuth();
  const [clientStats, setClientStats] = useState({ activeClients: 0 });
  const [pendingReviews, setPendingReviews] = useState({ count: 0, notes: [] });
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
        const response = await fetch('/custom/api/notes/pending_supervisor_review.php', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setPendingReviews(data);
        }
      } catch (err) {
        console.error('Failed to fetch pending reviews:', err);
      }
    };

    if (user) {
      fetchClientStats();
      fetchProviders();
      fetchPendingReviews();
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
      const displayName = appt.patientName
        ? appt.patientName
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
      <div className="rounded-3xl p-8" style={{ backdropFilter: 'blur(60px) saturate(180%)', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.4) 100%)', boxShadow: '0 8px 32px rgba(107, 154, 196, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)', border: '1px solid rgba(255, 255, 255, 0.6)' }}>
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
          {/* Notes Pending Review (for supervisors) + Today's Appointments */}
          <div className={`grid ${user?.isSupervisor ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
            {/* Notes Pending Review - Only for supervisors */}
            {user?.isSupervisor && (
              <div className={`card-main ${pendingReviews.count > 0 ? 'ring-2 ring-red-400' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Notes Pending Review</h3>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${pendingReviews.count > 0 ? 'bg-gradient-to-br from-red-400 to-red-600' : 'bg-gradient-to-br from-gray-400 to-gray-600'}`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                {pendingReviews.count === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No notes awaiting your review</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className={`text-3xl font-bold ${pendingReviews.count > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                      {pendingReviews.count} <span className="text-sm font-medium text-gray-500">note{pendingReviews.count !== 1 ? 's' : ''}</span>
                    </div>
                    {pendingReviews.notes?.slice(0, 5).map((note, idx) => (
                      <div key={idx} className="p-3 bg-white/60 rounded-lg border border-gray-200">
                        <p className="font-medium text-gray-800">{note.patientName}</p>
                        <p className="text-sm text-gray-600">
                          {note.providerName} • {note.noteType} • {new Date(note.serviceDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    {pendingReviews.count > 5 && (
                      <p className="text-sm text-gray-500 text-center">
                        +{pendingReviews.count - 5} more notes
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* Today's Appointments */}
            <div className={user?.isSupervisor ? 'lg:col-span-2' : ''}>
              <AppointmentsList
                todaysAppointments={todaysAppointments}
                onAppointmentClick={handleAppointmentClick}
              />
            </div>
          </div>
        </>
      )}

      {activeNav === 'clients' && <Clients />}

      {activeNav === 'calendar' && <Calendar />}

      {activeNav === 'reports' && <Reports />}

      {activeNav === 'admin' && <Admin />}

      {activeNav === 'settings' && <Settings />}

      {activeNav !== 'dashboard' && activeNav !== 'clients' && activeNav !== 'calendar' && activeNav !== 'reports' && activeNav !== 'admin' && activeNav !== 'settings' && (
        <div className="backdrop-blur-2xl bg-white/40 rounded-3xl shadow-2xl border border-white/50 p-8 text-center">
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
