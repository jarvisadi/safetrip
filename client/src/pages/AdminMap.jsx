import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, Circle, useMap } from 'react-leaflet';
import { Icon, divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import socket, { connectSocket, disconnectSocket, joinAdminRoom, onTouristMoved, onSOSAlert, offTouristMoved, offSOSAlert } from '../services/socket';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { MapPin, AlertTriangle, X, Users, Activity, Check, Pencil, Map } from 'lucide-react';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const AdminMap = () => {
  const [activeTourists, setActiveTourists] = useState(new Map());
  const [sosAlert, setSosAlert] = useState(null);
  const [geofenceAlert, setGeofenceAlert] = useState(null);
  const [wildlifeAlerts, setWildlifeAlerts] = useState(new Map());
  const [geofences, setGeofences] = useState([]);
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState([]);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneType, setNewZoneType] = useState('safe');
  const [loading, setLoading] = useState(true);
  const token = useAuthStore((state) => state.token);
  const mapRef = useRef(null);
  const markerRefs = useRef(new Map());

  useEffect(() => {
    if (token) {
      connectSocket(token);
      joinAdminRoom();

      onTouristMoved((data) => {
        setActiveTourists((prev) => {
          const newMap = new Map(prev);
          newMap.set(data.touristId, {
            ...data,
            riskScore: data.riskScore || 0,
          });
          return newMap;
        });
      });

      onSOSAlert((data) => {
        setSosAlert(data);
        // Flash the tourist pin red
        setActiveTourists((prev) => {
          const newMap = new Map(prev);
          const tourist = newMap.get(data.touristId);
          if (tourist) {
            newMap.set(data.touristId, {
              ...tourist,
              riskScore: 100,
              isSOS: true,
            });
          }
          return newMap;
        });

        // Clear SOS alert after 10 seconds
        setTimeout(() => {
          setSosAlert(null);
          setActiveTourists((prev) => {
            const newMap = new Map(prev);
            const tourist = newMap.get(data.touristId);
            if (tourist) {
              newMap.set(data.touristId, {
                ...tourist,
                isSOS: false,
              });
            }
            return newMap;
          });
        }, 10000);
      });

      // Listen for geofence breach alerts
      socket.on('admin:alert', (data) => {
        if (data.type === 'geofence_breach') {
          setGeofenceAlert(data);
          setTimeout(() => setGeofenceAlert(null), 10000);
        }
      });

      // Listen for wildlife alerts
      socket.on('admin:wildlife_alert', (data) => {
        setWildlifeAlerts((prev) => {
          const newMap = new Map(prev);
          newMap.set(data.touristId, data);
          return newMap;
        });

        // Clear wildlife alert after 30 seconds
        setTimeout(() => {
          setWildlifeAlerts((prev) => {
            const newMap = new Map(prev);
            newMap.delete(data.touristId);
            return newMap;
          });
        }, 30000);
      });

      // Fetch geofences
      fetchGeofences();

      // Set loading to false after initial setup
      setTimeout(() => setLoading(false), 1000);

      return () => {
        offTouristMoved();
        offSOSAlert();
        socket.off('admin:alert');
        socket.off('admin:wildlife_alert');
        disconnectSocket();
      };
    }
  }, [token]);

  const fetchGeofences = async () => {
    try {
      const response = await api.get('/geofences');
      setGeofences(response.data);
    } catch (error) {
      console.error('Error fetching geofences:', error);
    }
  };

  const handleMapClick = (e) => {
    if (!isDrawMode) return;
    const { lat, lng } = e.latlng;
    setDrawnPoints([...drawnPoints, { lat, lng }]);
  };

  const handleSaveZone = async () => {
    if (drawnPoints.length < 3 || !newZoneName) {
      alert('Please provide a name and at least 3 points for the zone');
      return;
    }

    try {
      await api.post('/geofences', {
        name: newZoneName,
        type: newZoneType,
        polygon: drawnPoints,
      });

      setDrawnPoints([]);
      setNewZoneName('');
      setIsDrawMode(false);
      fetchGeofences();
    } catch (error) {
      alert('Failed to create zone');
    }
  };

  const handleCancelDraw = () => {
    setDrawnPoints([]);
    setNewZoneName('');
    setIsDrawMode(false);
  };

  const getRiskColor = (riskScore) => {
    if (riskScore >= 70) return '#ef4444'; // red
    if (riskScore >= 40) return '#f59e0b'; // amber
    return '#22c55e'; // green
  };

  const createCustomIcon = (riskScore, isSOS) => {
    const color = isSOS ? '#ef4444' : getRiskColor(riskScore);
    
    return divIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ${isSOS ? 'animation: pulse 1s infinite;' : ''}
      "></div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      </style>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  const createWildlifeIcon = () => {
    return divIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color: #f97316;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 1s infinite;
        font-size: 16px;
      ">🦁</div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      </style>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const getRiskBadge = (riskScore) => {
    if (riskScore >= 70) return 'bg-red-100 text-red-700';
    if (riskScore >= 40) return 'bg-amber-100 text-amber-700';
    return 'bg-green-100 text-green-700';
  };

  const getRiskLabel = (riskScore) => {
    if (riskScore >= 70) return 'High Risk';
    if (riskScore >= 40) return 'Medium Risk';
    return 'Safe';
  };

  const getGeofenceColor = (type) => {
    switch (type) {
      case 'safe': return '#22c55e'; // green
      case 'danger': return '#ef4444'; // red
      case 'trail': return '#3b82f6'; // blue
      default: return '#6b7280'; // gray
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  try {
    return (
      <div className="flex h-full">
        {/* Left Sidebar - 320px */}
        <div className="w-[320px] bg-white border-r border-stone-100 flex flex-col overflow-hidden">
          {/* Section 1 - Active Tourists */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b border-stone-100 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-[#1C1917]">Active Tourists</h2>
                <span className="text-xs bg-[#1B4332] text-white px-2 py-0.5 rounded-full">
                  {activeTourists.size}
                </span>
              </div>
            </div>
            
            <div className="p-4 space-y-3">
              {Array.from(activeTourists.values()).map((tourist, index) => (
                <div
                  key={tourist.touristId}
                  className="p-3 bg-[#FAFAF9] rounded-xl border border-stone-100 hover:border-[#1B4332] cursor-pointer transition-all"
                  onClick={() => {
                    if (tourist.location && mapRef.current) {
                      mapRef.current.flyTo([tourist.location.lat, tourist.location.lng], 16);
                    }
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-xs font-bold">
                      {getInitials(tourist.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#1C1917] truncate">{tourist.name}</p>
                      <p className="text-xs text-[#78716C] truncate">
                        {tourist.location ? `${tourist.location.lat.toFixed(4)}, ${tourist.location.lng.toFixed(4)}` : 'Location unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      tourist.riskScore >= 70 ? 'bg-red-100 text-red-700 animate-pulse' :
                      tourist.riskScore >= 40 ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {getRiskLabel(tourist.riskScore)}
                    </span>
                    <span className="text-xs text-[#A8A29E]">
                      Last seen {Math.floor(Math.random() * 10) + 1} mins ago
                    </span>
                  </div>
                  {index < Array.from(activeTourists.values()).length - 1 && (
                    <div className="mt-3 border-t border-stone-100" />
                  )}
                </div>
              ))}
              {activeTourists.size === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-[#A8A29E] mx-auto mb-2" />
                  <p className="text-sm text-[#A8A29E]">No active tourists</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2 - Recent Alerts */}
          <div className="border-t border-stone-100">
            <div className="p-4 border-b border-stone-100">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-[#1C1917]">Recent Alerts</h2>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {sosAlert ? 1 : 0}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {sosAlert && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1C1917]">SOS Alert</p>
                    <p className="text-xs text-[#78716C] truncate">{sosAlert.name}</p>
                    <p className="text-xs text-[#A8A29E]">Just now</p>
                  </div>
                </div>
              )}
              {!sosAlert && (
                <p className="text-sm text-[#A8A29E] text-center py-4">No recent alerts</p>
              )}
            </div>
          </div>
        </div>

        {/* Right - Map */}
        <div className="flex-1 relative">
          <MapContainer
            key="admin-map"
            ref={mapRef}
            center={[20.5937, 78.9629]}
            zoom={5}
            scrollWheelZoom={true}
            zoomControl={true}
            style={{ height: '100%', width: '100%' }}
            onClick={handleMapClick}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Display geofence zones */}
            {(geofences || []).map((geofence) => (
              <Polygon
                key={geofence.id}
                positions={(geofence.polygon || []).map(p => [p.lat, p.lng])}
                pathOptions={{
                  color: getGeofenceColor(geofence.type),
                  fillColor: getGeofenceColor(geofence.type),
                  fillOpacity: 0.3,
                  weight: 2,
                }}
              >
                <Tooltip permanent direction="center">
                  <span className="bg-white px-2 py-1 rounded text-sm font-semibold">{geofence.name}</span>
                </Tooltip>
              </Polygon>
            ))}

            {/* Display drawn points while in draw mode */}
            {isDrawMode && (drawnPoints || []).length > 0 && (
              <Polygon
                positions={(drawnPoints || []).map(p => [p.lat, p.lng])}
                pathOptions={{
                  color: '#3b82f6',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.3,
                  weight: 2,
                  dashArray: '5, 5',
                }}
              />
            )}

            {/* Display tourist markers */}
            {Array.from(activeTourists.values()).map((tourist) => {
              if (!tourist.location) return null;
              return (
                <Marker
                  key={tourist.touristId}
                  position={[tourist.location.lat, tourist.location.lng]}
                  icon={createCustomIcon(tourist.riskScore, tourist.isSOS)}
                  ref={(ref) => {
                    if (ref) {
                      markerRefs.current.set(tourist.touristId, ref);
                    }
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold">{tourist.name}</h3>
                      <p className="text-sm text-gray-600">{tourist.phone}</p>
                      <p className="text-sm mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBadge(tourist.riskScore)}`}>
                          {getRiskLabel(tourist.riskScore)}
                        </span>
                      </p>
                      {tourist.isSOS && (
                        <p className="text-red-600 font-bold mt-2">⚠️ SOS ACTIVE</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Display wildlife alert markers */}
            {Array.from(wildlifeAlerts.values()).map((alert) => {
              if (!alert.location) return null;
              return (
                <Marker
                  key={`wildlife-${alert.touristId}`}
                  position={[alert.location.lat, alert.location.lng]}
                  icon={createWildlifeIcon()}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-orange-600">🦁 Wildlife Alert</h3>
                      <p className="text-sm text-gray-600">{alert.name}</p>
                      <p className="text-sm mt-1">
                        <span className="font-semibold">Animal:</span> {alert.animal}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">Danger Level:</span> {alert.dangerLevel}
                      </p>
                      <p className="text-sm mt-1 text-gray-600">{alert.advice}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Floating Controls - Top Right */}
          <div className="absolute top-4 right-4 bg-white rounded-xl shadow-sm border border-stone-100 p-4 z-10">
            <div className="space-y-3">
              <button
                onClick={() => setIsDrawMode(!isDrawMode)}
                className="w-full px-3 py-2 bg-[#1B4332] text-white rounded-lg text-sm font-medium hover:bg-[#14532D] transition-all"
              >
                Draw Zone
              </button>
              {isDrawMode && (
                <select
                  value={newZoneType}
                  onChange={(e) => setNewZoneType(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                >
                  <option value="safe">Safe</option>
                  <option value="danger">Danger</option>
                  <option value="trail">Trail</option>
                </select>
              )}
            </div>
          </div>

          {/* SOS Slide-down Notification */}
          {sosAlert && (
            <div className="absolute top-0 left-0 right-0 bg-[#DC2626] text-white p-4 z-20 animate-in slide-in-from-top">
              <div className="flex items-center justify-between max-w-4xl mx-auto">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5" />
                  <div>
                    <p className="font-semibold">🚨 SOS — {sosAlert.name} — {sosAlert.location ? `${sosAlert.location.lat.toFixed(4)}, ${sosAlert.location.lng.toFixed(4)}` : 'Unknown location'}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (sosAlert.location && mapRef.current) {
                      mapRef.current.flyTo([sosAlert.location.lat, sosAlert.location.lng], 16);
                    }
                    setSosAlert(null);
                  }}
                  className="px-3 py-1 bg-white text-red-600 rounded-lg text-sm font-medium hover:bg-stone-100 transition-all"
                >
                  View on Map
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (err) {
    console.error('AdminMap render error:', err);
    return <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
      <div className="text-[#DC2626]">Map error: {err.message}</div>
    </div>;
  }
};

export default AdminMap;
