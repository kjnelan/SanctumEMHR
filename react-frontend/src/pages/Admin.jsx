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
import CalendarCategories from '../components/admin/CalendarCategories';
import DocumentCategories from '../components/settings/DocumentCategories';
import ReferenceLists from '../components/admin/ReferenceLists';
import UserManagement from '../components/admin/UserManagement';
import Facilities from '../components/admin/Facilities';
import SecuritySettings from '../components/admin/SecuritySettings';
import About from '../components/admin/About';

function Admin() {
  const [activeSection, setActiveSection] = useState('calendar-settings');
  // Start with all groups collapsed
  const [collapsedGroups, setCollapsedGroups] = useState({
    system: true,
    clinical: true,
    scheduling: true,
    billing: true,
    communications: true,
    organization: true
  });

  const sectionGroups = [
    {
      id: 'system',
      label: 'System',
      icon: '⚙️',
      sections: [
        { id: 'security', label: 'Security', available: true },
        { id: 'appearance', label: 'Appearance', available: false },
        { id: 'features', label: 'Features', available: false },
      ]
    },
    {
      id: 'clinical',
      label: 'Clinical Data',
      icon: '🏥',
      sections: [
        { id: 'reference-lists', label: 'Reference Lists', available: true },
        { id: 'document-categories', label: 'Document Categories', available: true },
      ]
    },
    {
      id: 'scheduling',
      label: 'Scheduling',
      icon: '📅',
      sections: [
        { id: 'calendar-settings', label: 'Calendar Settings', available: true },
        { id: 'calendar-categories', label: 'Calendar Categories', available: true },
      ]
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: '💰',
      sections: [
        { id: 'billing-settings', label: 'Billing Settings', available: false },
        { id: 'payment-methods', label: 'Payment Methods', available: false },
      ]
    },
    {
      id: 'communications',
      label: 'Communications',
      icon: '💬',
      sections: [
        { id: 'sms-settings', label: 'SMS Settings', available: false },
        { id: 'email-settings', label: 'Email Settings', available: false },
      ]
    },
    {
      id: 'organization',
      label: 'Organization',
      icon: '🏢',
      sections: [
        { id: 'facilities', label: 'Facilities', available: true },
        { id: 'users', label: 'Users', available: true },
      ]
    }
  ];

  const toggleGroup = (groupId) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="glass-card p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-600 mt-2">Manage system configuration and preferences</p>
      </div>

      {/* Main Content: Sidebar + Settings Panel */}
      <div className="flex gap-6">
        {/* Left Sidebar Navigation */}
        <div className="w-72 flex-shrink-0">
          <div className="glass-card p-4">
            <nav className="space-y-1">
              {/* Collapsible Groups */}
              {sectionGroups.map(group => (
                <div key={group.id}>
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-gray-700 font-semibold text-sm hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span>{group.icon}</span>
                      <span>{group.label}</span>
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${collapsedGroups[group.id] ? '' : 'rotate-90'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Group Sections */}
                  {!collapsedGroups[group.id] && (
                    <div className="ml-4 mt-1 space-y-1">
                      {group.sections.map(section => (
                        <button
                          key={section.id}
                          onClick={() => section.available && setActiveSection(section.id)}
                          disabled={!section.available}
                          className={`w-full text-left px-4 py-2 rounded-lg transition-colors text-sm ${
                            activeSection === section.id
                              ? 'bg-blue-600 text-white font-medium'
                              : section.available
                              ? 'hover:bg-gray-100 text-gray-700'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {section.label}
                          {!section.available && (
                            <span className="text-xs ml-2">(Soon)</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Separator */}
              <div className="border-t border-gray-200 my-2"></div>

              {/* About - Standalone Item */}
              <button
                onClick={() => setActiveSection('about')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm flex items-center gap-2 ${
                  activeSection === 'about'
                    ? 'bg-blue-600 text-white font-medium'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span>ℹ️</span>
                <span>About</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Settings Panel */}
        <div className="flex-1">
          {activeSection === 'security' && <SecuritySettings />}
          {activeSection === 'calendar-settings' && <CalendarSettings />}
          {activeSection === 'calendar-categories' && <CalendarCategories />}
          {activeSection === 'reference-lists' && <ReferenceLists />}
          {activeSection === 'document-categories' && <DocumentCategories />}
          {activeSection === 'facilities' && <Facilities />}
          {activeSection === 'users' && <UserManagement />}
          {activeSection === 'about' && <About />}

          {/* Coming Soon for unavailable sections */}
          {!['security', 'calendar-settings', 'calendar-categories', 'reference-lists', 'document-categories', 'facilities', 'users', 'about'].includes(activeSection) && (
            <div className="glass-card p-12 text-center">
              <div className="text-gray-700 text-lg font-semibold">
                {sectionGroups.flatMap(g => g.sections).find(s => s.id === activeSection)?.label}
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
