import NavItem from './NavItem';

function NavBar({ activeNav, setActiveNav, user }) {
    const hasAdminAccess =
    user?.permissions?.includes('admin') || user?.permissions?.includes('emergency_login');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'clients', label: 'Clients' },
    { id: 'messages', label: 'Messages' },
    { id: 'billing', label: 'Billing' },
    { id: 'reports', label: 'Reports' },
    ...(hasAdminAccess ? [{ id: 'admin', label: 'Admin Settings' }] : [])
  ];

  return (
    <nav className="rounded-3xl p-2" style={{ backdropFilter: 'blur(60px) saturate(180%)', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.4) 100%)', boxShadow: '0 8px 32px rgba(107, 154, 196, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)', border: '1px solid rgba(255, 255, 255, 0.6)' }}>
      <div className="flex gap-2">
        {navItems.map(item => (
          <NavItem
            key={item.id}
            item={item}
            isActive={activeNav === item.id}
            onClick={() => setActiveNav(item.id)}
          />
        ))}
      </div>
    </nav>
  );
}

export default NavBar;
