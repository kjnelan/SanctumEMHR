import React from 'react';

function TabNavigation({ activeTab, onTabChange, permissions = {} }) {
  // Define all tabs with their required permissions
  const allTabs = [
    { id: 'summary', label: 'Summary', requiresPermission: null },
    { id: 'demographics', label: 'Demographics', requiresPermission: null },
    { id: 'insurance', label: 'Insurance', requiresPermission: null },
    { id: 'encounters', label: 'Sessions', requiresPermission: null, hideForSocialWorker: true },
    { id: 'clinical', label: 'Notes', requiresPermission: 'canAccessNotes' },
    { id: 'documents', label: 'Documents', requiresPermission: null },
    { id: 'billing', label: 'Billing', requiresPermission: null },
    { id: 'admin', label: 'Admin Notes', requiresPermission: null }
  ];

  // Check if user can access notes tab (either clinical notes OR case management notes)
  const canAccessNotes = permissions.canViewClinicalNotes || permissions.canCreateCaseNotes;

  // Filter tabs based on permissions
  const tabs = allTabs.filter(tab => {
    // Hide Sessions tab from social workers
    if (tab.hideForSocialWorker && permissions.isSocialWorker && !permissions.isAdmin) {
      return false;
    }
    // Special handling for notes tab - show if can view clinical OR create case notes
    if (tab.requiresPermission === 'canAccessNotes') {
      return canAccessNotes;
    }
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
