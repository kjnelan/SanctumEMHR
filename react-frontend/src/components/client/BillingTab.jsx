import React, { useState, useEffect, useMemo } from 'react';
import { getBilling } from '../../utils/api';
import EncounterDetailModal from './EncounterDetailModal';
import { ErrorInline } from '../ErrorInline';

function BillingTab({ data }) {
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, billed, unbilled
  const [selectedEncounter, setSelectedEncounter] = useState(null);

  useEffect(() => {
    const fetchBilling = async () => {
      if (!data?.patient?.pid) return;

      try {
        setLoading(true);
        setError(null);
        const result = await getBilling(data.patient.pid);
        setBillingData(result);
      } catch (err) {
        console.error('Error fetching billing:', err);
        setError(err.message || 'Failed to load billing information');
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, [data]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const filteredCharges = useMemo(() => {
    if (!billingData?.charges) return [];

    let filtered = [...billingData.charges];

    if (filter === 'billed') {
      filtered = filtered.filter(charge => charge.billed === '1');
    } else if (filter === 'unbilled') {
      filtered = filtered.filter(charge => charge.billed !== '1');
    }

    return filtered;
  }, [billingData, filter]);

  if (loading) {
    return (
      <div className="text-gray-700 text-center py-8">
        Loading billing information...
      </div>
    );
  }

  if (error) {
    return (
      <ErrorInline>
        Error: {error}
      </ErrorInline>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Summary & Filters */}
        <div className="lg:col-span-1 space-y-6">
          {/* Financial Summary Card */}
          <div className="card-main">
            <h2 className="card-header">Financial Summary</h2>
            <div className="space-y-3">
              <div className="stat-box stat-box-blue">
                <div className="text-gray-600 text-xs font-semibold mb-1">Total Charges</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(billingData?.summary?.total_charges || 0)}
                </div>
              </div>
              <div className="stat-box stat-box-green">
                <div className="text-gray-600 text-xs font-semibold mb-1">Total Payments</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(billingData?.summary?.total_payments || 0)}
                </div>
              </div>
              <div className={`stat-box ${
                (billingData?.summary?.balance || 0) > 0
                  ? 'stat-box-red'
                  : 'stat-box'
              }`}>
                <div className="text-gray-600 text-xs font-semibold mb-1">Balance Due</div>
                <div className={`text-2xl font-bold ${
                  (billingData?.summary?.balance || 0) > 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {formatCurrency(billingData?.summary?.balance || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Filters Card */}
          <div className="card-main">
            <h3 className="section-header">Filter By</h3>
            <div className="space-y-2">
              <button
                onClick={() => setFilter('all')}
                className={`w-full text-left filter-btn-enhanced ${
                  filter === 'all'
                    ? 'filter-btn-active-base bg-blue-500'
                    : 'filter-btn-inactive'
                }`}
              >
                All Charges
              </button>
              <button
                onClick={() => setFilter('unbilled')}
                className={`w-full text-left filter-btn-enhanced ${
                  filter === 'unbilled'
                    ? 'filter-btn-active-base bg-blue-500'
                    : 'filter-btn-inactive'
                }`}
              >
                Unbilled
              </button>
              <button
                onClick={() => setFilter('billed')}
                className={`w-full text-left filter-btn-enhanced ${
                  filter === 'billed'
                    ? 'filter-btn-active-base bg-blue-500'
                    : 'filter-btn-inactive'
                }`}
              >
                Billed
              </button>
            </div>
          </div>

          {/* Payments Summary Card */}
          <div className="card-main">
            <h2 className="card-header">Recent Payments</h2>
            {billingData?.payments && billingData.payments.length > 0 ? (
              <div className="space-y-2">
                {billingData.payments.slice(0, 5).map((payment) => (
                  <div key={payment.session_id} className="stat-box">
                    <div className="font-semibold text-gray-800">{formatCurrency(payment.pay_amount)}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {formatDate(payment.dtime)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {payment.method || 'Payment'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No payments recorded</div>
            )}
          </div>
        </div>

        {/* Right Column - Charges List */}
        <div className="lg:col-span-3">
          <div className="card-main">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Billing Charges
                <span className="ml-2 text-sm font-normal text-gray-600">
                  ({filteredCharges.length} {filteredCharges.length === 1 ? 'charge' : 'charges'})
                </span>
              </h2>
            </div>

            {filteredCharges.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                </svg>
                <p className="text-gray-600 text-lg">No charges found</p>
                <p className="text-gray-500 text-sm mt-2">
                  {filter !== 'all' ? 'Try adjusting your filters' : 'No billing charges recorded'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCharges.map((charge) => (
                  <div
                    key={charge.id}
                    className="card-inner hover:bg-white/90 transition-colors cursor-pointer"
                    onClick={() => setSelectedEncounter(charge.encounter)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-bold text-gray-800">
                            {charge.code_type}: {charge.code}
                          </div>
                          {charge.billed === '1' ? (
                            <span className="badge-sm badge-light-success">
                              Billed
                            </span>
                          ) : (
                            <span className="badge-sm badge-light-warning">
                              Unbilled
                            </span>
                          )}
                          {charge.authorized === '1' && (
                            <span className="badge-sm badge-light-info">
                              Authorized
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-700 mb-2">
                          {charge.code_text}
                        </div>

                        {charge.encounter_reason && (
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-semibold">Encounter:</span> {charge.encounter_reason}
                          </div>
                        )}

                        <div className="flex gap-6 text-xs text-gray-500">
                          <div>
                            <span className="font-semibold">Date:</span> {formatDate(charge.encounter_date)}
                          </div>
                          {charge.provider_name && (
                            <div>
                              <span className="font-semibold">Provider:</span> {charge.provider_name}
                            </div>
                          )}
                          {charge.facility_name && (
                            <div>
                              <span className="font-semibold">Facility:</span> {charge.facility_name}
                            </div>
                          )}
                          {charge.modifier && (
                            <div>
                              <span className="font-semibold">Modifier:</span> {charge.modifier}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-4 text-right">
                        <div className="font-bold text-gray-800 text-lg">
                          {formatCurrency(parseFloat(charge.fee) * parseFloat(charge.units))}
                        </div>
                        <div className="text-xs text-gray-500">
                          {charge.units} unit{charge.units !== '1' ? 's' : ''} × {formatCurrency(charge.fee)}
                        </div>
                        <button className="mt-2 btn-mini">
                          View Encounter
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Encounter Detail Modal */}
      {selectedEncounter && (
        <EncounterDetailModal
          encounterId={selectedEncounter}
          onClose={() => setSelectedEncounter(null)}
        />
      )}
    </>
  );
}

export default BillingTab;
