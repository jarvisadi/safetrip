import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

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
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        {!sent ? (
          <>
            <h1 className="text-3xl font-bold mb-4 text-red-600">SOS Emergency</h1>
            <p className="text-gray-600 mb-8">Press the button below to send an emergency alert to authorities</p>
            
            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full h-40 md:h-32 bg-red-600 text-white rounded-full text-4xl md:text-3xl font-bold hover:bg-red-700 transition-colors shadow-lg animate-pulse"
              >
                SOS
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-700 font-semibold">Are you sure you want to trigger SOS?</p>
                <div className="flex gap-4">
                  <button
                    onClick={handleSOS}
                    disabled={sending}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors disabled:bg-red-400"
                  >
                    {sending ? 'Sending...' : 'Yes, Trigger SOS'}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={sending}
                    className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-bold hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            <div className="mt-8 text-sm text-gray-500">
              <p>Your location will be shared with authorities</p>
              <p className="mt-1">Emergency contact will be notified via SMS</p>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600">SOS Alert Sent!</h2>
            <p className="text-gray-600">Authorities have been notified with your location.</p>
            {response && (
              <div className="bg-gray-50 p-4 rounded-lg text-left">
                <p className="text-sm font-semibold mb-1">Alert Message:</p>
                <p className="text-sm text-gray-700">{response.message}</p>
              </div>
            )}
            <button
              onClick={handleBackToDashboard}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TouristSOS;
