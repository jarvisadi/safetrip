import { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, AlertTriangle, Activity, MapPin, Shield } from 'lucide-react';

const AdminIncidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const response = await api.get('/incidents');
      setIncidents(response.data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/incidents/${id}`, { status: newStatus });
      fetchIncidents();
    } catch (error) {
      alert('Failed to update incident status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return 'bg-[#FEE2E2] text-[#DC2626]';
      case 'in_progress':
        return 'bg-[#FEF3C7] text-[#D97706]';
      case 'resolved':
        return 'bg-[#D1FAE5] text-[#16A34A]';
      default:
        return 'bg-stone-100 text-stone-700';
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'sos':
        return 'bg-[#FEE2E2] text-[#DC2626]';
      case 'anomaly':
        return 'bg-[#FEF3C7] text-[#D97706]';
      case 'wildlife':
        return 'bg-[#FED7AA] text-[#F97316]';
      case 'geofence_breach':
        return 'bg-[#E9D5FF] text-[#9333EA]';
      default:
        return 'bg-stone-100 text-stone-700';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'sos':
        return AlertTriangle;
      case 'anomaly':
        return Activity;
      case 'wildlife':
        return Shield;
      case 'geofence_breach':
        return MapPin;
      default:
        return Activity;
    }
  };

  const getRiskColor = (score) => {
    if (score >= 70) return 'text-[#DC2626]';
    if (score >= 40) return 'text-[#D97706]';
    return 'text-[#16A34A]';
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesFilter = activeFilter === 'all' || incident.type === activeFilter;
    const matchesSearch = searchQuery === '' || 
      incident.tourist_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.tourist_phone?.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'sos', label: 'SOS' },
    { id: 'anomaly', label: 'Anomaly' },
    { id: 'wildlife', label: 'Wildlife' },
    { id: 'geofence_breach', label: 'Geo-fence' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center">
        <div className="text-[#78716C]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1C1917]">Incident Reports</h1>
        <span className="text-sm text-[#78716C]">{incidents.length} total</span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeFilter === filter.id
                ? 'bg-[#1B4332] text-white'
                : 'bg-white text-[#78716C] border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-stone-100 shadow-sm">
        {filteredIncidents.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-16 h-16 text-[#A8A29E] mx-auto mb-4" />
            <p className="text-lg font-medium text-[#1C1917]">No incidents reported</p>
            <p className="text-sm text-[#78716C] mt-1">All tourists are safe</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-stone-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">
                    Tourist
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">
                    Risk
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#A8A29E] uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredIncidents.map((incident) => {
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
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white ${
                          incident.type === 'sos' ? 'bg-red-500' :
                          incident.type === 'anomaly' ? 'bg-amber-500' :
                          incident.type === 'wildlife' ? 'bg-orange-500' :
                          incident.type === 'geofence_breach' ? 'bg-purple-500' :
                          'bg-stone-500'
                        }`}>
                          <TypeIcon className="w-3 h-3" />
                          {incident.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-lg font-bold ${
                          incident.risk_score >= 70 ? 'text-red-600' :
                          incident.risk_score >= 40 ? 'text-amber-600' :
                          'text-green-600'
                        }`}>
                          {incident.risk_score}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#78716C] max-w-xs truncate">
                          {incident.ai_message}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#A8A29E]">
                        {new Date(incident.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            incident.status === 'open' ? 'bg-red-500' :
                            incident.status === 'in_progress' ? 'bg-amber-500' :
                            'bg-green-500'
                          }`} />
                          <span className="text-sm text-[#1C1917]">
                            {incident.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => {
                            const newStatus = incident.status === 'open' ? 'in_progress' : 
                                             incident.status === 'in_progress' ? 'resolved' : 'open';
                            updateStatus(incident.id, newStatus);
                          }}
                          className="px-3 py-1.5 bg-stone-100 text-[#1C1917] rounded-lg text-sm font-medium hover:bg-stone-200 transition-colors"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminIncidents;
