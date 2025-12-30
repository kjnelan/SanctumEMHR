import UserMenu from './UserMenu';

function Header({ branding, today, user, onLogout, setActiveNav }) {
    return (
        <header className="relative z-10 backdrop-blur-xl bg-white/30 shadow-lg border-b border-white/40 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/60 rounded-2xl flex items-center justify-center shadow-lg border border-white/70 backdrop-blur-sm overflow-hidden">
        {branding.logoUrl ? (
            <img
            src={branding.logoUrl}
            alt={branding.companyName}
            className="w-full h-full object-contain p-1"
            onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
            }}
            />
        ) : null}
        <span className="text-xl font-bold text-gray-700" style={{ display: branding.logoUrl ? 'none' : 'block' }}>
            {branding.logoText}
        </span>
        </div>
        <div>
        <h1 className="text-xl font-bold text-gray-800">{branding.companyName}</h1>
        <p className="text-xs text-gray-600">{today}</p>
        </div>
        </div>

        <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-white/40 rounded-xl transition-all">
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {user?.unreadMessages > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
            {user.unreadMessages}
            </span>
        )}
        </button>

        <UserMenu user={user} onLogout={onLogout} setActiveNav={setActiveNav} />
        </div>
        </div>
        </div>
        </header>
    );
}

export default Header;
