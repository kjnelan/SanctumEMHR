import React from 'react';

function TabNavigation({ activeTab, onTabChange, permissions = {} }) {
  // Define all tabs with their required permissions
  const allTabs = [
    { id: 'summary', label: 'Summary', requiresPermission: null },
    { id: 'demographics', label: 'Demographics', requiresPermission: null },
    { id: 'insurance', label: 'Insurance', requiresPermission: null },
    { id: 'encounters', label: 'Sessions', requiresPermission: null },
    { id: 'clinical', label: 'Clinical Notes', requiresPermission: 'canViewClinicalNotes' },
    { id: 'documents', label: 'Documents', requiresPermission: null },
    { id: 'billing', label: 'Billing', requiresPermission: null },
    { id: 'admin', label: 'Admin Notes', requiresPermission: null }
  ];

  // Filter tabs based on permissions
  const tabs = allTabs.filter(tab => {
    if (!tab.requiresPermission) return true;
    return permissions[tab.requiresPermission] !== false;
  });

  return (
    <div className="tab-nav mb-6">
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={activeTab === tab.id ? 'nav-tab-active' : 'nav-tab-inactive'}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TabNavigation;
