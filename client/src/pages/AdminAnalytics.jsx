import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import api from '../services/api';
import { Users, Activity, CheckCircle, TrendingUp, RefreshCw, MapPin, AlertTriangle, Shield } from 'lucide-react';

// Fix for default marker icon in react-leaflet
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const COLORS = {
  sos: '#DC2626',
  anomaly: '#D97706',
  geofence: '#9333EA',
  wildlife: '#F97316',
};

const AdminAnalytics = () => {
  const [summary, setSummary] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [trends, setTrends] = useState([]);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
    const interval = setInterval(fetchAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const [summaryRes, heatmapRes, trendsRes, incidentsRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/heatmap'),
        api.get('/analytics/trends'),
        api.get('/analytics/recent-incidents'),
      ]);

      console.log('Analytics summary:', summaryRes.data);
      setSummary(summaryRes.data);
      setHeatmap(heatmapRes.data);
      setTrends(trendsRes.data);
      setRecentIncidents(incidentsRes.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const incidentsByTypeData = summary ? [
    { name: 'SOS', count: summary.incidentsByType.sos, color: COLORS.sos },
    { name: 'Anomaly', count: summary.incidentsByType.anomaly, color: COLORS.anomaly },
    { name: 'Geo-fence', count: summary.incidentsByType.geofence_breach, color: COLORS.geofence },
    { name: 'Wildlife', count: summary.incidentsByType.wildlife, color: COLORS.wildlife },
  ] : [];

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open': return 'bg-[#FEE2E2] text-[#DC2626]';
      case 'in_progress': return 'bg-[#FEF3C7] text-[#D97706]';
      case 'resolved': return 'bg-[#D1FAE5] text-[#16A34A]';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'sos': return 'bg-[#FEE2E2] text-[#DC2626]';
      case 'anomaly': return 'bg-[#FEF3C7] text-[#D97706]';
      case 'geofence_breach': return 'bg-[#E9D5FF] text-[#9333EA]';
      case 'wildlife': return 'bg-[#FED7AA] text-[#F97316]';
      default: return 'bg-stone-100 text-stone-700';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'sos': return AlertTriangle;
      case 'anomaly': return Activity;
      case 'wildlife': return Shield;
      case 'geofence_breach': return MapPin;
      default: return Activity;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="text-[#78716C]">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1C1917] tracking-tight">Safety Analytics</h1>
            <p className="text-[#78716C] mt-1">Real-time safety metrics and incident trends</p>
          </div>
          <button
            onClick={fetchAnalyticsData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E7E5E4] rounded-lg text-[#78716C] hover:border-[#1B4332] hover:text-[#1B4332] transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-6 h-6 text-[#1B4332]" />
              <span className="text-xs text-[#A8A29E]">Total Tourists</span>
            </div>
            <p className="text-3xl font-bold text-[#1C1917]">{summary?.totalTourists || 0}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-[#16A34A]">
              <TrendingUp className="w-3 h-3" />
              <span>+12% this week</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-6 h-6 text-[#D97706]" />
              <span className="text-xs text-[#A8A29E]">Active Incidents</span>
            </div>
            <p className="text-3xl font-bold text-[#D97706]">{summary?.totalIncidents || 0}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-[#78716C]">
              <span>Currently active</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-6 h-6 text-[#16A34A]" />
              <span className="text-xs text-[#A8A29E]">Resolved</span>
            </div>
            <p className="text-3xl font-bold text-[#16A34A]">{summary?.resolvedIncidents || 0}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-[#16A34A]">
              <TrendingUp className="w-3 h-3" />
              <span>+8% this week</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-6 h-6 text-[#3B82F6]" />
              <span className="text-xs text-[#A8A29E]">Avg Risk Score</span>
            </div>
            <p className="text-3xl font-bold text-[#3B82F6]">{summary?.avgRiskScore?.toFixed(1) || '0.0'}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-[#78716C]">
              <span>Out of 100</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Line Chart - Incident Trends */}
          <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#1C1917] mb-4">Incidents Over 7 Days</h2>
            <ResponsiveContainer width="100%" height={300}>
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
                <Line type="monotone" dataKey="count" stroke="#1B4332" strokeWidth={2} dot={{ fill: '#1B4332', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart - Incidents by Type */}
          <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#1C1917] mb-4">Incidents by Type</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={incidentsByTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {incidentsByTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E7E5E4',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  formatter={(value, entry) => (
                    <span style={{ color: '#78716C', fontSize: 12 }}>{value}: {entry.payload.count}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap Map */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-[#1C1917] mb-4">Incident Hotspots</h2>
          <div className="h-96 rounded-xl overflow-hidden border border-[#E7E5E4]">
            <MapContainer
              key="analytics-map"
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
                  radius={Math.min(point.count * 5 + 10, 50)}
                  fillColor="#DC2626"
                  color="#DC2626"
                  weight={1}
                  opacity={0.7}
                  fillOpacity={0.5}
                >
                  <Popup>
                    <div className="p-2">
                      <p className="font-semibold text-[#1C1917]">Incident Hotspot</p>
                      <p className="text-sm text-[#78716C]">Incidents: {point.count}</p>
                      <p className="text-xs text-[#A8A29E]">Lat: {point.lat.toFixed(4)}, Lng: {point.lng.toFixed(4)}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Recent Incidents Table */}
        <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1C1917] mb-4">Recent Incidents</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-[#E7E5E4]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">
                    Tourist
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">
                    AI Message
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4]">
                {recentIncidents.map((incident) => {
                  const TypeIcon = getTypeIcon(incident.type);
                  return (
                    <tr key={incident.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {incident.photo_url ? (
                            <img
                              src={incident.photo_url}
                              alt={incident.tourist_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-medium">
                              {getInitials(incident.tourist_name)}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-[#1C1917]">
                              {incident.tourist_name}
                            </div>
                            <div className="text-sm text-[#A8A29E]">
                              {incident.tourist_phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getTypeBadge(incident.type)}`}>
                          <TypeIcon className="w-3.5 h-3.5" />
                          {incident.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#78716C] max-w-xs truncate">
                          {incident.ai_message || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getStatusBadge(incident.status)}`}>
                          {incident.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#A8A29E]">
                        {new Date(incident.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
                {recentIncidents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <AlertTriangle className="w-12 h-12 text-[#A8A29E] mx-auto mb-3" />
                      <p className="text-[#78716C]">No incidents recorded</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
