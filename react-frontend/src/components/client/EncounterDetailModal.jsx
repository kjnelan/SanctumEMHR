import React, { useState, useEffect } from 'react';
import { getEncounterDetail } from '../../utils/api';
import { GlassyTabs, GlassyTab } from '../shared/GlassyTabs';

function EncounterDetailModal({ encounterId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('notes');

  useEffect(() => {
    const fetchEncounterDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getEncounterDetail(encounterId);
        setData(result);
      } catch (err) {
        console.error('Error fetching encounter detail:', err);
        setError(err.message || 'Failed to load encounter details');
      } finally {
        setLoading(false);
      }
    };

    if (encounterId) {
      fetchEncounterDetail();
    }
  }, [encounterId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (!encounterId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Encounter Details</h2>
            {data && (
              <p className="text-blue-100 text-sm mt-1">
                {formatDate(data.encounter.date)} • {data.encounter.patient_name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-700 mt-4">Loading encounter details...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="text-red-600 font-semibold">Error: {error}</div>
            </div>
          ) : data ? (
            <div className="p-6">
              {/* Encounter Info Card */}
              <div className="card-main mb-6">
                <h3 className="section-header-gray">Session Information</h3>
                <div className="card-inner">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="form-field">
                      <div className="form-field-label">Date</div>
                      <div className="form-field-value">{formatDate(data.encounter.date)}</div>
                    </div>
                    <div className="form-field">
                      <div className="form-field-label">Provider</div>
                      <div className="form-field-value">{data.encounter.provider_name || 'N/A'}</div>
                    </div>
                    <div className="form-field">
                      <div className="form-field-label">Facility</div>
                      <div className="form-field-value">{data.encounter.facility_name || 'N/A'}</div>
                    </div>
                    <div className="col-span-2 md:col-span-3 form-field">
                      <div className="form-field-label">Reason for Visit</div>
                      <div className="form-field-value">{data.encounter.reason || 'Not specified'}</div>
                    </div>
                    {data.encounter.encounter_type_description && (
                      <div className="form-field">
                        <div className="form-field-label">Encounter Type</div>
                        <div className="form-field-value">{data.encounter.encounter_type_description}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <GlassyTabs className="mb-6">
                <GlassyTab
                  active={activeSection === 'notes'}
                  onClick={() => setActiveSection('notes')}
                >
                  Clinical Notes ({data.forms.length})
                </GlassyTab>
                <GlassyTab
                  active={activeSection === 'billing'}
                  onClick={() => setActiveSection('billing')}
                >
                  Billing ({data.billing.length})
                </GlassyTab>
                <GlassyTab
                  active={activeSection === 'vitals'}
                  onClick={() => setActiveSection('vitals')}
                >
                  Vitals ({data.vitals.length})
                </GlassyTab>
                <GlassyTab
                  active={activeSection === 'diagnoses'}
                  onClick={() => setActiveSection('diagnoses')}
                >
                  Diagnoses ({data.diagnoses.length})
                </GlassyTab>
              </GlassyTabs>

              {/* Tab Content */}
              {activeSection === 'notes' && (
                <div className="space-y-3">
                  {data.forms.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No clinical notes recorded</div>
                  ) : (
                    data.forms.map((form) => (
                      <div key={form.id} className="card-inner">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">{form.form_name || form.formdir}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {formatDate(form.date)} • {form.user_name || 'Unknown user'}
                            </div>
                          </div>
                          {form.authorized === '1' && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                              Authorized
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeSection === 'billing' && (
                <div className="space-y-4">
                  {data.billing.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No billing charges recorded</div>
                  ) : (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-sm font-semibold text-gray-700">Total Charges</div>
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(data.total_charges)}</div>
                      </div>
                      <div className="space-y-2">
                        {data.billing.map((charge) => (
                          <div key={charge.id} className="card-inner">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-semibold text-gray-800">
                                  {charge.code_type}: {charge.code}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">{charge.code_text}</div>
                                {charge.modifier && (
                                  <div className="text-xs text-gray-500 mt-1">Modifier: {charge.modifier}</div>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <div className="font-bold text-gray-800">
                                  {formatCurrency(charge.fee * charge.units)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {charge.units} unit{charge.units !== '1' ? 's' : ''} × {formatCurrency(charge.fee)}
                                </div>
                                {charge.billed === '1' && (
                                  <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                    Billed
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeSection === 'vitals' && (
                <div className="space-y-3">
                  {data.vitals.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No vitals recorded</div>
                  ) : (
                    data.vitals.map((vital) => (
                      <div key={vital.id} className="card-inner">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="col-span-2 md:col-span-4 form-field">
                            <div className="form-field-label">Recorded</div>
                            <div className="form-field-value">
                              {formatDate(vital.date)} • {vital.user_name || 'Unknown user'}
                            </div>
                          </div>
                          {vital.bps && vital.bpd && (
                            <div className="form-field">
                              <div className="form-field-label">Blood Pressure</div>
                              <div className="form-field-value">{vital.bps}/{vital.bpd}</div>
                            </div>
                          )}
                          {vital.pulse && (
                            <div className="form-field">
                              <div className="form-field-label">Pulse</div>
                              <div className="form-field-value">{vital.pulse} bpm</div>
                            </div>
                          )}
                          {vital.temperature && (
                            <div className="form-field">
                              <div className="form-field-label">Temperature</div>
                              <div className="form-field-value">{vital.temperature}°F</div>
                            </div>
                          )}
                          {vital.weight && (
                            <div className="form-field">
                              <div className="form-field-label">Weight</div>
                              <div className="form-field-value">{vital.weight} lbs</div>
                            </div>
                          )}
                          {vital.height && (
                            <div className="form-field">
                              <div className="form-field-label">Height</div>
                              <div className="form-field-value">{vital.height} in</div>
                            </div>
                          )}
                          {vital.BMI && (
                            <div className="form-field">
                              <div className="form-field-label">BMI</div>
                              <div className="form-field-value">{vital.BMI}</div>
                            </div>
                          )}
                          {vital.oxygen_saturation && (
                            <div className="form-field">
                              <div className="form-field-label">O2 Saturation</div>
                              <div className="form-field-value">{vital.oxygen_saturation}%</div>
                            </div>
                          )}
                          {vital.respiration && (
                            <div className="form-field">
                              <div className="form-field-label">Respiration</div>
                              <div className="form-field-value">{vital.respiration} /min</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeSection === 'diagnoses' && (
                <div className="space-y-3">
                  {data.diagnoses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No diagnoses recorded for this encounter</div>
                  ) : (
                    data.diagnoses.map((diagnosis) => (
                      <div key={diagnosis.id} className="card-inner">
                        <div className="font-semibold text-gray-800">{diagnosis.title}</div>
                        {diagnosis.diagnosis && (
                          <div className="text-sm text-gray-600 mt-1">Code: {diagnosis.diagnosis}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          Started: {formatDate(diagnosis.begdate)}
                          {diagnosis.enddate && ` • Ended: ${formatDate(diagnosis.enddate)}`}
                        </div>
                        {diagnosis.outcome && (
                          <div className="text-xs text-gray-500 mt-1">Outcome: {diagnosis.outcome}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default EncounterDetailModal;
