import React from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Calendar, DollarSign, Award, Layers } from 'lucide-react';

const CATEGORY_COLORS = ['#2E7D32', '#F9A825', '#1565C0', '#9C27B0', '#00897B'];

export default function AdminRevenue({ revenueData }) {
  const rev = revenueData || {};

  const revenueKPIs = [
    { label: "Today's Revenue", value: `₹${(rev.today || 0).toLocaleString('en-IN')}`, icon: Calendar, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { label: 'Weekly Revenue', value: `₹${(rev.weekly || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Monthly Revenue', value: `₹${(rev.monthly || 0).toLocaleString('en-IN')}`, icon: DollarSign, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { label: 'Yearly Revenue', value: `₹${(rev.yearly || 0).toLocaleString('en-IN')}`, icon: Award, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  ];

  const trendData = rev.trend || [
    { date: 'Mon', revenue: 12000 },
    { date: 'Tue', revenue: 18500 },
    { date: 'Wed', revenue: 14200 },
    { date: 'Thu', revenue: 22000 },
    { date: 'Fri', revenue: 26500 },
    { date: 'Sat', revenue: 19800 },
    { date: 'Sun', revenue: 24680 },
  ];

  const topProducts = rev.top_products || [
    { name: 'NPK 19-19-19', revenue: 12400, qty: 62 },
    { name: 'Coragen Insecticide', revenue: 15600, qty: 8 },
    { name: 'Byadgi Chilli Seeds', revenue: 8500, qty: 19 },
    { name: 'Bt Cotton Seeds', revenue: 6880, qty: 8 },
    { name: 'Bio-Zyme Booster', revenue: 4080, qty: 10 },
  ];

  const topCategories = rev.top_categories || [
    { name: 'Fertilizers', revenue: 18400 },
    { name: 'Pesticides', revenue: 15600 },
    { name: 'Seeds', revenue: 15380 },
    { name: 'Crop Nutrition', revenue: 4080 },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {revenueKPIs.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className={`bg-white rounded-2xl border-2 p-4 shadow-sm flex items-center gap-3.5 ${kpi.color}`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${kpi.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold opacity-75">{kpi.label}</p>
                <p className="text-xl font-black mt-0.5">{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Trend Line Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-gray-800">Revenue Growth Trend</h3>
            <p className="text-xs text-gray-400">Daily financial trajectory across North Karnataka delivery corridors</p>
          </div>
          <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
            Active Fulfillment
          </span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
            <Tooltip
              formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Gross Revenue']}
              contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }}
            />
            <Line type="monotone" dataKey="revenue" stroke="#2E7D32" strokeWidth={3.5} dot={{ r: 4, fill: '#2E7D32' }} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Row: Top Products & Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-black text-gray-800">Top Selling Products</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: '#374151' }} axisLine={false} tickLine={false} width={110} />
              <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} />
              <Bar dataKey="revenue" fill="#43A047" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-green-700" />
            <h3 className="text-sm font-black text-gray-800">Category Revenue Share</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={topCategories} dataKey="revenue" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4}>
                {topCategories.map((_, i) => (
                  <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Pie>
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Category Total']} contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
