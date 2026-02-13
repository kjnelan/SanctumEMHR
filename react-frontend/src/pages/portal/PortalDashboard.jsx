import { useState, useEffect } from 'react';
import { usePortalAuth } from '../../hooks/usePortalAuth';
import { portalGetAppointments } from '../../services/PortalService';
import PortalLayout from './PortalLayout';

function PortalDashboard() {
  const { client } = usePortalAuth();
  const [upcomingAppts, setUpcomingAppts] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(true);

  useEffect(() => {
    async function loadAppointments() {
      try {
        const data = await portalGetAppointments('upcoming');
        setUpcomingAppts(data.appointments || []);
      } catch (error) {
        console.error('Failed to load appointments:', error);
      } finally {
        setLoadingAppts(false);
      }
    }
    loadAppointments();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${ampm}`;
  };

  return (
    <PortalLayout>
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {client?.firstName || 'there'}
        </h1>
        <p className="text-gray-600 mt-1">Here's an overview of your care information.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Provider Info Card */}
        <div className="sanctum-glass-main p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Provider</h2>
          {client?.providerName ? (
            <div className="sanctum-glass-card p-4 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {client.providerName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{client.providerName}</p>
                  <p className="text-sm text-gray-500">Primary Provider</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No provider assigned yet.</p>
          )}
        </div>

        {/* Quick Links Card */}
        <div className="sanctum-glass-main p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Links</h2>
          <div className="space-y-3">
            <a href="#/mycare/appointments" className="sanctum-glass-card p-4 rounded-xl flex items-center gap-3 hover:shadow-lg transition-all cursor-pointer block">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">View Appointments</p>
                <p className="text-xs text-gray-500">See upcoming and past visits</p>
              </div>
            </a>
            <a href="#/mycare/profile" className="sanctum-glass-card p-4 rounded-xl flex items-center gap-3 hover:shadow-lg transition-all cursor-pointer block">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-800">My Profile</p>
                <p className="text-xs text-gray-500">Update your contact information</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="mt-6 sanctum-glass-main p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Upcoming Appointments
        </h2>

        {loadingAppts ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 mx-auto" style={{ border: '2px solid rgba(107, 154, 196, 0.3)', borderTopColor: 'rgba(107, 154, 196, 0.9)' }}></div>
          </div>
        ) : upcomingAppts.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500">No upcoming appointments scheduled.</p>
            <p className="text-gray-400 text-sm mt-1">Contact your provider to schedule a visit.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingAppts.slice(0, 5).map((appt) => (
              <div key={appt.id} className="sanctum-glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{formatDate(appt.date)}</p>
                      <p className="text-sm text-gray-600">
                        {formatTime(appt.startTime)} - {formatTime(appt.endTime)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">{appt.type || 'Appointment'}</p>
                    {appt.providerName && (
                      <p className="text-xs text-gray-500">with {appt.providerName}</p>
                    )}
                    {appt.facilityName && (
                      <p className="text-xs text-gray-400">{appt.facilityName}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {upcomingAppts.length > 5 && (
              <a href="#/mycare/appointments" className="text-sm text-blue-600 font-medium hover:underline block text-center mt-2">
                View all {upcomingAppts.length} upcoming appointments
              </a>
            )}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}

export default PortalDashboard;
