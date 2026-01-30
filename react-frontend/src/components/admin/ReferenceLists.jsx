/**
 * SanctumEMHR EMHR
 * Reference Lists - Tabbed interface for managing all clinical lookup lists
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import { useState } from 'react';
import ReferenceListManager from './ReferenceListManager';
import { GlassyTabs, GlassyTab } from '../shared/GlassyTabs';

function ReferenceLists() {
  const [activeList, setActiveList] = useState('sexual-orientation');

  const listTypes = [
    {
      id: 'sexual-orientation',
      label: 'Sexual Orientation',
      title: 'Sexual Orientations',
      description: 'Manage sexual orientation options for client demographics'
    },
    {
      id: 'gender-identity',
      label: 'Gender Identity',
      title: 'Gender Identities',
      description: 'Manage gender identity options for client demographics'
    },
    {
      id: 'pronouns',
      label: 'Pronouns',
      title: 'Pronouns',
      description: 'Manage pronoun options for client demographics'
    },
    {
      id: 'marital-status',
      label: 'Marital Status',
      title: 'Marital Statuses',
      description: 'Manage marital status options for client demographics'
    },
    {
      id: 'client-status',
      label: 'Client Status',
      title: 'Client Statuses',
      description: 'Manage client status options (Active, Discharged, etc.)'
    },
    {
      id: 'ethnicity',
      label: 'Ethnicity/Race',
      title: 'Ethnicity/Race Options',
      description: 'Manage ethnicity and race options for client demographics'
    },
    {
      id: 'insurance-type',
      label: 'Insurance Types',
      title: 'Insurance Types',
      description: 'Manage insurance type categories'
    },
    {
      id: 'referral-source',
      label: 'Referral Sources',
      title: 'Referral Sources',
      description: 'Manage referral source options for client intake'
    },
    {
      id: 'treatment-modality',
      label: 'Treatment Modalities',
      title: 'Treatment Modalities',
      description: 'Manage treatment modality options (CBT, DBT, etc.)'
    },
    {
      id: 'discharge-reason',
      label: 'Discharge Reasons',
      title: 'Discharge Reasons',
      description: 'Manage discharge reason options for client records'
    }
  ];

  const activeListConfig = listTypes.find(list => list.id === activeList);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="glass-card p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reference Lists</h1>
        <p className="text-gray-600 mt-2">Manage clinical and demographic lookup lists</p>
      </div>

      {/* Tab Navigation */}
      <GlassyTabs className="mb-6">
        {listTypes.map(list => (
          <GlassyTab
            key={list.id}
            active={activeList === list.id}
            onClick={() => setActiveList(list.id)}
          >
            {list.label}
          </GlassyTab>
        ))}
      </GlassyTabs>

      {/* Active List Manager */}
      {activeListConfig && (
        <ReferenceListManager
          key={activeList}
          listType={activeList}
          title={activeListConfig.title}
          description={activeListConfig.description}
          apiEndpoint="/custom/api/reference_lists.php"
        />
      )}
    </div>
  );
}

export default ReferenceLists;
