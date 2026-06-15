import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const touristLinks = [
    { path: '/tourist/dashboard', label: 'Dashboard' },
    { path: '/tourist/sos', label: 'SOS' },
  ];

  const adminLinks = [
    { path: '/admin/map', label: 'Map' },
    { path: '/admin/incidents', label: 'Incidents' },
    { path: '/admin/analytics', label: 'Analytics' },
  ];

  const links = user?.role === 'tourist' ? touristLinks : adminLinks;

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => navigate('/')}>
              SafeTrip
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {links.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
