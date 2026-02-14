import React, { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';

// Lazy load specific sub-pages
const ClientDetail = lazy(() => import('./pages/ClientDetail'));
const ICD10Import = lazy(() => import('./pages/ICD10Import'));

// Lazy load portal pages (completely separate from staff app)
const PortalLogin = lazy(() => import('./pages/portal/PortalLogin'));
const PortalChangePassword = lazy(() => import('./pages/portal/PortalChangePassword'));
const PortalDashboard = lazy(() => import('./pages/portal/PortalDashboard'));
const PortalAppointments = lazy(() => import('./pages/portal/PortalAppointments'));
const PortalMessages = lazy(() => import('./pages/portal/PortalMessages'));
const PortalProfile = lazy(() => import('./pages/portal/PortalProfile'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
        <Routes>
          {/* Staff Application */}
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/admin/icd10-import" element={<ICD10Import />} />

          {/* Client Portal (/mycare) */}
          <Route path="/mycare/login" element={<PortalLogin />} />
          <Route path="/mycare/change-password" element={<PortalChangePassword />} />
          <Route path="/mycare/dashboard" element={<PortalDashboard />} />
          <Route path="/mycare/appointments" element={<PortalAppointments />} />
          <Route path="/mycare/messages" element={<PortalMessages />} />
          <Route path="/mycare/profile" element={<PortalProfile />} />
          <Route path="/mycare" element={<Navigate to="/mycare/login" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
