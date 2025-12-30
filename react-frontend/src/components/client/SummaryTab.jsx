import React from 'react';

function SummaryTab({ data }) {
  if (!data) {
    return (
      <div className="text-gray-700 text-center py-8">
        Loading client data...
      </div>
    );
  }

  const { patient, upcomingAppointments, recentAppointments, problems, medications, encounters } = data;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
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
                  <div className="field-value">{patient.email || 'Not provided'}</div>
                </div>
                <div>
                  <span className="field-label">Cell Phone:</span>
                  <div className="field-value">{patient.phone_cell || 'Not provided'}</div>
                </div>
                <div>
                  <span className="field-label">Home Phone:</span>
                  <div className="field-value">{patient.phone_home || 'Not provided'}</div>
                </div>
                <div>
                  <span className="field-label">Address:</span>
                  <div className="field-value">
                    {patient.street && patient.city ? (
                      <>
                        {patient.street}<br />
                        {patient.city}, {patient.state} {patient.postal_code}
                      </>
                    ) : (
                      'Not provided'
                    )}
                  </div>
                </div>
                {patient.contact_relationship && (
                  <div>
                    <span className="field-label">Emergency Contact:</span>
                    <div className="field-value">{patient.contact_relationship}</div>
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
            <h2 className="card-header">Diagnosis</h2>
            {problems && problems.length > 0 ? (
              <div className="space-y-3">
                {problems.map((problem) => (
                  <div key={problem.id} className="card-inner">
                    <div className="item-title">{problem.title}</div>
                    {problem.diagnosis && (
                      <div className="item-secondary">Code: {problem.diagnosis}</div>
                    )}
                    <div className="item-tertiary">
                      Started: {formatDate(problem.begdate)}
                      {problem.enddate && ` - Ended: ${formatDate(problem.enddate)}`}
                    </div>
                    {problem.outcome && (
                      <div className="item-tertiary">Outcome: {problem.outcome}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No active diagnoses recorded</div>
            )}
          </div>

          {/* Active Medications Card */}
          <div className="card-main">
            <h2 className="card-header">Active Medications</h2>
            {medications && medications.length > 0 ? (
              <div className="space-y-3">
                {medications.map((med) => (
                  <div key={med.id} className="card-inner">
                    <div className="item-title">{med.drug}</div>
                    <div className="item-secondary">
                      {med.dosage}
                      {med.interval && ` - ${med.interval}`}
                    </div>
                    {med.refills !== null && med.refills !== undefined && (
                      <div className="item-tertiary">Refills: {med.refills}</div>
                    )}
                    {med.date_added && (
                      <div className="item-tertiary">Added: {formatDate(med.date_added)}</div>
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
              <p className="text-caption text-gray-600">Patient Portal Not Enabled. Admin Can Enable Patient Portal.</p>
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
