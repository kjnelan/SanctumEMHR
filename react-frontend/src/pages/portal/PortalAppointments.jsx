import { useState, useEffect } from 'react';
import { portalGetAppointments } from '../../services/PortalService';
import PortalLayout from './PortalLayout';

function PortalAppointments() {
  const [view, setView] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await portalGetAppointments(view);
        setAppointments(data.appointments || []);
      } catch (error) {
        console.error('Failed to load appointments:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [view]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${ampm}`;
  };

  const statusBadge = (status) => {
    const styles = {
      scheduled: 'badge-light-info',
      confirmed: 'badge-light-success',
      completed: 'badge-light-neutral',
      cancelled: 'badge-light-danger',
      'no-show': 'badge-light-warning'
    };
    return styles[status] || 'badge-light-neutral';
  };

  return (
    <PortalLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
        <p className="text-gray-600 mt-1">View your upcoming and past appointments.</p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('upcoming')}
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
            view === 'upcoming'
              ? 'nav-main-active'
              : 'nav-main-inactive'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setView('past')}
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
            view === 'past'
              ? 'nav-main-active'
              : 'nav-main-inactive'
          }`}
        >
          Past Visits
        </button>
      </div>

      {/* Appointments List */}
      <div className="sanctum-glass-main p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 mx-auto" style={{ border: '2px solid rgba(107, 154, 196, 0.3)', borderTopColor: 'rgba(107, 154, 196, 0.9)' }}></div>
            <p className="text-sm text-gray-500 mt-3">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 font-medium">
              {view === 'upcoming' ? 'No upcoming appointments' : 'No past appointments found'}
            </p>
            {view === 'upcoming' && (
              <p className="text-gray-400 text-sm mt-1">Contact your provider to schedule a visit.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <div key={appt.id} className="sanctum-glass-card p-5 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{formatDate(appt.date)}</p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {formatTime(appt.startTime)} - {formatTime(appt.endTime)}
                      </p>
                      {appt.type && (
                        <p className="text-sm text-gray-500 mt-1">{appt.type}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className={`badge-sm ${statusBadge(appt.status)}`}>
                      {appt.status}
                    </span>
                    {appt.providerName && (
                      <p className="text-sm text-gray-600 mt-1">with {appt.providerName}</p>
                    )}
                    {appt.facilityName && (
                      <p className="text-xs text-gray-400 mt-0.5">{appt.facilityName}</p>
                    )}
                    {appt.roomName && (
                      <p className="text-xs text-gray-400">{appt.roomName}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}

export default PortalAppointments;
