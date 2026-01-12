/**
 * Mindline EMHR
 * User Settings page - Personal preferences and calendar availability
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import { useState } from 'react';
import CalendarAvailability from '../components/settings/CalendarAvailability';

function Settings() {
  const [activeSection, setActiveSection] = useState('availability');

  const sections = [
    { id: 'profile', label: 'My Profile', available: false },
    { id: 'preferences', label: 'Preferences', available: false },
    { id: 'calendar-settings', label: 'Calendar Settings', available: false },
    { id: 'availability', label: 'Calendar Availability', available: true },
    { id: 'notifications', label: 'Notifications', available: false },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="glass-card p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Settings</h1>
        <p className="text-gray-600 mt-2">Manage your personal preferences and availability</p>
      </div>

      {/* Main Content: Sidebar + Settings Panel */}
      <div className="flex gap-6">
        {/* Left Sidebar Navigation */}
        <div className="w-64 flex-shrink-0">
          <div className="glass-card p-4">
            <nav className="space-y-1">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => section.available && setActiveSection(section.id)}
                  disabled={!section.available}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-600 text-white font-medium'
                      : section.available
                      ? 'hover:bg-gray-100 text-gray-700'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {section.label}
                  {!section.available && (
                    <span className="text-xs ml-2">(Coming Soon)</span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Settings Panel */}
        <div className="flex-1">
          {activeSection === 'availability' && <CalendarAvailability />}

          {activeSection !== 'availability' && (
            <div className="glass-card p-12 text-center">
              <div className="text-gray-700 text-lg font-semibold">
                {sections.find(s => s.id === activeSection)?.label}
              </div>
              <p className="text-gray-600 mt-2">This section is coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
