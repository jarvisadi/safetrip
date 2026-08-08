import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Shield, ArrowLeft, Mail, Lock, Eye, EyeOff, User, Phone, Check } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'tourist',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setLogin = useAuthStore((state) => state.setLogin);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getStrength = (pwd) => {
    if (pwd.length < 6) return 'weak';
    if (pwd.length < 10) return 'medium';
    return 'strong';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/register', formData);
      const { token, user } = response.data;
      setLogin(user, token);

      // Redirect based on role
      if (user.role === 'tourist') {
        navigate('/tourist/dashboard');
      } else if (user.role === 'admin') {
        navigate('/admin/map');
      } else if (user.role === 'govt') {
        navigate('/gov/portal');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between max-w-4xl mx-auto w-full mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#1B4332] hover:text-[#D97706] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to home</span>
        </button>
        
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-[#1B4332]" />
          <span className="text-xl font-bold text-[#1B4332]">SafeTrip</span>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1C1917] mb-2">Create your account</h1>
            <p className="text-[#6B7280]">Join thousands of tourists traveling safely</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center gap-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-[#1B4332]" />
            <div className="w-2 h-2 rounded-full bg-[#E7E5E4]" />
            <div className="w-2 h-2 rounded-full bg-[#E7E5E4]" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-2">Phone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border border-[#E7E5E4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent transition-all"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>

            {/* Password */}
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
                  placeholder="Create a strong password"
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
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex gap-1 h-1">
                    <div className={`flex-1 rounded-full ${getStrength(formData.password) === 'weak' ? 'bg-red-500' : getStrength(formData.password) === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`} />
                    <div className={`flex-1 rounded-full ${getStrength(formData.password) === 'weak' ? 'bg-[#E7E5E4]' : getStrength(formData.password) === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`} />
                    <div className={`flex-1 rounded-full ${getStrength(formData.password) === 'weak' ? 'bg-[#E7E5E4]' : getStrength(formData.password) === 'medium' ? 'bg-[#E7E5E4]' : 'bg-green-500'}`} />
                  </div>
                  <p className={`text-xs mt-1 ${getStrength(formData.password) === 'weak' ? 'text-red-500' : getStrength(formData.password) === 'medium' ? 'text-amber-500' : 'text-green-500'}`}>
                    {getStrength(formData.password).charAt(0).toUpperCase() + getStrength(formData.password).slice(1)} password
                  </p>
                </div>
              )}
            </div>

            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-[#6B7280] mb-3">I am a</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'tourist' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.role === 'tourist'
                      ? 'border-[#1B4332] bg-[#1B4332]/5'
                      : 'border-[#E7E5E4] hover:border-[#1B4332]/30'
                  }`}
                >
                  <div className="text-2xl mb-1">🧍</div>
                  <div className="text-sm font-medium text-[#1C1917]">Tourist</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'admin' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.role === 'admin'
                      ? 'border-[#1B4332] bg-[#1B4332]/5'
                      : 'border-[#E7E5E4] hover:border-[#1B4332]/30'
                  }`}
                >
                  <div className="text-2xl mb-1">🖥️</div>
                  <div className="text-sm font-medium text-[#1C1917]">Admin</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'govt' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.role === 'govt'
                      ? 'border-[#1B4332] bg-[#1B4332]/5'
                      : 'border-[#E7E5E4] hover:border-[#1B4332]/30'
                  }`}
                >
                  <div className="text-2xl mb-1">🏛️</div>
                  <div className="text-sm font-medium text-[#1C1917]">Government</div>
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
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            {/* Sign In Link */}
            <div className="text-center">
              <span className="text-[#6B7280]">Already have an account? </span>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[#1B4332] font-medium hover:text-[#D97706] transition-colors"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
