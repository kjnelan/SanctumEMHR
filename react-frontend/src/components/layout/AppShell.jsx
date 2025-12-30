import { branding } from '../../config/branding';
import Header from './Header';
import BackgroundEffects from './BackgroundEffects';
import NavBar from './NavBar';

function AppShell({ user, activeNav, setActiveNav, today, children, onLogout, wide = false }) {
    // Use wider layout for Calendar, standard for other pages
    const maxWidth = wide ? 'max-w-[1600px]' : 'max-w-7xl';

    return (
        <div className="min-h-screen relative overflow-hidden">
        <BackgroundEffects />

        <Header
        branding={branding}
        today={today}
        user={user}
        onLogout={onLogout}
        setActiveNav={setActiveNav}
        />

        <div className={`relative z-10 ${maxWidth} mx-auto px-6 pt-6`}>
        <NavBar activeNav={activeNav} setActiveNav={setActiveNav} user={user} />
        </div>

        <main className={`relative z-10 ${maxWidth} mx-auto px-6 py-8`}>
        {children}
        </main>
        </div>
    );
}

export default AppShell;
