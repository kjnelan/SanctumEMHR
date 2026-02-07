/**
 * SanctumEMHR EMHR
 * SuperviseesWidget - Shows supervisors their supervisees
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { getSupervisees } from '../../utils/api';

function SuperviseesWidget({ supervisorId }) {
  const [supervisees, setSupervisees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (supervisorId) {
      fetchSupervisees();
    }
  }, [supervisorId]);

  const fetchSupervisees = async () => {
    try {
      setLoading(true);
      const response = await getSupervisees(supervisorId);
      setSupervisees(response.supervisees || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching supervisees:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">My Supervisees</h3>
        </div>
        <div className="text-center text-gray-500 py-4">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">My Supervisees</h3>
        </div>
        <div className="text-center text-red-500 py-4">Failed to load supervisees</div>
      </div>
    );
  }

  if (supervisees.length === 0) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">My Supervisees</h3>
        </div>
        <div className="text-center text-gray-500 py-4">
          No supervisees assigned yet
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">My Supervisees</h3>
        </div>
        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
          {supervisees.length}
        </span>
      </div>

      <div className="space-y-3">
        {supervisees.map(supervisee => (
          <div
            key={supervisee.id}
            className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {supervisee.fname?.charAt(0)}{supervisee.lname?.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-800">
                {supervisee.fname} {supervisee.lname}
                {supervisee.title && (
                  <span className="text-gray-500 font-normal ml-1">({supervisee.title})</span>
                )}
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-3">
                {supervisee.email && <span>{supervisee.email}</span>}
              </div>
            </div>
            {/* Status indicators */}
            <div className="flex gap-2">
              {supervisee.is_provider === '1' && (
                <span className="badge-outline-success text-xs">Provider</span>
              )}
              {supervisee.is_social_worker === '1' && (
                <span className="badge-outline-purple text-xs">Social Worker</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SuperviseesWidget;
