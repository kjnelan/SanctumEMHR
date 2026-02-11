import React, { useState, useEffect } from 'react';
import { getProviders } from '../../utils/api';
import { getCurrentUser } from '../../services/AuthService';
import AssignedProviders from './AssignedProviders';

function SummaryTab({ data }) {
  const [providers, setProviders] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Load providers and current user for Care Team
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const response = await getProviders();
        setProviders(response.providers || []);
      } catch (err) {
        console.error('Failed to load providers:', err);
      }
    };

    const loadUser = async () => {
      try {
        const user = getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error('Failed to load current user:', err);
      }
    };

    loadProviders();
    loadUser();
  }, []);
  if (!data) {
    return (
      <div className="text-gray-700 text-center py-8">
        Loading client data...
      </div>
    );
  }

  const { client, upcomingAppointments, recentAppointments, problems, medications, encounters } = data;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    // Parse date parts manually to avoid timezone offset issues
    const [year, month, day] = dateStr.split(/[-T]/);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    // timeStr is in format HH:MM:SS
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Clean up ICD-10 description - remove duplicates and extra spaces
  const cleanDiagnosisDescription = (title) => {
    if (!title) return '';
    // Many ICD-10 descriptions have duplicate text separated by multiple spaces
    // Example: "abuse with intoxication, uncomplicated               Alcohol abuse with intoxication, uncomplicated"

    // Split on multiple spaces (3 or more) and take the most descriptive part
    const parts = title.split(/\s{3,}/);
    if (parts.length > 1) {
      // Usually the second part is more descriptive
      return parts[1].trim();
    }
    return title.trim();
  };

  return (
    <div className="flex gap-6">
      {/* Main Content - Two Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Contact Information Card */}
          <div className="card-main">
            <h2 className="card-header">Contact Information</h2>
            <div className="bg-white/80 rounded-xl p-4 border border-gray-200">
              <div className="space-y-3">
                <div>
                  <span className="field-label">Email:</span>
                  <div className="field-value">{client.email || 'Not provided'}</div>
                </div>
                <div>
                  <span className="field-label">Cell Phone:</span>
                  <div className="field-value">{client.phone_cell || 'Not provided'}</div>
                </div>
                <div>
                  <span className="field-label">Home Phone:</span>
                  <div className="field-value">{client.phone_home || 'Not provided'}</div>
                </div>
                <div>
                  <span className="field-label">Address:</span>
                  <div className="field-value">
                    {client.street && client.city ? (
                      <>
                        {client.street}<br />
                        {client.city}, {client.state} {client.postal_code}
                      </>
                    ) : (
                      'Not provided'
                    )}
                  </div>
                </div>
                {client.contact_relationship && (
                  <div>
                    <span className="field-label">Emergency Contact:</span>
                    <div className="field-value">{client.contact_relationship}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Diagnosis Card */}
          <div className="card-main">
            <h2 className="card-header">
              <span className="flex items-center gap-2">
                🏥 Diagnosis
              </span>
            </h2>
            {problems && problems.length > 0 ? (
              <div className="space-y-3">
                {problems.map((problem) => (
                  <div key={problem.id} className="card-inner border-l-4 border-blue-400">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                            {problem.diagnosis}
                          </span>
                          {problem.enddate && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              Retired
                            </span>
                          )}
                        </div>
                        <div className="item-title text-gray-800">
                          {cleanDiagnosisDescription(problem.title)}
                        </div>
                        <div className="item-tertiary mt-1">
                          Started: {formatDate(problem.begdate)}
                          {problem.enddate && ` • Ended: ${formatDate(problem.enddate)}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No active diagnoses recorded</div>
            )}
          </div>

          {/* Care Team Card */}
          <div className="card-main">
            <h2 className="card-header">Care Team</h2>
            <AssignedProviders
              clientId={client.pid}
              isAdmin={currentUser?.admin}
              providers={providers}
            />
          </div>

          {/* Current Medications Card */}
          <div className="card-main">
            <h2 className="card-header">
              <span className="flex items-center gap-2">
                💊 Current Medications
              </span>
            </h2>
            {medications && medications.length > 0 ? (
              <div className="space-y-3">
                {medications.map((med, index) => (
                  <div key={index} className="card-inner border-l-4 border-green-400">
                    <div className="item-title text-gray-900">{med.name}</div>
                    {med.dosage && (
                      <div className="item-secondary text-green-700 font-semibold">
                        {med.dosage}
                        {med.frequency && ` - ${med.frequency}`}
                      </div>
                    )}
                    {med.purpose && (
                      <div className="item-tertiary">For: {med.purpose}</div>
                    )}
                    {med.prescriber && (
                      <div className="item-tertiary">Prescribed by: {med.prescriber}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No active medications</div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Appointments & Portal */}
      <div className="w-80 flex-shrink-0 space-y-6">
        <div className="card-main">
          <h2 className="card-header">Appointments</h2>

          {/* Upcoming Appointments Section */}
          <div className="mb-6">
            <h3 className="section-header">Upcoming</h3>
            {upcomingAppointments && upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.map((appt) => (
                  <div key={appt.pc_eid} className="card-inner">
                    <div className="appt-date">{formatDate(appt.pc_eventDate)}</div>
                    <div className="appt-time">
                      {formatTime(appt.pc_startTime)} - {formatTime(appt.pc_endTime)}
                    </div>
                    <div className="appt-type">{appt.pc_catname || 'Appointment'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted">No upcoming appointments</div>
            )}
          </div>

          {/* Recurring Appointments Section - Placeholder */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="section-header">Recurring</h3>
            <div className="text-muted">No recurring appointments</div>
          </div>

          {/* Recent Past Appointments Section */}
          <div>
            <h3 className="section-header">Recent Past</h3>
            {recentAppointments && recentAppointments.length > 0 ? (
              <div className="space-y-3">
                {recentAppointments.slice(0, 6).map((appt) => (
                  <div key={appt.pc_eid} className="card-inner">
                    <div className="appt-date">{formatDate(appt.pc_eventDate)}</div>
                    <div className="appt-time">
                      {formatTime(appt.pc_startTime)} - {formatTime(appt.pc_endTime)}
                    </div>
                    <div className="appt-type">{appt.pc_catname || 'Appointment'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted">No recent appointments</div>
            )}
          </div>
        </div>

        {/* Portal Access Card */}
        <div className="card-main">
          <h2 className="card-header">Portal Access</h2>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="alert-header text-gray-700">Portal Status</p>
              <p className="text-caption text-gray-600">Client Portal Not Enabled. Admin Can Enable Client Portal.</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="alert-header text-gray-700 mb-2">Credentials</p>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                + Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SummaryTab;
