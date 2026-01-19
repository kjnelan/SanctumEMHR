import React from 'react';

const RISK_OPTIONS = [
  { id: 'si_sa', label: 'SI/SA', description: 'Suicidal Ideation/Suicide Attempt', color: 'red' },
  { id: 'hi_ha', label: 'HI/HA', description: 'Homicidal Ideation/Homicidal Attempt', color: 'red' },
  { id: 'nssi', label: 'NSSI', description: 'Non-Suicidal Self-Injury', color: 'orange' },
  { id: 'psychosis', label: 'Psychosis', description: 'Psychotic symptoms', color: 'purple' },
  { id: 'aoda', label: 'AODA', description: 'Alcohol and Other Drug Abuse', color: 'amber' },
  { id: 'impaired_judgment', label: 'Impaired Judgment', description: 'Difficulty making safe decisions', color: 'yellow' },
  { id: 'no_risk', label: 'No Risk Factors', description: 'Client is not at elevated risk', color: 'green' }
];

function RiskIndicators({ selectedRisks = [], onChange, isEditing = false }) {
  const handleToggle = (riskId) => {
    if (!isEditing) return;

    let newSelection = [...selectedRisks];

    // If "No Risk" is selected, clear everything else
    if (riskId === 'no_risk') {
      newSelection = newSelection.includes('no_risk') ? [] : ['no_risk'];
    } else {
      // If selecting a risk factor, remove "No Risk"
      newSelection = newSelection.filter(id => id !== 'no_risk');

      // Toggle the selected risk
      if (newSelection.includes(riskId)) {
        newSelection = newSelection.filter(id => id !== riskId);
      } else {
        newSelection.push(riskId);
      }
    }

    onChange(newSelection);
  };

  const hasHighRisk = selectedRisks.some(id => ['si_sa', 'hi_ha'].includes(id));
  const hasModerateRisk = selectedRisks.some(id => ['nssi', 'psychosis', 'aoda', 'impaired_judgment'].includes(id));
  const hasNoRisk = selectedRisks.includes('no_risk') || selectedRisks.length === 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {RISK_OPTIONS.map(risk => {
          const isSelected = selectedRisks.includes(risk.id);
          const colorClasses = {
            red: isSelected ? 'bg-red-100 border-red-400 text-red-900' : 'bg-white border-gray-300 text-gray-700',
            orange: isSelected ? 'bg-orange-100 border-orange-400 text-orange-900' : 'bg-white border-gray-300 text-gray-700',
            purple: isSelected ? 'bg-purple-100 border-purple-400 text-purple-900' : 'bg-white border-gray-300 text-gray-700',
            amber: isSelected ? 'bg-amber-100 border-amber-400 text-amber-900' : 'bg-white border-gray-300 text-gray-700',
            yellow: isSelected ? 'bg-yellow-100 border-yellow-400 text-yellow-900' : 'bg-white border-gray-300 text-gray-700',
            green: isSelected ? 'bg-green-100 border-green-400 text-green-900' : 'bg-white border-gray-300 text-gray-700'
          };

          return (
            <label
              key={risk.id}
              className={`flex items-start p-3 border-2 rounded-lg transition-all cursor-pointer ${colorClasses[risk.color]} ${
                isEditing ? 'hover:shadow-md' : 'cursor-default'
              } ${isSelected ? 'ring-2 ring-offset-2' : ''}`}
              style={{
                ringColor: isSelected ? `var(--color-${risk.color}-500)` : 'transparent'
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(risk.id)}
                disabled={!isEditing}
                className="mt-1 mr-3 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <div className="flex-1">
                <div className="font-semibold text-sm">{risk.label}</div>
                <div className="text-xs opacity-75 mt-0.5">{risk.description}</div>
              </div>
            </label>
          );
        })}
      </div>

      {/* Risk Summary Alert */}
      {!isEditing && selectedRisks.length > 0 && !hasNoRisk && (
        <div className={`rounded-lg p-4 ${
          hasHighRisk ? 'bg-red-50 border-l-4 border-red-500' :
          hasModerateRisk ? 'bg-yellow-50 border-l-4 border-yellow-500' :
          'bg-gray-50 border-l-4 border-gray-400'
        }`}>
          <div className="flex items-start">
            <span className="text-2xl mr-3">
              {hasHighRisk ? '🚨' : hasModerateRisk ? '⚠️' : 'ℹ️'}
            </span>
            <div>
              <p className={`font-semibold ${
                hasHighRisk ? 'text-red-900' :
                hasModerateRisk ? 'text-yellow-900' :
                'text-gray-900'
              }`}>
                {hasHighRisk ? 'High Risk - Immediate Attention Required' :
                 hasModerateRisk ? 'Moderate Risk - Monitor Closely' :
                 'Risk Factors Documented'}
              </p>
              <p className={`text-sm mt-1 ${
                hasHighRisk ? 'text-red-800' :
                hasModerateRisk ? 'text-yellow-800' :
                'text-gray-700'
              }`}>
                See Clinical Notes for the Risk Assessment and safety planning documentation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RiskIndicators;
