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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1C1917]">Safety Analytics</h1>
        <span className="text-sm text-[#78716C]">Last updated 2 mins ago</span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tourists - Green */}
        <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-6 border-b-4 border-b-[#16A34A]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#D1FAE5] flex items-center justify-center">
              <Users className="w-5 h-5 text-[#16A34A]" />
            </div>
            <span className="text-sm text-[#78716C]">Total Tourists</span>
          </div>
          <p className="text-2xl font-bold text-[#1C1917]">{summary?.totalTourists || 0}</p>
        </div>

        {/* Active Incidents - Red */}
        <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-6 border-b-4 border-b-[#DC2626]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#FEE2E2] flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#DC2626]" />
            </div>
            <span className="text-sm text-[#78716C]">Active Incidents</span>
          </div>
          <p className="text-2xl font-bold text-[#DC2626]">{summary?.totalIncidents || 0}</p>
        </div>

        {/* Resolved Today - Green */}
        <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-6 border-b-4 border-b-[#16A34A]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#D1FAE5] flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[#16A34A]" />
            </div>
            <span className="text-sm text-[#78716C]">Resolved Today</span>
          </div>
          <p className="text-2xl font-bold text-[#16A34A]">{summary?.resolvedIncidents || 0}</p>
        </div>

        {/* Avg Risk Score - Amber */}
        <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-6 border-b-4 border-b-[#D97706]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#D97706]" />
            </div>
            <span className="text-sm text-[#78716C]">Avg Risk Score</span>
          </div>
          <p className="text-2xl font-bold text-[#D97706]">{summary?.avgRiskScore?.toFixed(1) || '0.0'}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Incidents this week */}
        <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#1C1917] mb-4">Incidents this week</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#A8A29E', fontSize: 12 }} 
              />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E7E5E4',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelFormatter={formatDate}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#1B4332" 
                strokeWidth={2} 
                dot={{ fill: '#1B4332', strokeWidth: 2 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stat Breakdown - Incident types */}
        <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#1C1917] mb-4">Incident Types</h2>
          <div className="space-y-4">
            {incidentsByTypeData.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#1C1917]">{item.name}</span>
                  <span className="text-sm font-semibold text-[#1C1917]">{item.count}</span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${(item.count / Math.max(...incidentsByTypeData.map(d => d.count), 1)) * 100}%`,
                      backgroundColor: item.color 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Incident Hotspots Map */}
      <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#1C1917] mb-4">Incident Hotspots</h2>
        <div className="h-[350px] rounded-xl overflow-hidden border border-stone-100">
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
    </div>
  );
};

export default AdminAnalytics;
