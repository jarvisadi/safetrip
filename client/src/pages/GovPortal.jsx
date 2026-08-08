import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Users, Activity, CheckCircle, AlertTriangle, RefreshCw, MapPin, Shield, Building2, TrendingUp } from 'lucide-react';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const GovPortal = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [trends, setTrends] = useState([]);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, heatmapRes, incidentsRes, trendsRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/heatmap'),
        api.get('/analytics/recent-incidents'),
        api.get('/analytics/trends'),
      ]);
      console.log('Summary data:', summaryRes.data);
      console.log('Heatmap data:', heatmapRes.data);
      console.log('Incidents data:', incidentsRes.data);
      console.log('Trends data:', trendsRes.data);
      
      setSummary(summaryRes.data);
      setHeatmap(heatmapRes.data);
      setIncidents(incidentsRes.data);
      setTrends(trendsRes.data);
    } catch (error) {
      console.error('Error fetching portal data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRiskColor = (score) => {
    if (score > 70) return 'bg-[#FEE2E2] text-[#DC2626]';
    if (score > 40) return 'bg-[#FEF3C7] text-[#D97706]';
    return 'bg-[#D1FAE5] text-[#16A34A]';
  };

  const getIncidentTypeColor = (type) => {
    const colors = {
      sos: 'bg-[#FEE2E2] text-[#DC2626]',
      anomaly: 'bg-[#FEF3C7] text-[#D97706]',
      geofence_breach: 'bg-[#E9D5FF] text-[#9333EA]',
      wildlife: 'bg-[#FED7AA] text-[#F97316]',
      fraud_attempt: 'bg-[#FEF9C3] text-[#CA8A04]',
    };
    return colors[type] || 'bg-stone-100 text-stone-700';
  };

  const getIncidentTypeIcon = (type) => {
    switch (type) {
      case 'sos': return AlertTriangle;
      case 'anomaly': return Activity;
      case 'geofence_breach': return MapPin;
      case 'wildlife': return Shield;
      default: return Activity;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-[#FEE2E2] text-[#DC2626]',
      in_progress: 'bg-[#FEF3C7] text-[#D97706]',
      resolved: 'bg-[#D1FAE5] text-[#16A34A]',
    };
    return colors[status] || 'bg-stone-100 text-stone-700';
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return 'GO';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="text-[#78716C]">Loading Government Portal...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Government Header */}
      <div className="bg-[#1C1917] text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#D1FAE5] flex items-center justify-center">
              <Building2 className="w-7 h-7 text-[#1B4332]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Government Safety Portal</h1>
              <p className="text-[#A8A29E] text-sm">Real-time Tourist Safety Monitoring System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-[#A8A29E]">Logged in as:</p>
              <p className="text-sm font-medium">{user?.email || 'Government Official'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-medium">
              {getInitials(user?.name)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm p-2 mb-8 flex gap-2">
          <button
            onClick={() => navigate('/admin/map')}
            className="flex-1 sm:flex-none px-6 py-3 rounded-lg bg-[#1B4332] text-white font-medium transition-all flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Live Map
          </button>
          <button
            onClick={() => navigate('/admin/incidents')}
            className="flex-1 sm:flex-none px-6 py-3 rounded-lg text-[#78716C] hover:bg-stone-50 font-medium transition-all flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Incidents
          </button>
          <button
            onClick={() => navigate('/admin/analytics')}
            className="flex-1 sm:flex-none px-6 py-3 rounded-lg text-[#78716C] hover:bg-stone-50 font-medium transition-all flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Analytics
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#1C1917]">Overview</h2>
            <p className="text-[#78716C]">Monitoring tourist safety across the region</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E7E5E4] rounded-lg text-[#78716C] hover:border-[#1B4332] hover:text-[#1B4332] transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-6 h-6 text-[#1B4332]" />
              <span className="text-xs text-[#A8A29E]">Total Tourists</span>
            </div>
            <p className="text-3xl font-bold text-[#1C1917]">{summary?.totalTourists || 0}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-[#16A34A]">
              <TrendingUp className="w-3 h-3" />
              <span>+15% this week</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-6 h-6 text-[#16A34A]" />
              <span className="text-xs text-[#A8A29E]">Currently Active</span>
            </div>
            <p className="text-3xl font-bold text-[#16A34A]">{summary?.activeTourists || 0}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-[#78716C]">
              <span>Live tracking</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="w-6 h-6 text-[#DC2626]" />
              <span className="text-xs text-[#A8A29E]">Incidents This Week</span>
            </div>
            <p className="text-3xl font-bold text-[#DC2626]">{summary?.totalIncidents || 0}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-[#78716C]">
              <span>Requires attention</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-6 h-6 text-[#3B82F6]" />
              <span className="text-xs text-[#A8A29E]">Resolved</span>
            </div>
            <p className="text-3xl font-bold text-[#3B82F6]">{summary?.resolvedIncidents || 0}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-[#16A34A]">
              <TrendingUp className="w-3 h-3" />
              <span>+10% this week</span>
            </div>
          </div>
        </div>

        {/* District Map */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#1C1917]">Incident Heatmap</h2>
            <span className="text-xs text-[#A8A29E]">Real-time data</span>
          </div>
          <div className="h-96 rounded-xl overflow-hidden border border-[#E7E5E4]">
            <MapContainer
              key="gov-map"
              center={[20.5937, 78.9629]}
              zoom={5}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {heatmap.map((point, index) => (
                <CircleMarker
                  key={index}
                  center={[point.lat, point.lng]}
                  radius={Math.sqrt(point.count) * 3}
                  fillColor="#DC2626"
                  color="#B91C1C"
                  weight={1}
                  opacity={0.7}
                  fillOpacity={0.4}
                >
                  <Popup>
                    <div className="p-2">
                      <p className="font-semibold text-[#1C1917]">Incidents: {point.count}</p>
                      <p className="text-sm text-[#78716C]">Lat: {point.lat.toFixed(4)}, Lng: {point.lng.toFixed(4)}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Incidents Table */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-[#1C1917] mb-4">Recent Incidents</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-[#E7E5E4]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">Tourist Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">Incident Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">Risk Score</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">AI Message</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]">
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <AlertTriangle className="w-12 h-12 text-[#A8A29E] mx-auto mb-3" />
                      <p className="text-[#78716C]">No incidents recorded</p>
                    </td>
                  </tr>
                ) : (
                  incidents.map((incident) => {
                    const TypeIcon = getIncidentTypeIcon(incident.type);
                    return (
                      <tr key={incident.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#1C1917]">
                          {incident.tourist_name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getIncidentTypeColor(incident.type)}`}>
                            <TypeIcon className="w-3.5 h-3.5" />
                            {incident.type?.replace('_', ' ') || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getRiskColor(incident.risk_score || 0)}`}>
                            {incident.risk_score || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#78716C] max-w-xs truncate">
                          {incident.ai_message || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                            {incident.status?.replace('_', ' ') || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#A8A29E]">
                          {new Date(incident.created_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Alerts Chart */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#1C1917]">Incident Trends (Last 7 Days)</h2>
            <span className="text-xs text-[#A8A29E]">Weekly analysis</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                <XAxis dataKey="date" tickFormatter={formatDate} axisLine={false} tickLine={false} tick={{ fill: '#A8A29E', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A8A29E', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E7E5E4',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelFormatter={formatDate}
                />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#1B4332" strokeWidth={2} dot={{ fill: '#1B4332', strokeWidth: 2 }} name="Incidents" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovPortal;
