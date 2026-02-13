/**
 * SanctumEMHR EMHR
 * Reports - Analytics and reporting dashboard
 *
 * Author: Kenneth J. Nelan
 * License: Proprietary and Confidential
 * Version: ALPHA
 *
 * Copyright © 2026 Sacred Wandering
 * Proprietary and Confidential
 */

import { useState, useEffect } from 'react';
import { Calendar, FileText, Users, TrendingUp, UserPlus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getClientDemographics, getAllReports } from '../services/ReportService';

function Reports() {
  const [demographics, setDemographics] = useState({
    age: [],
    gender: [],
    race: [],
    ethnicity: []
  });
  const [reportData, setReportData] = useState(null);
  const [demographicsLoading, setDemographicsLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // Days

  // Calculate date range
  const getDateRange = () => {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    return { startDate, endDate };
  };

  // Fetch demographics on component mount
  useEffect(() => {
    const fetchDemographics = async () => {
      try {
        const demographicsData = await getClientDemographics();
        setDemographics(demographicsData);
      } catch (err) {
        console.error('Failed to fetch demographics:', err);
      } finally {
        setDemographicsLoading(false);
      }
    };

    fetchDemographics();
  }, []);

  // Fetch report data when date range changes
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setReportsLoading(true);
        const { startDate, endDate } = getDateRange();
        const data = await getAllReports(startDate, endDate);
        setReportData(data);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      } finally {
        setReportsLoading(false);
      }
    };

    fetchReports();
  }, [dateRange]);

  const renderDemographicBar = (data, title) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-gray-500 text-sm text-center py-4">No data available</div>
      );
    }

    const total = data.reduce((sum, item) => sum + item.count, 0);

    return (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
        <div className="space-y-2">
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.count / total) * 100 : 0;
            return (
              <div key={index}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">{item.category}</span>
                  <span className="text-gray-500 font-semibold">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStatCard = (icon, label, value, color = 'blue', subtext = null) => {
    const Icon = icon;
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      red: 'bg-red-50 text-red-600',
      purple: 'bg-purple-50 text-purple-600'
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
            {subtext && <div className="text-xs text-gray-400">{subtext}</div>}
          </div>
        </div>
      </div>
    );
  };

  const renderBarChart = (data, labelKey, valueKey, color = 'blue') => {
    if (!data || data.length === 0) {
      return <div className="text-gray-500 text-sm text-center py-4">No data available</div>;
    }

    const maxValue = Math.max(...data.map(item => item[valueKey]));

    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      yellow: 'bg-yellow-500'
    };

    return (
      <div className="space-y-2">
        {data.slice(0, 8).map((item, index) => {
          const percentage = maxValue > 0 ? (item[valueKey] / maxValue) * 100 : 0;
          return (
            <div key={index}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600 truncate max-w-[70%]">
                  {item[labelKey]}
                </span>
                <span className="text-gray-700 font-semibold">{item[valueKey]}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${colorClasses[color]} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="h-3 bg-gray-300 rounded w-20 mb-2"></div>
          <div className="h-2 bg-gray-300 rounded"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header with Date Range Selector */}
      <div className="card-main">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Reports</h2>
            <p className="text-gray-600 text-xs">Analytics and insights for your practice</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Date Range:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input-field py-1.5 px-3 text-sm w-auto"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="180">Last 6 months</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      {!reportsLoading && reportData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {renderStatCard(
            Calendar,
            'Appointments',
            reportData.appointments?.totals?.scheduled +
            reportData.appointments?.totals?.completed || 0,
            'blue'
          )}
          {renderStatCard(
            CheckCircle,
            'Completed',
            reportData.appointments?.totals?.completed || 0,
            'green'
          )}
          {renderStatCard(
            FileText,
            'Notes Created',
            reportData.notes?.totals?.total || 0,
            'purple'
          )}
          {renderStatCard(
            UserPlus,
            'New Clients',
            reportData.clientFlow?.newClients || 0,
            'yellow'
          )}
        </div>
      )}

      {/* Main Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Statistics */}
        <div className="card-main">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-700">Appointment Statistics</h3>
          </div>
          {reportsLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="space-y-6">
              {/* Status Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-700">
                    {reportData?.appointments?.totals?.completed || 0}
                  </div>
                  <div className="text-xs text-green-600">Completed</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-yellow-700">
                    {reportData?.appointments?.totals?.scheduled || 0}
                  </div>
                  <div className="text-xs text-yellow-600">Scheduled</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-red-700">
                    {reportData?.appointments?.totals?.noShow || 0}
                  </div>
                  <div className="text-xs text-red-600">No Shows</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-gray-700">
                    {reportData?.appointments?.totals?.cancelled || 0}
                  </div>
                  <div className="text-xs text-gray-600">Cancelled</div>
                </div>
              </div>

              {/* By Category */}
              {reportData?.appointments?.byCategory?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">By Type</h4>
                  {renderBarChart(reportData.appointments.byCategory, 'category', 'count', 'blue')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Clinical Notes Statistics */}
        <div className="card-main">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-bold text-gray-700">Clinical Notes</h3>
          </div>
          {reportsLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="space-y-6">
              {/* Status Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-purple-700">
                    {reportData?.notes?.totals?.total || 0}
                  </div>
                  <div className="text-xs text-purple-600">Total</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-700">
                    {reportData?.notes?.totals?.signed || 0}
                  </div>
                  <div className="text-xs text-green-600">Signed</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-yellow-700">
                    {reportData?.notes?.totals?.unsigned || 0}
                  </div>
                  <div className="text-xs text-yellow-600">Unsigned</div>
                </div>
              </div>

              {/* Pending Review Alert */}
              {reportData?.notes?.totals?.pendingReview > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="text-sm font-medium text-orange-800">
                      {reportData.notes.totals.pendingReview} notes pending supervisor review
                    </div>
                  </div>
                </div>
              )}

              {/* By Type */}
              {reportData?.notes?.byType?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">By Type</h4>
                  {renderBarChart(reportData.notes.byType, 'label', 'count', 'purple')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Provider Productivity */}
        <div className="card-main">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-bold text-gray-700">Provider Activity</h3>
          </div>
          {reportsLoading ? (
            <LoadingSkeleton />
          ) : reportData?.productivity?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-xs font-semibold text-gray-600">Provider</th>
                    <th className="text-center py-2 text-xs font-semibold text-gray-600">Appts</th>
                    <th className="text-center py-2 text-xs font-semibold text-gray-600">Notes</th>
                    <th className="text-center py-2 text-xs font-semibold text-gray-600">Unsigned</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.productivity.slice(0, 10).map((provider, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2">
                        <div className="font-medium text-gray-800">{provider.provider}</div>
                        {provider.title && (
                          <div className="text-xs text-gray-500">{provider.title}</div>
                        )}
                      </td>
                      <td className="text-center py-2">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {provider.appointments}
                        </span>
                      </td>
                      <td className="text-center py-2">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {provider.notes}
                        </span>
                      </td>
                      <td className="text-center py-2">
                        {provider.unsignedNotes > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                            {provider.unsignedNotes}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500 text-sm text-center py-4">No provider data available</div>
          )}
        </div>

        {/* Client Flow */}
        <div className="card-main">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-yellow-600" />
            <h3 className="text-sm font-bold text-gray-700">Client Activity</h3>
          </div>
          {reportsLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-700">
                    {reportData?.clientFlow?.activeClients || 0}
                  </div>
                  <div className="text-xs text-blue-600">Active Clients</div>
                  <div className="text-xs text-blue-400">with activity in period</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-700">
                    {reportData?.clientFlow?.newClients || 0}
                  </div>
                  <div className="text-xs text-green-600">New Clients</div>
                  <div className="text-xs text-green-400">added in period</div>
                </div>
              </div>

              {/* New Clients by Month */}
              {reportData?.clientFlow?.byMonth?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">New Clients by Month</h4>
                  {renderBarChart(reportData.clientFlow.byMonth, 'month', 'count', 'green')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Demographics Section */}
      <div className="card-main">
        <h3 className="text-sm font-bold text-gray-700 mb-4">Active Client Demographics</h3>
        {demographicsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>{renderDemographicBar(demographics.age, 'Age Range')}</div>
            <div>{renderDemographicBar(demographics.gender, 'Gender')}</div>
            <div>{renderDemographicBar(demographics.race, 'Race')}</div>
            <div>{renderDemographicBar(demographics.ethnicity, 'Ethnicity')}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
