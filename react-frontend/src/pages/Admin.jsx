/**
 * Mindline EMHR
 * Admin/Settings page - System configuration and preferences
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import { useState } from 'react';
import CalendarSettings from '../components/admin/CalendarSettings';
import DocumentCategories from '../components/settings/DocumentCategories';
import UserManagement from '../components/admin/UserManagement';
import Facilities from '../components/admin/Facilities';
import About from '../components/admin/About';

function Admin() {
  const [activeSection, setActiveSection] = useState('calendar');

  const sections = [
    { id: 'appearance', label: 'Appearance', available: false },
    { id: 'branding', label: 'Branding', available: false },
    { id: 'calendar', label: 'Calendar', available: true },
    { id: 'document-categories', label: 'Document Categories', available: true },
    { id: 'features', label: 'Features', available: false },
    { id: 'facilities', label: 'Facilities', available: true },
    { id: 'users', label: 'Users', available: true },
    { id: 'security', label: 'Security', available: false },
    { id: 'about', label: 'About', available: true },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="glass-card p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage system configuration and preferences</p>
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
          {activeSection === 'calendar' && <CalendarSettings />}
          {activeSection === 'document-categories' && <DocumentCategories />}
          {activeSection === 'facilities' && <Facilities />}
          {activeSection === 'users' && <UserManagement />}
          {activeSection === 'about' && <About />}

          {activeSection !== 'calendar' && activeSection !== 'document-categories' && activeSection !== 'facilities' && activeSection !== 'users' && activeSection !== 'about' && (
            <div className="glass-card p-12 text-center">
              <div className="text-gray-700 text-lg font-semibold">
                {sections.find(s => s.id === activeSection)?.label} Settings
              </div>
              <p className="text-gray-600 mt-2">This section is coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;
