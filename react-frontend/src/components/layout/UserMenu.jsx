function UserMenu({ user, onLogout, setActiveNav }) {
    return (
        <div className="flex items-center gap-3 bg-white/40 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/50">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
        <span className="text-white font-bold text-sm">{user.initials}</span>
        </div>
        <div className="text-left">
        <p className="text-sm font-semibold text-gray-800">{user.name}</p>
        <div className="flex gap-2 items-center">
        <button
        onClick={() => setActiveNav('settings')}
        className="text-xs text-gray-600 hover:text-gray-900 transition-all"
        >
        Settings
        </button>
        <span className="text-gray-400">•</span>
        <button
        onClick={onLogout}
        className="text-xs text-gray-600 hover:text-gray-900 transition-all"
        >
        Sign Out
        </button>
        </div>
        </div>
        </div>
    );
}

export default UserMenu;
