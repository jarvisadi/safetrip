import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip, Circle, useMap } from 'react-leaflet';
import { Icon, divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import socket, { connectSocket, disconnectSocket, joinAdminRoom, onTouristMoved, onSOSAlert, offTouristMoved, offSOSAlert } from '../services/socket';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

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

  try {
    return (
      <div className="min-h-screen bg-gray-100">
        {loading ? (
        <div className="flex h-screen">
          {/* Sidebar Skeleton */}
          <div className="w-80 bg-white shadow-lg animate-pulse">
            <div className="p-4 border-b">
              <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="p-4 border-b">
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
            <div className="p-4 border-b">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg mb-3"></div>
              ))}
            </div>
          </div>

          {/* Map Skeleton */}
          <div className="flex-1 bg-gray-200 animate-pulse"></div>
        </div>
      ) : (
        <>
          {/* SOS Alert Banner */}
          {sosAlert && (
        <div className="bg-red-600 text-white p-4 animate-pulse">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-bold text-lg">SOS ALERT</p>
                <p className="text-sm">{sosAlert.name} - {sosAlert.phone}</p>
              </div>
            </div>
            <button
              onClick={() => setSosAlert(null)}
              className="text-white hover:text-gray-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Geofence Breach Alert Banner */}
      {geofenceAlert && (
        <div className="bg-orange-600 text-white p-4 animate-pulse">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-bold text-lg">GEOFENCE BREACH</p>
                <p className="text-sm">{geofenceAlert.name} entered danger zone: {geofenceAlert.geofence}</p>
              </div>
            </div>
            <button
              onClick={() => setGeofenceAlert(null)}
              className="text-white hover:text-gray-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Wildlife Alert Banner */}
      {Array.from(wildlifeAlerts.values()).map((alert) => (
        <div key={alert.touristId} className="bg-orange-500 text-white p-4 animate-pulse">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-2xl">🦁</span>
              <div>
                <p className="font-bold text-lg">WILDLIFE DETECTED</p>
                <p className="text-sm">{alert.name} - {alert.animal} ({alert.dangerLevel} danger)</p>
                <p className="text-xs mt-1">{alert.advice}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setWildlifeAlerts((prev) => {
                  const newMap = new Map(prev);
                  newMap.delete(alert.touristId);
                  return newMap;
                });
              }}
              className="text-white hover:text-gray-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-lg overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Admin Map</h2>
            <p className="text-gray-500 text-sm">{activeTourists.size} tourists online</p>
          </div>
          
          {/* Draw Mode Controls */}
          <div className="p-4 border-b">
            <button
              onClick={() => setIsDrawMode(!isDrawMode)}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                isDrawMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isDrawMode ? 'Cancel Draw Mode' : 'Draw New Zone'}
            </button>
            
            {isDrawMode && (
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  placeholder="Zone name"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="w-full p-2 border rounded"
                />
                <select
                  value={newZoneType}
                  onChange={(e) => setNewZoneType(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="safe">Safe Zone (Green)</option>
                  <option value="danger">Danger Zone (Red)</option>
                  <option value="trail">Trail Zone (Blue)</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveZone}
                    disabled={drawnPoints.length < 3 || !newZoneName}
                    className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-green-400"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelDraw}
                    className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
                  >
                    Clear
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  Points: {drawnPoints.length} (min 3)
                </p>
              </div>
            )}
          </div>

          <div className="p-4 border-b">
            <h3 className="font-semibold mb-2">Active Tourists</h3>
            {Array.from(activeTourists.values()).map((tourist) => (
              <div
                key={tourist.touristId}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => {
                  if (tourist.location && mapRef.current) {
                    mapRef.current.flyTo([tourist.location.lat, tourist.location.lng], 16);
                  }
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  {tourist.photoUrl ? (
                    <img
                      src={tourist.photoUrl}
                      alt={tourist.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">{tourist.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{tourist.name}</p>
                    <p className="text-gray-500 text-xs">{tourist.phone}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBadge(tourist.riskScore)}`}>
                    {getRiskLabel(tourist.riskScore)}
                  </span>
                  {tourist.location && (
                    <span className="text-xs text-gray-500">
                      {tourist.location.lat.toFixed(4)}, {tourist.location.lng.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {activeTourists.size === 0 && (
              <p className="text-gray-500 text-center py-8">No active tourists</p>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1">
          <div style={{ height: 'calc(100vh - 120px)', width: '100%', position: 'relative', zIndex: 0 }}>
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
          </div>
        </div>
      </div>
      </>
      )}
    </div>
    );
  } catch (err) {
    console.error('AdminMap render error:', err);
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-red-600">Map error: {err.message}</div>
    </div>;
  }
};

export default AdminMap;
