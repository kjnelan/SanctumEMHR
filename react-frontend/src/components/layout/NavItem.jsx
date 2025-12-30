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
        className={isActive ? 'nav-main-active' : 'nav-main-inactive'}
        >
        {item.label}
        </button>
    );
}

export default NavItem;
