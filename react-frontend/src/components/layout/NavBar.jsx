import NavItem from './NavItem';

function NavBar({ activeNav, setActiveNav, user }) {
    const hasAdminAccess =
    user?.permissions?.includes('admin') || user?.permissions?.includes('emergency_login');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'clients', label: 'Clients' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'messages', label: 'Messages' },
    { id: 'billing', label: 'Billing' },
    { id: 'reports', label: 'Reports' },
    ...(hasAdminAccess ? [{ id: 'admin', label: 'Settings' }] : [])
  ];

  return (
    <nav className="backdrop-blur-2xl bg-white/40 rounded-3xl shadow-2xl border border-white/50 p-2">
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
