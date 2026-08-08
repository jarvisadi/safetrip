import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Shield, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setLogin = useAuthStore((state) => state.setLogin);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      const { token, user } = response.data;
      
      // Store full user object
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      };
      
      setLogin(userData, token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Redirect based on role
      if (user.role === 'tourist') {
        navigate('/tourist/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin/map');
      } else if (user.role === 'govt') {
        navigate('/gov/portal');
      }
    } catch (err) {
      setError('Invalid email or password. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FAFAF9]">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-2/5 bg-[#1B4332] flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle diagonal pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #fff 10px, #fff 11px)'
        }} />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-12 h-12 text-white" />
            <span className="text-3xl font-bold text-white">SafeTrip</span>
          </div>
          <p className="text-[#A7F3D0] text-lg mb-12">Your safety is our priority</p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white">
              <Check className="w-5 h-5 text-[#A7F3D0]" />
              <span>Real-time GPS protection</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <Check className="w-5 h-5 text-[#A7F3D0]" />
              <span>AI-powered danger detection</span>
            </div>
            <div className="flex items-center gap-3 text-white">
              <Check className="w-5 h-5 text-[#A7F3D0]" />
              <span>Instant SOS alerts</span>
            </div>
          </div>
        </div>
        
        <div className="relative z-10">
          <p className="text-[#A7F3D0] text-sm">Trusted by tourists across India</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col p-8 lg:p-16">
        {/* Top Right Link */}
        <div className="flex justify-end mb-8">
          <button
            onClick={() => navigate('/register')}
            className="text-[#1B4332] font-medium hover:text-[#D97706] transition-colors"
          >
            New here? Register
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="mb-8">
            <p className="text-[#D97706] text-sm font-medium mb-2">Welcome back</p>
            <h1 className="text-3xl font-bold text-[#1C1917] mb-2">Sign in to SafeTrip</h1>
            <p className="text-[#6B7280]">Enter your credentials to continue your safe journey</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-2">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#9CA3AF] hover:text-[#1B4332] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1B4332] text-white py-3 rounded-lg hover:bg-[#163a2a] transition-all font-medium disabled:bg-[#1B4332]/50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Forgot Password */}
            <div className="text-right">
              <button type="button" className="text-[#6B7280] text-sm hover:text-[#1B4332] transition-colors">
                Forgot password?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
