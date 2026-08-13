import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const AdminMap = () => {
  console.log('AdminMap rendering');
  
  const [tourists, setTourists] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Fetch geofences on mount
  useEffect(() => {
    const fetchGeofences = async () => {
      try {
        const res = await api.get('/geofences');
        setGeofences(res.data || []);
      } catch(err) {
        console.error('Geofence fetch error:', err);
      }
    };
    fetchGeofences();
  }, []);

  // Socket connection for live tourists
  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('Admin socket connected');
      socket.emit('admin:join');
    });

    socket.on('admin:tourist_moved', (data) => {
      setTourists(prev => {
        const existing = prev.find(t => t.touristId === data.touristId);
        if (existing) {
          return prev.map(t => t.touristId === data.touristId ? data : t);
        }
        return [...prev, data];
      });
    });

    socket.on('admin:sos_alert', (data) => {
      setAlerts(prev => [data, ...prev].slice(0, 10));
    });

    socket.on('admin:wildlife_alert', (data) => {
      setAlerts(prev => [data, ...prev].slice(0, 10));
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div className="flex h-full" style={{ height: 'calc(100vh - 64px)' }}>
      
      {/* Left sidebar */}
      <div className="w-80 bg-white border-r border-stone-100 overflow-y-auto flex-shrink-0">
        
        {/* Active tourists */}
        <div className="p-4 border-b border-stone-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-stone-800">Active Tourists</h3>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
              {tourists.length} live
            </span>
          </div>
          
          {tourists.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <MapPin className="w-5 h-5 text-stone-400" />
              </div>
              <p className="text-sm text-stone-400">No active tourists</p>
              <p className="text-xs text-stone-300 mt-1">
                Tourists appear here when they login
              </p>
            </div>
          ) : (
            tourists.map((tourist) => (
              <div key={tourist.touristId} 
                className="flex items-center gap-3 py-3 border-b border-stone-50 last:border-0">
                <div className="w-9 h-9 rounded-full bg-green-900 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {tourist.name?.charAt(0)?.toUpperCase() || 'T'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">
                    {tourist.name}
                  </p>
                  <p className="text-xs text-stone-400">
                    {tourist.lastLocation ? 
                      `${parseFloat(tourist.lastLocation.lat).toFixed(4)}, ${parseFloat(tourist.lastLocation.lng).toFixed(4)}` : 
                      'Location pending...'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  tourist.riskScore > 70 ? 
                    'bg-red-100 text-red-700' :
                  tourist.riskScore > 40 ? 
                    'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                }`}>
                  {tourist.riskScore > 70 ? 'High' : 
                   tourist.riskScore > 40 ? 'Medium' : 'Low'}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Recent alerts */}
        <div className="p-4">
          <h3 className="font-semibold text-stone-800 mb-3">
            Recent Alerts
          </h3>
          {alerts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-stone-400">No alerts</p>
              <p className="text-xs text-stone-300 mt-1">All tourists safe</p>
            </div>
          ) : (
            alerts.map((alert, i) => (
              <div key={i} className="flex gap-2 py-2 border-b border-stone-50 last:border-0">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-stone-700">
                    {alert.name} — {alert.type || 'Alert'}
                  </p>
                  <p className="text-xs text-stone-400">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative">
        <MapContainer
          key="admin-map"
          center={[20.5937, 78.9629]}
          zoom={5}
          scrollWheelZoom={true}
          zoomControl={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Tourist markers */}
          {tourists.map((tourist) => (
            tourist.lastLocation && (
              <Marker
                key={tourist.touristId}
                position={[
                  parseFloat(tourist.lastLocation.lat),
                  parseFloat(tourist.lastLocation.lng)
                ]}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{tourist.name}</p>
                    <p className="text-stone-500">
                      Risk: {tourist.riskScore}/100
                    </p>
                  </div>
                </Popup>
              </Marker>
            )
          ))}

          {/* Geofence zones */}
          {geofences.map((zone) => (
            zone.polygon && (
              <Polygon
                key={zone.id}
                positions={zone.polygon.map(p => [p.lat, p.lng])}
                pathOptions={{
                  color: zone.type === 'danger' ? '#DC2626' : 
                         zone.type === 'safe' ? '#16A34A' : '#2563EB',
                  fillOpacity: 0.15,
                  weight: 2
                }}
              >
                <Popup>{zone.name} — {zone.type}</Popup>
              </Polygon>
            )
          ))}
        </MapContainer>

        {/* SOS Alert toast */}
        {alerts.length > 0 && alerts[0].type === 'sos' && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span className="font-semibold text-sm">
              🚨 SOS — {alerts[0].name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMap;
