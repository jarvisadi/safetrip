import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Camera, CheckCircle, XCircle, MapPin, Shield, Activity, MessageSquare, User, AlertTriangle, Home, ChevronRight, Mic } from 'lucide-react';
import api from '../services/api';
import socket, { connectSocket, disconnectSocket, joinTouristRoom, leaveTouristRoom, updateLocation } from '../services/socket';
import { useAuthStore } from '../store/authStore';
import DigitalIDCard from '../components/DigitalIDCard';
import FaceVerification from '../components/FaceVerification';
import WildlifeReport from '../components/WildlifeReport';
import ChatBot from '../components/ChatBot';
import ScreamDetection from '../components/ScreamDetection';
import EmbeddedChat from '../components/EmbeddedChat';

// Fix for default marker icon in react-leaflet
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const TouristDashboard = () => {
  const [touristData, setTouristData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState({ lat: null, lng: null });
  const [locationError, setLocationError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const locationIntervalRef = useRef(null);
  
  // Check localStorage as backup for user data
  const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchTouristProfile();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        console.log('Location fetched:', position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('Location error:', error);
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied. Please allow location access.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  useEffect(() => {
    if (touristData && token) {
      // Connect to socket
      connectSocket(token);
      joinTouristRoom();

      // Send initial location if available
      if (userLocation.lat && userLocation.lng) {
        updateLocation({
          lat: userLocation.lat,
          lng: userLocation.lng,
          accuracy: 0
        });
      }

      // Update location every 10 seconds
      locationIntervalRef.current = setInterval(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
              };
              setUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
              updateLocation(location);
            },
            (error) => {
              console.error('Error getting location:', error);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            }
          );
        }
      }, 10000);

      return () => {
        // Cleanup
        if (locationIntervalRef.current) {
          clearInterval(locationIntervalRef.current);
        }
        leaveTouristRoom();
        disconnectSocket();
      };
    }
  }, [touristData, token, userLocation]);

  const fetchTouristProfile = async () => {
    try {
      const response = await api.get('/tourists/me');
      setTouristData(response.data);
      console.log('Tourist data:', response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        navigate('/tourist/complete-profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission(true);
      // Stop the stream immediately after permission check
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      setCameraPermission(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'face-verify', label: 'Face Verify', icon: User },
    { id: 'wildlife', label: 'Wildlife Detect', icon: AlertTriangle },
    { id: 'sound', label: 'Sound Monitor', icon: Activity },
    { id: 'chat', label: 'Safety Chat', icon: MessageSquare },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="text-[#78716C]">Loading...</div>
      </div>
    );
  }

  if (!touristData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex">
      {/* Sidebar */}
      <div className="hidden lg:flex w-60 flex-col bg-white border-r border-[#E7E5E4]">
        {/* User Section */}
        <div className="p-6 border-b border-[#E7E5E4]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-medium">
              {getInitials(touristData.name)}
            </div>
            <div>
              <h3 className="font-semibold text-[#1C1917]">{touristData.name}</h3>
              <span className="text-xs px-2 py-0.5 bg-[#D1FAE5] text-[#16A34A] rounded-full font-medium">Tourist</span>
            </div>
          </div>
          {/* Digital ID Card Preview */}
          <button
            onClick={() => setActiveTab('profile')}
            className="w-full p-3 bg-[#FAFAF9] rounded-lg border border-[#E7E5E4] hover:border-[#1B4332] transition-all"
          >
            <div className="flex items-center gap-2 text-xs text-[#78716C]">
              <Shield className="w-4 h-4 text-[#1B4332]" />
              <span>Digital ID Card</span>
              <ChevronRight className="w-4 h-4 ml-auto" />
            </div>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? 'bg-[#1B4332] text-white'
                    : 'text-[#78716C] hover:bg-stone-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Risk Level Indicator */}
        <div className="p-4 border-t border-[#E7E5E4]">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#16A34A] animate-pulse" />
            <div>
              <p className="text-xs text-[#A8A29E]">Your risk level</p>
              <p className="text-sm font-medium text-[#16A34A]">Low</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-[#E7E5E4] p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-medium">
              {getInitials(touristData.name)}
            </div>
            <div>
              <h3 className="font-semibold text-[#1C1917]">{touristData.name}</h3>
              <span className="text-xs px-2 py-0.5 bg-[#D1FAE5] text-[#16A34A] rounded-full font-medium">Tourist</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 lg:p-8 overflow-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Welcome Header */}
              <div>
                <h1 className="text-2xl font-bold text-[#1C1917]">
                  Welcome back, {currentUser?.name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-[#78716C] mt-1">Here's what's happening with your trip today.</p>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Location Status Card */}
                <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-[#A8A29E] uppercase tracking-wide">Location Status</h3>
                    <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                  </div>
                  {locationError ? (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="w-5 h-5" />
                      <p className="text-sm">{locationError}</p>
                    </div>
                  ) : userLocation.lat && userLocation.lng ? (
                    <div>
                      <div className="flex items-center gap-2 text-[#16A34A] mb-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Active</span>
                      </div>
                      <p className="text-xs text-[#78716C] mb-1">
                        {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                      </p>
                      <p className="text-xs text-[#A8A29E]">Sharing since 5 mins</p>
                    </div>
                  ) : (
                    <p className="text-sm text-[#78716C]">Acquiring location...</p>
                  )}
                </div>

                {/* Safety Score Card */}
                <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-[#A8A29E] uppercase tracking-wide">Safety Score</h3>
                    <Shield className="w-5 h-5 text-[#1B4332]" />
                  </div>
                  <div className="text-4xl font-bold text-[#16A34A] mb-1">85</div>
                  <p className="text-sm text-[#78716C]">out of 100</p>
                  <div className="mt-3 h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full w-[85%] bg-[#16A34A] rounded-full" />
                  </div>
                </div>

                {/* Emergency Ready Card */}
                <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-[#A8A29E] uppercase tracking-wide">Emergency Ready</h3>
                    <AlertTriangle className="w-5 h-5 text-[#D97706]" />
                  </div>
                  <div className="flex items-center gap-2 text-[#16A34A] mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">SOS configured ✓</span>
                  </div>
                  <p className="text-sm text-[#78716C]">Emergency contact: {touristData.emergency_contact || 'Not set'}</p>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Mini Map */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm">
                  <h3 className="text-sm font-medium text-[#A8A29E] uppercase tracking-wide mb-4">Current Location</h3>
                  {userLocation.lat && userLocation.lng ? (
                    <div className="h-64 rounded-xl overflow-hidden border border-[#E7E5E4]">
                      <MapContainer
                        key="tourist-map"
                        center={[userLocation.lat, userLocation.lng]}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[userLocation.lat, userLocation.lng]}>
                          <Popup>You are here</Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  ) : (
                    <div className="h-64 rounded-xl bg-stone-50 flex items-center justify-center">
                      <p className="text-[#78716C]">Acquiring location...</p>
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm">
                  <h3 className="text-sm font-medium text-[#A8A29E] uppercase tracking-wide mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#D1FAE5] flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-[#16A34A]" />
                      </div>
                      <div>
                        <p className="text-sm text-[#1C1917]">Location updated</p>
                        <p className="text-xs text-[#A8A29E]">2 mins ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#D1FAE5] flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-[#16A34A]" />
                      </div>
                      <div>
                        <p className="text-sm text-[#1C1917]">Profile verified</p>
                        <p className="text-xs text-[#A8A29E]">Today</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#D1FAE5] flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-[#16A34A]" />
                      </div>
                      <div>
                        <p className="text-sm text-[#1C1917]">SOS configured</p>
                        <p className="text-xs text-[#A8A29E]">Today</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setActiveTab('wildlife')}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-[#D97706] text-[#D97706] font-medium hover:bg-[#FEF3C7] transition-all"
                >
                  <Camera className="w-5 h-5" />
                  Report Wildlife
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-[#1B4332] text-[#1B4332] font-medium hover:bg-[#D1FAE5] transition-all"
                >
                  <MessageSquare className="w-5 h-5" />
                  Ask Safety AI
                </button>
                <button
                  onClick={() => navigate('/tourist/sos')}
                  className="flex items-center gap-2 px-8 py-3 rounded-lg bg-[#DC2626] text-white font-medium hover:bg-[#B91C1C] transition-all"
                >
                  <AlertTriangle className="w-5 h-5" />
                  Emergency SOS
                </button>
              </div>

              {/* Camera Permission Request */}
              {cameraPermission === null && (
                <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#D1FAE5] flex items-center justify-center flex-shrink-0">
                      <Camera className="w-6 h-6 text-[#16A34A]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-[#1C1917] mb-2">Camera Permission Required</h3>
                      <p className="text-sm text-[#78716C] mb-4">
                        SafeTrip needs camera access for face verification and wildlife photo detection. Your camera is never accessed without your permission.
                      </p>
                      <button
                        onClick={requestCameraPermission}
                        className="px-6 py-2 bg-[#1B4332] text-white rounded-lg font-medium hover:bg-[#14532D] transition-all"
                      >
                        Grant Camera Permission
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Camera Permission Status */}
              {cameraPermission === true && (
                <div className="bg-[#D1FAE5] rounded-xl border border-[#16A34A]/20 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#16A34A]" />
                    <span className="text-sm font-medium text-[#16A34A]">Camera access granted</span>
                  </div>
                </div>
              )}

              {cameraPermission === false && (
                <div className="bg-[#FEE2E2] rounded-xl border border-[#DC2626]/20 p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-[#DC2626]" />
                    <span className="text-sm text-[#DC2626]">
                      Camera permission denied. Some AI features will not work. You can enable it from your browser settings.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'face-verify' && (
            <FaceVerification registrationPhotoUrl={touristData?.photo_url} touristId={touristData?.id} />
          )}

          {activeTab === 'wildlife' && (
            <WildlifeReport />
          )}

          {activeTab === 'sound' && (
            <ScreamDetection />
          )}

          {activeTab === 'chat' && (
            <EmbeddedChat />
          )}

          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm">
              <DigitalIDCard touristData={touristData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TouristDashboard;
