import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Map, AlertTriangle, BarChart3, Building2, LogOut, Bell, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');

  const navItems = [
    { id: 'map', label: 'Live Map', icon: Map, path: '/admin/map' },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, path: '/admin/incidents' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  ];

  // Add Govt Portal if user is govt role
  if (currentUser?.role === 'govt') {
    navItems.push({ id: 'govt', label: 'Govt Portal', icon: Building2, path: '/gov/portal' });
  }

  const currentPath = location.pathname;
  const currentPage = navItems.find(item => item.path === currentPath)?.label || 'Dashboard';

  return (
    <div className="flex h-screen bg-[#FAFAF9]">
      {/* Left Sidebar */}
      <div className="w-[260px] bg-white border-r border-stone-100 flex flex-col">
        {/* Logo Area */}
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-6 h-6 text-[#1B4332]" />
            <span className="text-lg font-bold text-[#1C1917]">SafeTrip</span>
          </div>
          <p className="text-xs text-[#78716C]">Admin Panel</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#1B4332] text-white'
                    : 'text-[#78716C] hover:bg-stone-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-stone-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#1B4332] flex items-center justify-center text-white text-sm font-bold">
              {currentUser?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1C1917] truncate">
                {currentUser?.name || 'Admin'}
              </p>
              <p className="text-xs text-[#78716C]">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <div className="h-16 bg-white border-b border-stone-100 flex items-center justify-between px-6">
          {/* Page Title */}
          <h1 className="text-lg font-semibold text-[#1C1917]">{currentPage}</h1>

          {/* Right Side */}
          <div className="flex items-center gap-6">
            {/* Live Indicator */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span className="text-sm text-[#78716C]">12 tourists active</span>
            </div>

            {/* Notification Bell */}
            <button className="relative p-2 rounded-lg hover:bg-stone-100 transition-colors">
              <Bell className="w-5 h-5 text-[#78716C]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Time Display */}
            <div className="flex items-center gap-2 text-sm text-[#78716C]">
              <Clock className="w-4 h-4" />
              <span>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
