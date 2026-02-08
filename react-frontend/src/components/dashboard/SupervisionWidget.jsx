/**
 * SanctumEMHR EMHR
 * SupervisionWidget - Shows supervision relationships
 * - For supervisors: Shows their supervisees
 * - For everyone: Shows their supervisor(s)
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React, { useState, useEffect } from 'react';
import { Users, UserCheck } from 'lucide-react';
import { getSupervisees } from '../../utils/api';

function SupervisionWidget({ userId, isSupervisor }) {
  const [supervisees, setSupervisees] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchSupervisionData();
    }
  }, [userId]);

  const fetchSupervisionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch supervisees if user is a supervisor
      if (isSupervisor) {
        const superviseesResponse = await getSupervisees(userId);
        setSupervisees(superviseesResponse.supervisees || []);
      }

      // Fetch supervisors for this user (everyone can have supervisors)
      const supervisorsResponse = await fetch(`/custom/api/users.php?action=user_supervisors&id=${userId}`, {
        credentials: 'include'
      });

      if (supervisorsResponse.ok) {
        const supervisorsResult = await supervisorsResponse.json();
        setSupervisors(supervisorsResult.supervisors || []);
      }

    } catch (err) {
      console.error('Error fetching supervision data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Don't show widget if there's nothing to display
  if (!loading && supervisees.length === 0 && supervisors.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="text-center text-gray-500 py-4">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6">
        <div className="text-center text-red-500 py-4">Failed to load supervision info</div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* My Supervisees Section - Only for supervisors */}
      {isSupervisor && supervisees.length > 0 && (
        <div className={supervisors.length > 0 ? 'pb-4 border-b border-gray-200 mb-4' : ''}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">My Supervisees</h3>
            </div>
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
              {supervisees.length}
            </span>
          </div>

          <div className="space-y-2">
            {supervisees.map(supervisee => (
              <div
                key={supervisee.id}
                className="flex items-center gap-3 p-2 bg-purple-50 rounded-lg"
              >
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {supervisee.firstName?.charAt(0)}{supervisee.lastName?.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-sm">
                    {supervisee.label || `${supervisee.firstName} ${supervisee.lastName}`}
                    {supervisee.title && (
                      <span className="text-gray-500 font-normal ml-1">({supervisee.title})</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Supervisor(s) Section - For everyone who has supervisors */}
      {supervisors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                My Supervisor{supervisors.length > 1 ? 's' : ''}
              </h3>
            </div>
          </div>

          <div className="space-y-2">
            {supervisors.map(supervisor => (
              <div
                key={supervisor.id}
                className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {supervisor.fname?.charAt(0)}{supervisor.lname?.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-sm">
                    {supervisor.fname} {supervisor.lname}
                    {supervisor.title && (
                      <span className="text-gray-500 font-normal ml-1">({supervisor.title})</span>
                    )}
                  </div>
                  {(supervisor.email || supervisor.phonecell || supervisor.phone) && (
                    <div className="text-xs text-gray-500">
                      {supervisor.email || supervisor.phonecell || supervisor.phone}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SupervisionWidget;
