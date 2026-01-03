import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Greeting from './components/dashboard/Greeting';
import StatsGrid from './components/dashboard/StatsGrid';
import QuickActions from './components/dashboard/QuickActions';
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

    if (user) {
      fetchClientStats();
      fetchProviders();
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
    .map(appt => ({
      ...appt, // Include all original appointment data
      time: new Date(appt.eventDate + ' ' + appt.startTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      }),
      client: appt.patientName || 'Unknown',
      type: appt.categoryName || 'Appointment',
      duration: appt.duration ? `${appt.duration} min` : '',
      room: appt.room || '',
      isNext: false
    }));

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
      <div className="backdrop-blur-2xl bg-white/40 rounded-3xl shadow-2xl p-8 border border-white/50">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
      <p className="text-gray-700 font-semibold mt-4 text-center">Loading dashboard...</p>
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
      wide={activeNav === 'calendar'}
    >
      {activeNav === 'dashboard' && (
        <>
          <Greeting />
          <StatsGrid stats={stats} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <QuickActions onNewClient={handleNewClient} onNewAppointment={handleNewAppointment} />
            <AppointmentsList
              todaysAppointments={todaysAppointments}
              onAppointmentClick={handleAppointmentClick}
            />
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
