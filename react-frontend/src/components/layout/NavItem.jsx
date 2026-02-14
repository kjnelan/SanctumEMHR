import { useNavigate } from 'react-router-dom';

function NavItem({ item, isActive, onClick }) {
    const navigate = useNavigate();

    const handleClick = () => {
        onClick(); // Update activeNav state

        // Navigate to dashboard with the active nav state
        navigate('/dashboard', { state: { activeNav: item.id } });
    };

    return (
        <button
        onClick={handleClick}
        className={`relative ${isActive ? 'nav-main-active' : 'nav-main-inactive'}`}
        >
        {item.label}
        {item.badge && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
        </button>
    );
}

export default NavItem;
