import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { ArrowLeft, MapPin, Phone, Clock, Check, AlertTriangle } from 'lucide-react';

const TouristSOS = () => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [response, setResponse] = useState(null);
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();

  const handleSOS = async () => {
    setShowConfirm(false);
    setSending(true);
    
    try {
      const res = await api.post('/sos/trigger');
      setResponse(res.data);
      setSent(true);
      toast.success('SOS alert sent successfully!', {
        duration: 5000,
        position: 'top-center',
      });
    } catch (error) {
      toast.error('Failed to trigger SOS. Please try again.', {
        duration: 5000,
        position: 'top-center',
      });
    } finally {
      setSending(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/tourist/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0A1F14] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-6">
        <button
          onClick={handleBackToDashboard}
          className="flex items-center gap-2 text-white hover:text-[#D1FAE5] transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="font-medium">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white">Emergency SOS</h1>
        <div className="w-16" /> {/* Spacer for balance */}
      </div>

      {/* Center Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {!sent ? (
          <>
            {/* Pulsing SOS Button */}
            <div className="relative mb-8">
              {/* Outer ring - animate-ping */}
              <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" style={{ width: '200px', height: '200px' }} />
              {/* Middle ring */}
              <div className="absolute inset-0 rounded-full bg-red-500/60" style={{ width: '180px', height: '180px', margin: '10px' }} />
              {/* Core button */}
              <button
                onClick={() => setShowConfirm(true)}
                className="relative w-[160px] h-[160px] rounded-full bg-[#DC2626] text-white font-bold text-3xl hover:bg-[#B91C1C] transition-all shadow-2xl flex items-center justify-center z-10"
              >
                SOS
              </button>
            </div>
            
            <p className="text-white/80 text-lg mb-4">Hold to confirm emergency</p>
            
            {!showConfirm ? (
              <div className="text-center space-y-2">
                <p className="text-white/60 text-sm">Your location will be shared with authorities</p>
                <p className="text-white/60 text-sm">Emergency contact will be notified via SMS</p>
              </div>
            ) : (
              <div className="space-y-4 w-full max-w-xs">
                <p className="text-white font-semibold text-center">Are you sure you want to trigger SOS?</p>
                <div className="flex gap-4">
                  <button
                    onClick={handleSOS}
                    disabled={sending}
                    className="flex-1 bg-[#DC2626] text-white py-3 rounded-lg font-bold hover:bg-[#B91C1C] transition-all disabled:bg-red-800 disabled:cursor-not-allowed"
                  >
                    {sending ? 'Sending...' : 'Yes, Trigger SOS'}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={sending}
                    className="flex-1 bg-white/10 text-white py-3 rounded-lg font-bold hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Success State */}
            <div className="w-24 h-24 rounded-full bg-[#16A34A] flex items-center justify-center mb-6">
              <Check className="w-12 h-12 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-[#16A34A] mb-2">✓ Alert Sent Successfully</h2>
            <p className="text-white/80 text-lg mb-8 text-center max-w-md">
              Authorities and family have been notified
            </p>

            {/* AI Alert Message Card */}
            {response && (
              <div className="bg-white rounded-xl p-6 mb-8 max-w-md w-full shadow-lg">
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#1C1917] mb-1">AI-Generated Alert</p>
                    <p className="text-sm text-[#78716C]">{response.message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Info Cards */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-lg mb-8">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <MapPin className="w-6 h-6 text-white/80 mx-auto mb-2" />
                <p className="text-xs text-white/60 mb-1">Your Location</p>
                <p className="text-sm text-white font-medium">28.6139° N</p>
                <p className="text-sm text-white font-medium">77.2090° E</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <Phone className="w-6 h-6 text-white/80 mx-auto mb-2" />
                <p className="text-xs text-white/60 mb-1">Emergency Contact</p>
                <p className="text-sm text-white font-medium">+91 98765</p>
                <p className="text-sm text-white font-medium">43210</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <Clock className="w-6 h-6 text-white/80 mx-auto mb-2" />
                <p className="text-xs text-white/60 mb-1">Alert Sent</p>
                <p className="text-sm text-white font-medium">Just now</p>
              </div>
            </div>

            <button
              onClick={handleBackToDashboard}
              className="px-8 py-3 bg-white text-[#0A1F14] rounded-lg font-semibold hover:bg-[#D1FAE5] transition-all"
            >
              Return to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TouristSOS;
