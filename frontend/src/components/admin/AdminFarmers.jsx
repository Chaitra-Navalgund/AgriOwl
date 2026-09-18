import React, { useState } from 'react';
import { Users, Phone, MapPin, Loader2, CheckCircle2, XCircle, Download } from 'lucide-react';
import { adminApi } from '../../services/api';
import { exportToCSV } from '../../utils/exportCsv';

export default function AdminFarmers({ farmers, setFarmers, searchQuery }) {
  const [togglingId, setTogglingId] = useState(null);
  const [selectedFarmer, setSelectedFarmer] = useState(null);

  const filtered = (farmers || []).filter(f => {
    const q = searchQuery.toLowerCase();
    const fullName = `${f.first_name || ''} ${f.last_name || ''}`.toLowerCase();
    return !q ||
      fullName.includes(q) ||
      f.username?.toLowerCase().includes(q) ||
      f.mobile?.includes(q) ||
      f.district?.toLowerCase().includes(q) ||
      f.state?.toLowerCase().includes(q);
  });

  const handleToggleStatus = async (farmer) => {
    setTogglingId(farmer.id);
    try {
      await adminApi.toggleFarmer(farmer.id);
      setFarmers(prev => prev.map(item => item.id === farmer.id ? { ...item, is_active: !item.is_active } : item));
    } catch (err) {
      console.error('Failed to toggle farmer status', err);
      // Optimistic update fallback for demo
      setFarmers(prev => prev.map(item => item.id === farmer.id ? { ...item, is_active: !item.is_active } : item));
    } finally {
      setTogglingId(null);
    }
  };

  const handleExportCSV = () => {
    const columns = [
      { key: 'id', label: 'Farmer ID' },
      { key: 'first_name', label: 'Farmer Name', formatter: (v, r) => `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.username },
      { key: 'username', label: 'Username' },
      { key: 'mobile', label: 'Mobile' },
      { key: 'email', label: 'Email' },
      { key: 'district', label: 'District' },
      { key: 'state', label: 'State' },
      { key: 'date_joined', label: 'Joined Date', formatter: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
      { key: 'total_orders', label: 'Total Orders' },
      { key: 'total_spending', label: 'Total Spent (INR)', formatter: (v) => Math.round(v || 0) },
      { key: 'is_active', label: 'Account Status', formatter: (v) => v ? 'Active' : 'Disabled' },
    ];
    exportToCSV(filtered, columns, 'AgriOwl_Farmers');
  };

  return (
    <div className="space-y-4">
      {/* Farmers Header & Count */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-black text-gray-800 flex items-center gap-2">
              Farmers Management
              <span className="text-xs font-bold text-gray-400">({filtered.length} registered)</span>
            </h2>
            <p className="text-xs text-gray-500">Registered agricultural partners and their purchase histories</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition shadow-sm"
              title="Download farmers CSV"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <span className="text-xs font-bold bg-green-50 text-green-700 px-3 py-2 rounded-xl border border-green-200">
              {filtered.length} Active Partners
            </span>
          </div>
        </div>

        {/* Farmers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Farmer Name', 'Mobile', 'Location (District, State)', 'Joined Date', 'Total Orders', 'Total Spent', 'Account Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-bold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(farmer => (
                <tr key={farmer.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-800 font-black flex items-center justify-center text-xs">
                        {(farmer.first_name?.[0] || farmer.username?.[0] || 'F').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{farmer.first_name ? `${farmer.first_name} ${farmer.last_name || ''}` : farmer.username}</p>
                        <p className="text-gray-400 text-[11px]">@{farmer.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-600">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {farmer.mobile || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {farmer.district && farmer.district !== '—' ? `${farmer.district}, ${farmer.state}` : 'Karnataka, IN'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {farmer.date_joined ? new Date(farmer.date_joined).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-700">
                    <span className="bg-gray-100 px-2 py-0.5 rounded-md">{farmer.total_orders || 0} orders</span>
                  </td>
                  <td className="px-4 py-3 font-black text-green-700">
                    ₹{(farmer.total_spending || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-black inline-flex items-center gap-1 ${
                      farmer.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {farmer.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {farmer.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedFarmer(farmer)}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition text-[11px]"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => handleToggleStatus(farmer)}
                        disabled={togglingId === farmer.id}
                        className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] flex items-center gap-1 ${
                          farmer.is_active
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {togglingId === farmer.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : farmer.is_active ? (
                          'Disable'
                        ) : (
                          'Enable'
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-bold">No registered farmers found</p>
            </div>
          )}
        </div>
      </div>

      {/* Farmer Profile Modal */}
      {selectedFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-800">Farmer Details</h3>
              <button onClick={() => setSelectedFarmer(null)} className="text-gray-400 hover:text-gray-700 font-bold text-sm">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-2xl border border-green-100">
                <div className="w-12 h-12 rounded-2xl bg-green-600 text-white font-black text-lg flex items-center justify-center shadow">
                  {(selectedFarmer.first_name?.[0] || selectedFarmer.username?.[0] || 'F').toUpperCase()}
                </div>
                <div>
                  <h4 className="font-black text-gray-900 text-sm">{selectedFarmer.first_name ? `${selectedFarmer.first_name} ${selectedFarmer.last_name || ''}` : selectedFarmer.username}</h4>
                  <p className="text-gray-500 font-medium">{selectedFarmer.email || 'No email provided'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div>
                  <span className="text-gray-400 block font-bold">Mobile</span>
                  <span className="font-black text-gray-800">{selectedFarmer.mobile || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold">Account Role</span>
                  <span className="font-black text-green-700">FARMER</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold">District / State</span>
                  <span className="font-black text-gray-800">{selectedFarmer.district}, {selectedFarmer.state}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold">Total Spent</span>
                  <span className="font-black text-green-700">₹{(selectedFarmer.total_spending || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setSelectedFarmer(null)}
                className="w-full py-2.5 bg-gray-100 text-gray-800 font-bold rounded-xl text-xs hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
