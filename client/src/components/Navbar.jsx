import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Shield, Home, AlertTriangle, User, Map, Activity, BarChart3, LogOut, Menu, X, CheckCircle } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Check localStorage as backup
  const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const touristLinks = [
    { path: '/tourist/dashboard', label: 'Dashboard', icon: Home },
    { path: '/tourist/sos', label: 'SOS', icon: AlertTriangle },
    { path: '/tourist/profile', label: 'Profile', icon: User },
  ];

  const adminLinks = [
    { path: '/admin/map', label: 'Live Map', icon: Map },
    { path: '/admin/incidents', label: 'Incidents', icon: Activity },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const links = user?.role === 'tourist' ? touristLinks : adminLinks;
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <nav className="h-16 bg-white border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between h-full">
          {/* Left - Logo */}
          <div className="flex items-center">
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-[#1B4332]" />
              <span className="text-xl font-bold text-[#1C1917]">SafeTrip</span>
            </button>
          </div>

          {/* Center - Nav Links (Desktop) */}
          <div className="hidden md:flex items-center space-x-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = window.location.pathname === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#1B4332]/10 text-[#1B4332]'
                      : 'text-[#78716C] hover:text-[#1B4332] hover:bg-stone-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </button>
              );
            })}
          </div>

          {/* Right - User Section */}
          <div className="flex items-center space-x-4">
            {/* Protected Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#D1FAE5] rounded-full">
              <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span className="text-xs font-medium text-[#16A34A]">Protected</span>
            </div>

            {/* Admin Badge */}
            {user?.role === 'admin' && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#FEF3C7] rounded-full">
                <span className="text-xs font-medium text-[#D97706]">Admin</span>
              </div>
            )}

            {/* User Avatar with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-[#1B4332] flex items-center justify-center text-white text-sm font-bold">
                  {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-stone-700 hidden sm:block">
                  {currentUser?.name || 'User'}
                </span>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-stone-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-stone-100">
                    <p className="text-sm font-medium text-[#1C1917]">{user?.name}</p>
                    <p className="text-xs text-[#A8A29E]">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate(user?.role === 'tourist' ? '/tourist/profile' : '/admin/map');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[#78716C] hover:bg-stone-50 flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-stone-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-100 bg-white">
          <div className="px-4 py-4 space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = window.location.pathname === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => {
                    navigate(link.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#1B4332]/10 text-[#1B4332]'
                      : 'text-[#78716C] hover:bg-stone-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </button>
              );
            })}
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
