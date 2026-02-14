import { useState, useEffect, useRef } from 'react';
import { usePortalAuth } from '../../hooks/usePortalAuth';
import { portalLogout } from '../../services/PortalService';
import { branding } from '../../config/branding';
import { Navigate } from 'react-router-dom';

function PortalLayout({ children }) {
  const { client, loading } = usePortalAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const hasInitialized = useRef(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-mental">
        <div className="sanctum-glass-main p-8">
          <div className="animate-spin rounded-full h-12 w-12 mx-auto" style={{ border: '3px solid rgba(107, 154, 196, 0.3)', borderTopColor: 'rgba(107, 154, 196, 0.9)' }}></div>
          <p className="text-label mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  if (!client) return null;

  // Force password change if required
  if (client.forcePasswordChange) {
    return <Navigate to="/mycare/change-password" replace />;
  }

  const activeNav = window.location.hash?.replace('#/mycare/', '') || 'dashboard';

  // Fetch unread message count
  useEffect(() => {
    // Guard against multiple initializations
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/custom/api/portal/messages/get_unread_count.php', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUnreadCount(data.unreadCount || 0);
          }
        }
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };

    fetchUnreadCount();
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-mental">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <div className="sanctum-glass-main px-6 py-3">
            <div className="flex items-center justify-between">
              {/* Logo + Portal label */}
              <div className="flex items-center gap-3">
                {branding.logoUrl ? (
                  <img src={branding.logoUrl} alt={branding.companyName} className="h-8 w-auto" />
                ) : (
                  <span className="text-xl font-bold text-gray-800">{branding.logoText}</span>
                )}
                <span className="text-sm font-semibold text-gray-500">Client Portal</span>
              </div>

              {/* Nav Links */}
              <div className="hidden md:flex items-center gap-1">
                <a href="#/mycare/dashboard" className={activeNav === 'dashboard' ? 'nav-main-active' : 'nav-main-inactive'}>
                  Dashboard
                </a>
                <a href="#/mycare/appointments" className={activeNav === 'appointments' ? 'nav-main-active' : 'nav-main-inactive'}>
                  Appointments
                </a>
                <a href="#/mycare/messages" className={`relative ${activeNav === 'messages' ? 'nav-main-active' : 'nav-main-inactive'}`}>
                  Messages
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </a>
                <a href="#/mycare/profile" className={activeNav === 'profile' ? 'nav-main-active' : 'nav-main-inactive'}>
                  My Profile
                </a>
              </div>

              {/* User menu */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-800">{client.fullName}</p>
                  {client.providerName && (
                    <p className="text-xs text-gray-500">Provider: {client.providerName}</p>
                  )}
                </div>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                  {client.initials}
                </div>
                <button
                  onClick={portalLogout}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Mobile nav */}
            <div className="flex md:hidden items-center gap-1 mt-3 pt-3 border-t border-white/30">
              <a href="#/mycare/dashboard" className={`flex-1 text-center text-sm py-2 rounded-lg font-semibold ${activeNav === 'dashboard' ? 'nav-main-active' : 'nav-main-inactive'}`}>
                Dashboard
              </a>
              <a href="#/mycare/appointments" className={`flex-1 text-center text-sm py-2 rounded-lg font-semibold ${activeNav === 'appointments' ? 'nav-main-active' : 'nav-main-inactive'}`}>
                Appointments
              </a>
              <a href="#/mycare/messages" className={`flex-1 text-center text-sm py-2 rounded-lg font-semibold ${activeNav === 'messages' ? 'nav-main-active' : 'nav-main-inactive'}`}>
                Messages
              </a>
              <a href="#/mycare/profile" className={`flex-1 text-center text-sm py-2 rounded-lg font-semibold ${activeNav === 'profile' ? 'nav-main-active' : 'nav-main-inactive'}`}>
                Profile
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="text-center py-6">
        <p className="text-gray-500 text-xs">
          &copy; {new Date().getFullYear()} {branding.companyName}. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default PortalLayout;
