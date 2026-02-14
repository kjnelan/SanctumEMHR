/**
 * Audit Log Viewer Component
 * ADMIN ONLY - View and filter HIPAA-compliant audit logs
 */

import { useState, useEffect } from 'react';
import PrimaryButton from '../PrimaryButton';
import SecondaryButton from '../SecondaryButton';
import ErrorMessage from '../ErrorMessage';

function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [actionBreakdown, setActionBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    action: '',
    user_id: '',
    resource_type: '',
    resource_id: '',
    start_date: '',
    end_date: '',
    limit: 100
  });

  // Load logs on mount and when filters change
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query string
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/custom/api/audit_logs.php?${params}`, {
        credentials: 'include'
      });

      if (response.status === 403) {
        throw new Error('Admin access required to view audit logs');
      }

      if (response.status === 401) {
        throw new Error('You must be logged in to view audit logs');
      }

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setStatistics(data.statistics);
      setActionBreakdown(data.action_breakdown || []);

    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = () => {
    fetchLogs();
  };

  const handleClearFilters = () => {
    setFilters({
      action: '',
      user_id: '',
      resource_type: '',
      resource_id: '',
      start_date: '',
      end_date: '',
      limit: 100
    });
  };

  const handleExport = () => {
    // Convert logs to CSV
    const headers = ['Date/Time', 'User', 'Action', 'Resource Type', 'Resource ID', 'IP Address', 'Details'];
    const rows = logs.map(log => [
      log.created_at,
      log.user_name || 'System',
      log.action,
      log.resource_type || 'N/A',
      log.resource_id || 'N/A',
      log.ip_address || 'N/A',
      log.details ? JSON.stringify(log.details) : ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getActionBadgeColor = (action) => {
    const colorMap = {
      'login_success': 'bg-green-100 text-green-800',
      'login_failure': 'bg-red-100 text-red-800',
      'account_locked': 'bg-red-100 text-red-800',
      'logout': 'bg-gray-100 text-gray-800',
      'view_client': 'bg-blue-100 text-blue-800',
      'create_note': 'bg-purple-100 text-purple-800',
      'edit_note': 'bg-yellow-100 text-yellow-800',
      'sign_note': 'bg-green-100 text-green-800',
      'edit_demographics': 'bg-orange-100 text-orange-800',
      'create_user': 'bg-indigo-100 text-indigo-800',
      'edit_user': 'bg-yellow-100 text-yellow-800',
      'permission_change': 'bg-red-100 text-red-800',
      'deactivate_user': 'bg-red-100 text-red-800',
      'export_data': 'bg-purple-100 text-purple-800'
    };
    return colorMap[action] || 'bg-gray-100 text-gray-800';
  };

  const formatActionName = (action) => {
    return action.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading audit logs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900">Audit Log Viewer</h2>
        <p className="text-gray-600 mt-1">HIPAA-compliant audit trail of all system activities</p>
      </div>

      {error && (
        <ErrorMessage message={error} />
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Total Events</div>
            <div className="text-2xl font-bold text-gray-900">{statistics.total_events?.toLocaleString()}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Unique Users</div>
            <div className="text-2xl font-bold text-gray-900">{statistics.unique_users}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Days with Activity</div>
            <div className="text-2xl font-bold text-gray-900">{statistics.days_with_activity}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600">Date Range</div>
            <div className="text-sm font-medium text-gray-900">
              {statistics.first_event ? new Date(statistics.first_event).toLocaleDateString() : 'N/A'}
              {' → '}
              {statistics.last_event ? new Date(statistics.last_event).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action Type
            </label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Actions</option>
              <optgroup label="Authentication">
                <option value="login_success">Login Success</option>
                <option value="login_failure">Login Failure</option>
                <option value="account_locked">Account Locked</option>
                <option value="logout">Logout</option>
              </optgroup>
              <optgroup label="Client Access">
                <option value="view_client">View Client</option>
              </optgroup>
              <optgroup label="Clinical Notes">
                <option value="create_note">Create Note</option>
                <option value="edit_note">Edit Note</option>
                <option value="sign_note">Sign Note</option>
              </optgroup>
              <optgroup label="Demographics">
                <option value="edit_demographics">Edit Demographics</option>
              </optgroup>
              <optgroup label="User Management">
                <option value="create_user">Create User</option>
                <option value="edit_user">Edit User</option>
                <option value="permission_change">Permission Change</option>
                <option value="deactivate_user">Deactivate User</option>
              </optgroup>
            </select>
          </div>

          {/* Resource Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resource Type
            </label>
            <select
              value={filters.resource_type}
              onChange={(e) => handleFilterChange('resource_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="client">Client</option>
              <option value="note">Note</option>
              <option value="user">User</option>
              <option value="appointment">Appointment</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Limit
            </label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="50">50 entries</option>
              <option value="100">100 entries</option>
              <option value="250">250 entries</option>
              <option value="500">500 entries</option>
              <option value="1000">1000 entries</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <PrimaryButton onClick={handleApplyFilters}>
            Apply Filters
          </PrimaryButton>
          <SecondaryButton onClick={handleClearFilters}>
            Clear Filters
          </SecondaryButton>
          {logs.length > 0 && (
            <SecondaryButton onClick={handleExport}>
              Export to CSV
            </SecondaryButton>
          )}
        </div>
      </div>

      {/* Action Breakdown */}
      {actionBreakdown.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {actionBreakdown.slice(0, 8).map((item) => (
              <div key={item.action} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{item.count}</div>
                <div className="text-xs text-gray-600">{formatActionName(item.action)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Audit Logs ({logs.length} entries)
          </h3>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No audit logs found matching the current filters
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.user_name || 'System'}
                      <div className="text-xs text-gray-500">@{log.username || 'system'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionBadgeColor(log.action)}`}>
                        {formatActionName(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.resource_type ? (
                        <>
                          <div className="font-medium">{log.resource_type}</div>
                          {log.resource_id && (
                            <div className="text-xs text-gray-500">ID: {log.resource_id}</div>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ip_address || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {log.details ? (
                        <details className="cursor-pointer">
                          <summary className="text-indigo-600 hover:text-indigo-800">
                            View Details
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer with count */}
      {logs.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Showing {logs.length} of {statistics?.total_events?.toLocaleString() || logs.length} total events
          {filters.limit < (statistics?.total_events || 0) && (
            <span className="ml-2 text-indigo-600">
              (increase limit to see more)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default AuditLogViewer;
