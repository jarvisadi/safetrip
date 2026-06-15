import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Camera, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import socket, { connectSocket, disconnectSocket, joinTouristRoom, leaveTouristRoom, updateLocation } from '../services/socket';
import { useAuthStore } from '../store/authStore';
import DigitalIDCard from '../components/DigitalIDCard';
import FaceVerification from '../components/FaceVerification';
import WildlifeReport from '../components/WildlifeReport';
import ChatBot from '../components/ChatBot';

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
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const locationIntervalRef = useRef(null);

  useEffect(() => {
    fetchTouristProfile();
  }, []);

  useEffect(() => {
    if (touristData && token) {
      // Connect to socket
      connectSocket(token);
      joinTouristRoom();

      // Start location tracking
      startLocationTracking();

      return () => {
        // Cleanup
        if (locationIntervalRef.current) {
          clearInterval(locationIntervalRef.current);
        }
        leaveTouristRoom();
        disconnectSocket();
      };
    }
  }, [touristData, token]);

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    // Get initial location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setCurrentLocation(location);
        sendLocationUpdate(location);
      },
      (error) => {
        setLocationError('Unable to retrieve your location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    // Update location every 10 seconds
    locationIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setCurrentLocation(location);
          sendLocationUpdate(location);
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
    }, 10000);
  };

  const sendLocationUpdate = (location) => {
    updateLocation(location);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!touristData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Tourist Dashboard</h1>
          <button
            onClick={() => navigate('/tourist/profile')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            My Profile
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Digital ID Card */}
          <DigitalIDCard touristData={touristData} />
          
          {/* Dashboard Stats */}
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">Current Location</h2>
              {locationError ? (
                <p className="text-red-600">{locationError}</p>
              ) : currentLocation ? (
                <div>
                  <p className="text-gray-600 mb-2">
                    Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}
                  </p>
                  <p className="text-gray-500 text-sm">Accuracy: ±{currentLocation.accuracy.toFixed(0)}m</p>
                  <div className="mt-4 h-48 rounded-lg overflow-hidden">
                    <MapContainer
                      key="tourist-map"
                      center={[currentLocation.lat, currentLocation.lng]}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[currentLocation.lat, currentLocation.lng]}>
                        <Popup>You are here</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Acquiring location...</p>
              )}
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">Active Alerts</h2>
              <p className="text-gray-600">No active alerts</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2">Safety Status</h2>
              <p className="text-green-600 font-medium">Safe</p>
            </div>
          </div>
        </div>

        {/* Camera Permission Request */}
        {cameraPermission === null && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-200">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Camera className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">Camera Permission Required</h2>
                <p className="text-gray-600 mb-4">
                  SafeTrip needs camera access for face verification and wildlife photo detection. Your camera is never accessed without your permission.
                </p>
                <button
                  onClick={requestCameraPermission}
                  className="bg-green-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Grant Camera Permission
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Camera Permission Status */}
        {cameraPermission === true && (
          <div className="bg-green-50 p-4 rounded-lg mb-6 border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">Camera access granted</span>
            </div>
          </div>
        )}

        {cameraPermission === false && (
          <div className="bg-red-50 p-4 rounded-lg mb-6 border border-red-200">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">
                Camera permission denied. Some AI features will not work. You can enable it from your browser settings.
              </span>
            </div>
          </div>
        )}

        {/* Check-in Verification */}
        {cameraPermission === true && <FaceVerification registrationPhotoUrl={touristData?.photo_url} touristId={touristData?.id} />}

        {/* Wildlife Report */}
        {cameraPermission === true && <WildlifeReport />}
      </div>

      {/* ChatBot */}
      <ChatBot />
    </div>
  );
};

export default TouristDashboard;
