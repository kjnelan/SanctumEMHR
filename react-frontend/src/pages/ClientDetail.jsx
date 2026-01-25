import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getClientDetail, logout } from '../utils/api';
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
  const { user, loading: authLoading } = useAuth();
  const [clientData, setClientData] = useState(null);
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
      console.log('Fetching client data for ID:', id);
      const data = await getClientDetail(id);
      console.log('Client data received:', data);
      setClientData(data);
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
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      {renderTabContent()}
    </AppShell>
  );
}

export default ClientDetail;
