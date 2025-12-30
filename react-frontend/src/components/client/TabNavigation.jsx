import React from 'react';

function TabNavigation({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'demographics', label: 'Demographics' },
    { id: 'insurance', label: 'Insurance' },
    { id: 'encounters', label: 'Encounters' },
    { id: 'clinical', label: 'Clinical' },
    { id: 'documents', label: 'Documents' },
    { id: 'billing', label: 'Billing' },
    { id: 'admin', label: 'Admin Notes' }
  ];

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
