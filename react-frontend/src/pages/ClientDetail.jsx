import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClientDetail } from '../services/ClientService';
import { logout } from '../services/AuthService';
import { useAuth } from '../hooks/useAuth';
import { ErrorInline } from '../components/ErrorInline';
import AppShell from '../components/layout/AppShell';
import ClientHeader from '../components/client/ClientHeader';
import TabNavigation from '../components/client/TabNavigation';
import SummaryTab from '../components/client/SummaryTab';
import DemographicsTab from '../components/client/DemographicsTab';
import AdminNotesTab from '../components/client/AdminNotesTab';
import InsuranceTab from '../components/client/InsuranceTab';
import EncountersTab from '../components/client/EncountersTab';
import ClinicalNotesTab from '../components/client/ClinicalNotesTab';
import BillingTab from '../components/client/BillingTab';
import DocumentsTab from '../components/client/DocumentsTab';
import ComingSoon from './ComingSoon';

function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [clientData, setClientData] = useState(null);
  const [accessInfo, setAccessInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [activeNav, setActiveNav] = useState('clients');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleLogout = async () => {
    await logout();
  };

  const fetchClientData = async () => {
    try {
      setLoading(true);
      setError(null);
      setAccessInfo(null);
      console.log('Fetching client data for ID:', id);
      const data = await getClientDetail(id);
      console.log('Client data received:', data);

      // Check if access was denied (client not on caseload)
      if (data.accessDenied) {
        setAccessInfo(data.accessInfo);
        setClientData(null);
      } else {
        setClientData(data);
      }
    } catch (err) {
      console.error('Error fetching client data:', err);
      setError(err.message || 'Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchClientData();
    }
  }, [id]);

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="card-main p-12 text-center">
          <div className="text-gray-700">Loading client data...</div>
        </div>
      );
    }

    // Show info box when client is not on user's caseload
    if (accessInfo) {
      return (
        <div className="card-main p-8">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-2xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  {accessInfo.title || 'Client Not on Your Caseload'}
                </h3>
                <p className="text-blue-800 mb-4">
                  {accessInfo.message || 'This client is not currently on your caseload. If you need access to work with this client, please contact your supervisor or an administrator to be added to their care team.'}
                </p>
                <button
                  onClick={() => navigate('/app/clients')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  {accessInfo.actionText || 'Return to Client List'}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="card-main p-12 text-center">
          <ErrorInline>Error: {error}</ErrorInline>
        </div>
      );
    }

    switch (activeTab) {
      case 'summary':
        return <SummaryTab data={clientData} />;
      case 'demographics':
        return <DemographicsTab data={clientData} onDataUpdate={fetchClientData} />;
      case 'insurance':
        return <InsuranceTab data={clientData} />;
      case 'encounters':
        return <EncountersTab data={clientData} />;
      case 'clinical':
        return <ClinicalNotesTab data={clientData} />;
      case 'documents':
        return <DocumentsTab data={clientData} />;
      case 'billing':
        return <BillingTab data={clientData} />;
      case 'admin':
        return <AdminNotesTab data={clientData} />;
      default:
        return <ComingSoon tabName="This Tab" />;
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-mental">
        <div className="backdrop-blur-2xl bg-white/90 rounded-3xl shadow-2xl p-8 border border-white/50">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-label mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      user={user}
      activeNav={activeNav}
      setActiveNav={setActiveNav}
      today={today}
      onLogout={handleLogout}
    >
      <ClientHeader client={clientData?.patient} />
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        permissions={clientData?.permissions || {}}
      />
      {renderTabContent()}
    </AppShell>
  );
}

export default ClientDetail;
