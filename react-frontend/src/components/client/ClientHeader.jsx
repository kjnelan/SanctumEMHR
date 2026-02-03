import React from 'react';
import { useNavigate } from 'react-router-dom';

function ClientHeader({ client }) {
  const navigate = useNavigate();

  if (!client) {
    return null;
  }

  const getStatusBadge = (status) => {
    if (!status) return 'bg-gray-500 text-white';

    const statusLower = status.toLowerCase();
    if (statusLower === 'active') {
      return 'bg-green-500 text-white';
    } else if (statusLower === 'inactive') {
      return 'bg-yellow-500 text-white';
    } else if (statusLower === 'discharged') {
      return 'bg-gray-500 text-white';
    }
    return 'bg-gray-500 text-white';
  };

  const getStatusText = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const formatAge = (age) => {
    return age ? `${age} years old` : '';
  };

  const formatDOB = (dob) => {
    if (!dob) return '';
    // Parse date parts manually to avoid timezone offset issues
    const [year, month, day] = dob.split('-');
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatClientSince = (date) => {
    if (!date) return '';
    // Parse date parts manually to avoid timezone offset issues
    const [year, month, day] = date.split('-');
    const d = new Date(year, month - 1, day); // month is 0-indexed
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="card-main mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-3 py-2 bg-white/60 hover:bg-white/80 text-gray-700 rounded-lg transition-colors font-medium border border-gray-200"
            title="Back to Dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>

          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {client.fname} {client.mname && client.mname + ' '}{client.lname}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-gray-600">
              <span>{formatAge(client.age)}</span>
              <span>•</span>
              <span>DOB: {formatDOB(client.DOB)}</span>
              <span>•</span>
              <span>ID: {client.pid}</span>
              {client.client_since && (
                <>
                  <span>•</span>
                  <span>Client Since: {formatClientSince(client.client_since)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {client.protection_indicator_code === 'YES' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-semibold text-red-800">Risk Factors Documented</span>
            </div>
          )}
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadge(client.care_team_status)}`}>
            {getStatusText(client.care_team_status)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ClientHeader;
